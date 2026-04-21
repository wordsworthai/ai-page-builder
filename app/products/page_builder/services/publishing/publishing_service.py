"""
Publishing service for S3 uploads and CloudFront invalidation.
Features: Hashed Storage, Decoupled Backups, Non-blocking I/O, Batch Deletes.
"""
import asyncio
import functools
import hashlib
import re
import uuid
from datetime import datetime, UTC
from typing import Optional, List

import boto3
from botocore.exceptions import ClientError
from fastapi import Depends, HTTPException, Request, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.config import config
from app.products.page_builder.config.aws import aws_config
from app.core.db import get_async_db_session
from app.core.db_mongo import get_mongo_database
from app.shared.models import BusinessUser, Business
from app.products.page_builder.models import Website, WebsitePage, PagePublishHistory, GenerationVersion
from app.shared.schemas.auth.auth import CurrentUserResponse
from app.shared.services.auth.users_service import get_current_user_optional
from app.products.page_builder.utils.html_processor import (
    HTMLProcessingError,
    WWAI_BASE_STYLE_FILENAME,
    compute_html_hash,
    get_file_size_bytes,
    get_wwai_base_style_css_bytes,
    process_html_for_publishing,
    validate_html_size,
)


class PublishingService:
    """Service for publishing pages to S3 and CloudFront with metadata tracking"""
    
    def __init__(
        self,
        db: AsyncSession,
        current_user: Optional[CurrentUserResponse],
        request: Request,
    ):
        self.db = db
        self.current_user = current_user
        self.request = request
        
        # Boto3 clients are synchronous. We will run methods in a thread pool.
        # Publishing uses its own bucket/region (falls back to general AWS config if not set)
        self.publish_bucket = aws_config.publish_bucket
        self.s3_client = boto3.client(
            "s3",
            **({"endpoint_url": aws_config.publish_endpoint_url} if aws_config.publish_endpoint_url else {}),
            aws_access_key_id=aws_config.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=aws_config.AWS_SECRET_ACCESS_KEY,
            region_name=aws_config.publish_region
        )
        self.cloudfront_client = boto3.client(
            "cloudfront",
            aws_access_key_id=aws_config.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=aws_config.AWS_SECRET_ACCESS_KEY,
            region_name=aws_config.publish_region
        )


    async def _upload_wwai_boilerplate_css(self, storage_folder: str) -> None:
        """Upload bundled wwai_base_style.css into the hashed S3 folder (same pattern as HTML)."""
        try:
            body = get_wwai_base_style_css_bytes()
        except HTMLProcessingError as e:
            raise HTTPException(status_code=500, detail=str(e.detail)) from e
        key = f"{storage_folder}/{WWAI_BASE_STYLE_FILENAME}"
        await self._run_in_thread(
            self.s3_client.put_object,
            Bucket=self.publish_bucket,
            Key=key,
            Body=body,
            ContentType="text/css",
            CacheControl="public, max-age=3600",
        )

    async def _run_in_thread(self, func, *args, **kwargs):
        """Helper to run synchronous boto3 calls in a separate thread to avoid blocking"""
        loop = asyncio.get_event_loop()
        partial_func = functools.partial(func, *args, **kwargs)
        return await loop.run_in_executor(None, partial_func)
    
    async def get_editor_defaults(self) -> dict:
        """Get pre-fill data for editor publish modal."""
        if not self.current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        business_id = self.current_user.business_id
        if not business_id:
            raise HTTPException(status_code=400, detail="User has no associated business.")
        
        # Fetch the actual business
        business = await self.db.get(Business, business_id)
        business_name = business.business_name if business else (self.current_user.full_name or "My Business")
        suggested_subdomain = self._generate_subdomain_from_name(business_name)
        
        result = await self.db.execute(
            select(Website).where(Website.business_id == business_id)
        )
        existing_website = result.scalar_one_or_none()
        
        response_data = {
            "business_name": business_name,
            "suggested_subdomain": suggested_subdomain,
            "existing_website": None
        }
        
        if existing_website:
            page_result = await self.db.execute(
                select(WebsitePage).where(
                    WebsitePage.website_id == existing_website.website_id,
                    WebsitePage.page_path == "/"
                )
            )
            homepage = page_result.scalar_one_or_none()
            
            if homepage:
                live_url = self._construct_cloudfront_url(existing_website.subdomain, "/")
                response_data["existing_website"] = {
                    "website_id": str(existing_website.website_id),
                    "subdomain": existing_website.subdomain,
                    "website_name": existing_website.website_name,
                    "is_published": existing_website.is_published,
                    "published_at": existing_website.published_at,
                    "live_url": live_url if existing_website.is_published else None,
                    "homepage": {
                        "page_id": str(homepage.page_id),
                        "page_title": homepage.page_title,
                        "description": homepage.description,
                        "last_published_at": homepage.last_published_at,
                        "publish_count": homepage.publish_count,
                    }
                }
        
        return response_data
    
    async def publish_from_editor(
        self,
        subdomain: str,
        website_title: str,
        html_file: UploadFile,
        description: Optional[str] = None,
        favicon_file: Optional[UploadFile] = None,
        cleanup_old_path: bool = True,
        page_routes: Optional[List[str]] = None,
        page_html_files: Optional[List[UploadFile]] = None,
        page_titles: Optional[List[str]] = None,
    ) -> dict:
        """
        Unified publish endpoint with Hashed Storage, Backups, and Safe Renaming.
        Supports multi-page publishing when page_routes and page_html_files are provided.
        """
        if not self.current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        business_id = self.current_user.business_id
        if not business_id:
            raise HTTPException(status_code=400, detail="User has no associated business")
        
        subdomain = subdomain.lower().strip()
        if not re.match(r'^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$', subdomain):
            raise HTTPException(
                status_code=400,
                detail="Invalid subdomain format. Use alphanumeric and hyphens only (3-63 chars)"
            )
        
        result = await self.db.execute(
            select(Website).where(Website.business_id == business_id)
        )
        existing_website = result.scalar_one_or_none()
        
        is_new_website = existing_website is None
        subdomain_changed = False
        
        if existing_website:
            # Update flow
            subdomain_changed = existing_website.subdomain != subdomain
            
            if subdomain_changed:
                is_available = await self._check_subdomain_available(subdomain, existing_website.website_id)
                if not is_available:
                    raise HTTPException(status_code=409, detail=f"Subdomain '{subdomain}' is already taken")
                
                # Move S3 files between Hashes (Async)
                await self._move_s3_files(
                    existing_website.subdomain, 
                    subdomain, 
                    delete_old=cleanup_old_path
                )
                
                existing_website.subdomain = subdomain
            
            existing_website.website_name = website_title
            existing_website.last_published_at = datetime.now(UTC).replace(tzinfo=None)

            # Multi-page publish flow
            if page_routes and page_html_files and len(page_routes) >= 1:
                result_data = await self._publish_all_pages(
                    website=existing_website,
                    page_routes=page_routes,
                    page_html_files=page_html_files,
                    page_titles=page_titles,
                    description=description,
                    favicon_file=favicon_file,
                )
            else:
                # Single-page publish flow (backwards compatible)
                page_result = await self.db.execute(
                    select(WebsitePage).where(
                        WebsitePage.website_id == existing_website.website_id,
                        WebsitePage.page_path == "/"
                    )
                )
                homepage = page_result.scalar_one_or_none()

                if not homepage:
                    raise HTTPException(status_code=500, detail="Website exists but homepage not found")

                result_data = await self._publish_page_content(
                    website=existing_website,
                    page=homepage,
                    html_file=html_file,
                    description=description,
                    favicon_file=favicon_file,
                )
        else:
            # Create new website flow
            is_available = await self._check_subdomain_available(subdomain)
            if not is_available:
                raise HTTPException(status_code=409, detail=f"Subdomain '{subdomain}' is already taken")
            
            result_data = await self._create_and_publish_website(
                business_id=business_id,
                subdomain=subdomain,
                website_title=website_title,
                html_file=html_file,
                description=description,
                favicon_file=favicon_file,
            )

            # If multi-page and new website was just created, publish remaining pages
            if page_routes and page_html_files and len(page_routes) >= 1:
                website_result = await self.db.execute(
                    select(Website).where(Website.business_id == business_id)
                )
                new_website = website_result.scalar_one_or_none()
                if new_website:
                    result_data = await self._publish_all_pages(
                        website=new_website,
                        page_routes=page_routes,
                        page_html_files=page_html_files,
                        page_titles=page_titles,
                        description=description,
                        favicon_file=None,  # Already uploaded by _create_and_publish_website
                    )

        result_data["is_new_website"] = is_new_website
        result_data["subdomain_changed"] = subdomain_changed
        
        return result_data
    
    async def publish_page(
        self,
        page_id: uuid.UUID,
        html_file: UploadFile
    ) -> dict:
        """
        Publish a specific page (used by the standalone publish-page endpoint).
        """
        # 1. Get page and website
        page = await self.db.get(WebsitePage, page_id)
        if not page:
            raise HTTPException(status_code=404, detail="Page not found")
        
        # 2. Validate ownership via website
        website = await self._get_website_with_validation(page.website_id)
        
        # 3. Publish using the unified content publisher
        return await self._publish_page_content(
            website=website,
            page=page,
            html_file=html_file,
            description=None,  # Do not update description on quick page publish
            favicon_file=None  # Do not update favicon on page publish
        )

    async def _create_and_publish_website(
        self,
        business_id: uuid.UUID,
        subdomain: str,
        website_title: str,
        html_file: UploadFile,
        description: Optional[str],
        favicon_file: Optional[UploadFile],
    ) -> dict:
        """Create new website + homepage and publish"""
        website = Website(
            website_id=uuid.uuid4(),
            business_id=business_id,
            subdomain=subdomain,
            website_name=website_title,
            is_published=True,
            published_at=datetime.now(UTC).replace(tzinfo=None),
            last_published_at=datetime.now(UTC).replace(tzinfo=None),
            created_at=datetime.now(UTC).replace(tzinfo=None)
        )
        self.db.add(website)
        await self.db.flush()
        
        page = WebsitePage(
            page_id=uuid.uuid4(),
            website_id=website.website_id,
            page_path="/",
            page_title=website_title,
            description=description,
            is_published=True,
            published_at=datetime.now(UTC).replace(tzinfo=None),
            last_published_at=datetime.now(UTC).replace(tzinfo=None),
            created_at=datetime.now(UTC).replace(tzinfo=None)
        )
        self.db.add(page)
        await self.db.flush()
        
        try:
            result_data = await self._publish_page_content(
                website=website,
                page=page,
                html_file=html_file,
                description=description,
                favicon_file=favicon_file,
            )
            await self.db.commit()
            await self.db.refresh(website)
            await self.db.refresh(page)
            return result_data
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to publish: {str(e)}")
    
    async def _publish_page_content(
        self,
        website: Website,
        page: WebsitePage,
        html_file: UploadFile,
        description: Optional[str],
        favicon_file: Optional[UploadFile],
    ) -> dict:
        """Core publishing logic: Hashed Path + Async Backup + Non-blocking Upload"""
        
        html_content = await html_file.read()
        validate_html_size(html_content)
        
        if not html_content:
            raise HTTPException(status_code=400, detail="HTML file is empty")
        
        # 1. Handle Favicon (Uploads to Hashed Folder)
        storage_folder = self._get_storage_folder(website.subdomain)
        favicon_filename = self._get_existing_favicon_filename(website)

        if favicon_file:
            favicon_content = await favicon_file.read()
            if favicon_file.filename:
                ext = favicon_file.filename.split('.')[-1].lower()
                if ext in ['png', 'svg', 'jpg', 'jpeg', 'ico']:
                    favicon_filename = f"favicon.{ext}"
            
            # Non-blocking Favicon Upload
            await self._run_in_thread(
                self.s3_client.put_object,
                Bucket=self.publish_bucket,
                Key=f"{storage_folder}/{favicon_filename}",
                Body=favicon_content,
                ContentType=self._get_favicon_content_type(favicon_filename),
                CacheControl="public, max-age=3600"
            )
            website.favicon_url = f"https://{website.subdomain}.{aws_config.CLOUDFRONT_DOMAIN}/{favicon_filename}"
        
        await self._upload_wwai_boilerplate_css(storage_folder)
        
        # 2. Process HTML
        try:
            base_url = (config.backend_url or "").strip() or "http://localhost:8020"
            form_submit_endpoint = f"{base_url.rstrip('/')}/api/forms/form-submissions"
            processed_html = process_html_for_publishing(
                html_content=html_content.decode('utf-8'),
                page_title=page.page_title,
                description=description or page.description,
                favicon_filename=favicon_filename,
                inject_tailwind=True,
                form_submit_endpoint=form_submit_endpoint,
            )
            processed_html_bytes = processed_html.encode('utf-8')
        except HTMLProcessingError as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"HTML processing failed: {str(e)}")
        
        html_hash = compute_html_hash(processed_html)
        html_size = get_file_size_bytes(processed_html_bytes)
        
        # 3. Construct Live Path (Hashed)
        if page.page_path == "/":
            s3_path = f"{storage_folder}/index.html"
        else:
            clean_path = page.page_path.lstrip("/")
            s3_path = f"{storage_folder}/{clean_path}/index.html"
        
        # 4. PERFORM BACKUP (Non-blocking)
        # Decoupled path: backups/{business_id}/{timestamp}/index.html
        timestamp = datetime.now(UTC).replace(tzinfo=None).strftime('%Y%m%d_%H%M%S')
        backup_key = f"backups/{website.business_id}/{timestamp}/{page.page_path.lstrip('/')}/index.html"
        
        try:
            await self._run_in_thread(
                self.s3_client.copy_object,
                Bucket=self.publish_bucket,
                CopySource={'Bucket': self.publish_bucket, 'Key': s3_path},
                Key=backup_key
            )
        except Exception:
            # Ignore 404 (first time publish)
            pass

        # 5. Upload New Content (Non-blocking)
        success = await self._run_in_thread(
            self._upload_to_s3_sync,
            s3_path,
            processed_html_bytes,
            "text/html"
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to upload to S3")
        
        # 6. Invalidate CloudFront (Public URL Path)
        cloudfront_path = self._construct_cloudfront_path(website.subdomain, page.page_path)
        css_cf_path = f"/{storage_folder}/{WWAI_BASE_STYLE_FILENAME}"
        
        def _invalidate():
            return self.cloudfront_client.create_invalidation(
                DistributionId=aws_config.CLOUDFRONT_DISTRIBUTION_ID,
                InvalidationBatch={
                    "Paths": {"Quantity": 2, "Items": [cloudfront_path, css_cf_path]},
                    "CallerReference": str(uuid.uuid4())
                }
            )
        
        try:
            inv_response = await self._run_in_thread(_invalidate)
            invalidation_id = inv_response["Invalidation"]["Id"]
        except Exception as e:
            print(f"Invalidation error: {e}")
            invalidation_id = None
        
        # Update Metadata
        page.last_s3_path = s3_path
        page.last_cloudfront_url = self._construct_cloudfront_url(website.subdomain, page.page_path)
        page.last_invalidation_id = invalidation_id
        page.last_published_at = datetime.now(UTC).replace(tzinfo=None)
        page.publish_count += 1
        
        if description:
            page.description = description
        
        page.is_published = True
        page.published_at = datetime.now(UTC).replace(tzinfo=None)
        website.is_published = True
        website.published_at = datetime.now(UTC).replace(tzinfo=None)
        website.last_published_at = datetime.now(UTC).replace(tzinfo=None)
        
        history_entry = PagePublishHistory(
            publish_id=uuid.uuid4(),
            page_id=page.page_id,
            website_id=website.website_id,
            business_id=website.business_id,
            s3_path=s3_path,
            cloudfront_url=page.last_cloudfront_url,
            invalidation_id=invalidation_id,
            html_version_hash=html_hash,
            html_size_bytes=html_size,
            status="success",
            published_at=datetime.now(UTC).replace(tzinfo=None)
        )
        self.db.add(history_entry)
        self.db.add(page)
        self.db.add(website)
        await self.db.commit()
        await self.db.refresh(page)
        await self.db.refresh(website)
        
        return {
            "website_id": str(website.website_id),
            "page_id": str(page.page_id),
            "subdomain": website.subdomain,
            "cloudfront_url": page.last_cloudfront_url,
            "s3_path": s3_path,
            "invalidation_id": invalidation_id,
            "pages_published": 1,
        }

    async def _publish_all_pages(
        self,
        website: Website,
        page_routes: List[str],
        page_html_files: List[UploadFile],
        page_titles: Optional[List[str]],
        description: Optional[str],
        favicon_file: Optional[UploadFile],
    ) -> dict:
        """
        Publish multiple pages at once. Each page gets its own HTML file
        uploaded to its own S3 path.
        """
        storage_folder = self._get_storage_folder(website.subdomain)
        favicon_filename = self._get_existing_favicon_filename(website)

        # 1. Handle Favicon (upload once)
        if favicon_file:
            favicon_content = await favicon_file.read()
            if favicon_file.filename:
                ext = favicon_file.filename.split('.')[-1].lower()
                if ext in ['png', 'svg', 'jpg', 'jpeg', 'ico']:
                    favicon_filename = f"favicon.{ext}"

            await self._run_in_thread(
                self.s3_client.put_object,
                Bucket=self.publish_bucket,
                Key=f"{storage_folder}/{favicon_filename}",
                Body=favicon_content,
                ContentType=self._get_favicon_content_type(favicon_filename),
                CacheControl="public, max-age=3600"
            )
            website.favicon_url = f"https://{website.subdomain}.{aws_config.CLOUDFRONT_DOMAIN}/{favicon_filename}"

        await self._upload_wwai_boilerplate_css(storage_folder)

        now = datetime.now(UTC).replace(tzinfo=None)
        homepage_page_id = None
        all_s3_paths = []
        all_cf_paths = []

        # 2. Process and upload each page
        for i, (route, html_upload) in enumerate(zip(page_routes, page_html_files)):
            html_content = await html_upload.read()
            validate_html_size(html_content)
            if not html_content:
                continue

            # Determine page title
            page_title = website.website_name
            if page_titles and i < len(page_titles):
                page_title = page_titles[i]

            # Process HTML for this page
            try:
                base_url = (config.backend_url or "").strip() or "http://localhost:8020"
                form_submit_endpoint = f"{base_url.rstrip('/')}/api/forms/form-submissions"
                processed_html = process_html_for_publishing(
                    html_content=html_content.decode('utf-8'),
                    page_title=page_title,
                    description=description if route == "/" else None,
                    favicon_filename=favicon_filename,
                    inject_tailwind=True,
                    form_submit_endpoint=form_submit_endpoint,
                )
                processed_html_bytes = processed_html.encode('utf-8')
            except HTMLProcessingError as e:
                raise e
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"HTML processing failed for {route}: {str(e)}")

            html_hash = compute_html_hash(processed_html)
            html_size = get_file_size_bytes(processed_html_bytes)

            # Construct S3 path
            if route == "/":
                s3_path = f"{storage_folder}/index.html"
            else:
                clean_path = route.lstrip("/")
                s3_path = f"{storage_folder}/{clean_path}/index.html"

            all_s3_paths.append(s3_path)
            all_cf_paths.append(self._construct_cloudfront_path(website.subdomain, route))

            # Backup existing content (non-blocking, ignore errors)
            timestamp = now.strftime('%Y%m%d_%H%M%S')
            backup_key = f"backups/{website.business_id}/{timestamp}/{route.lstrip('/')}/index.html"
            try:
                await self._run_in_thread(
                    self.s3_client.copy_object,
                    Bucket=self.publish_bucket,
                    CopySource={'Bucket': self.publish_bucket, 'Key': s3_path},
                    Key=backup_key
                )
            except Exception:
                pass

            # Upload to S3
            success = await self._run_in_thread(
                self._upload_to_s3_sync,
                s3_path,
                processed_html_bytes,
                "text/html"
            )
            if not success:
                raise HTTPException(status_code=500, detail=f"Failed to upload to S3: {s3_path}")

            # Update WebsitePage record (create if it doesn't exist yet)
            page_result = await self.db.execute(
                select(WebsitePage).where(
                    WebsitePage.website_id == website.website_id,
                    WebsitePage.page_path == route
                )
            )
            page = page_result.scalar_one_or_none()
            if not page:
                page = WebsitePage(
                    page_id=uuid.uuid4(),
                    website_id=website.website_id,
                    page_path=route,
                    page_title=page_title,
                    description=None,
                    is_published=False,
                    publish_count=0,
                    created_at=now,
                )
                self.db.add(page)
                await self.db.flush()

            page.last_s3_path = s3_path
            page.last_cloudfront_url = self._construct_cloudfront_url(website.subdomain, route)
            page.last_published_at = now
            page.publish_count += 1
            page.is_published = True
            page.published_at = now

            if route == "/" and description:
                page.description = description

            if route == "/":
                homepage_page_id = str(page.page_id)

            # Create publish history entry
            history_entry = PagePublishHistory(
                publish_id=uuid.uuid4(),
                page_id=page.page_id,
                website_id=website.website_id,
                business_id=website.business_id,
                s3_path=s3_path,
                cloudfront_url=page.last_cloudfront_url,
                invalidation_id=None,
                html_version_hash=html_hash,
                html_size_bytes=html_size,
                status="success",
                published_at=now
            )
            self.db.add(history_entry)
            self.db.add(page)

        # 3. Batch CloudFront invalidation for all pages
        invalidation_id = None
        if all_cf_paths:
            css_cf_path = f"/{storage_folder}/{WWAI_BASE_STYLE_FILENAME}"
            cf_items = list(dict.fromkeys([css_cf_path] + all_cf_paths))
            try:
                inv_response = await self._run_in_thread(
                    lambda: self.cloudfront_client.create_invalidation(
                        DistributionId=aws_config.CLOUDFRONT_DISTRIBUTION_ID,
                        InvalidationBatch={
                            "Paths": {
                                "Quantity": len(cf_items),
                                "Items": cf_items
                            },
                            "CallerReference": str(uuid.uuid4())
                        }
                    )
                )
                invalidation_id = inv_response["Invalidation"]["Id"]
            except Exception as e:
                print(f"Batch invalidation error: {e}")

            # Update invalidation_id on all history entries
            if invalidation_id:
                for route in page_routes:
                    page_result = await self.db.execute(
                        select(WebsitePage).where(
                            WebsitePage.website_id == website.website_id,
                            WebsitePage.page_path == route
                        )
                    )
                    page = page_result.scalar_one_or_none()
                    if page:
                        page.last_invalidation_id = invalidation_id

        # 4. Update website metadata
        website.is_published = True
        website.published_at = now
        website.last_published_at = now
        self.db.add(website)
        await self.db.commit()

        return {
            "website_id": str(website.website_id),
            "page_id": homepage_page_id or "",
            "subdomain": website.subdomain,
            "cloudfront_url": self._construct_cloudfront_url(website.subdomain, "/"),
            "s3_path": all_s3_paths[0] if all_s3_paths else "",
            "invalidation_id": invalidation_id,
            "pages_published": len(page_routes),
        }
    
    async def _move_s3_files(
        self, 
        old_subdomain: str, 
        new_subdomain: str,
        delete_old: bool = True
    ):
        """Move files between hashed folders. Non-blocking."""
        old_folder = self._get_storage_folder(old_subdomain)
        new_folder = self._get_storage_folder(new_subdomain)
        
        if old_folder == new_folder:
            return

        def _perform_move():
            # 1. List
            paginator = self.s3_client.get_paginator('list_objects_v2')
            pages = paginator.paginate(Bucket=self.publish_bucket, Prefix=f"{old_folder}/")
            
            objects_to_delete = []
            
            for page in pages:
                if 'Contents' not in page:
                    continue
                
                for obj in page['Contents']:
                    old_key = obj['Key']
                    new_key = old_key.replace(f"{old_folder}/", f"{new_folder}/", 1)
                    
                    # 2. Copy
                    self.s3_client.copy_object(
                        CopySource={'Bucket': self.publish_bucket, 'Key': old_key},
                        Bucket=self.publish_bucket,
                        Key=new_key
                    )
                    
                    if delete_old:
                        objects_to_delete.append({'Key': old_key})
            
            # 3. Delete (Simple batch, assuming < 1000 files)
            if delete_old and objects_to_delete:
                self.s3_client.delete_objects(
                    Bucket=self.publish_bucket,
                    Delete={'Objects': objects_to_delete}
                )

        try:
            await self._run_in_thread(_perform_move)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to move files: {str(e)}")
    
    def _upload_to_s3_sync(self, key: str, content: bytes, content_type: str) -> bool:
        """Synchronous upload helper for use in thread pool"""
        try:
            self.s3_client.put_object(
                Bucket=self.publish_bucket,
                Key=key,
                Body=content,
                ContentType=content_type,
                CacheControl="public, max-age=3600"
            )
            return True
        except ClientError as e:
            print(f"S3 upload error: {e}")
            return False

    async def _check_subdomain_available(
        self, 
        subdomain: str, 
        exclude_website_id: Optional[uuid.UUID] = None
    ) -> bool:
        query = select(Website).where(Website.subdomain == subdomain)
        if exclude_website_id:
            query = query.where(Website.website_id != exclude_website_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none() is None
    
    def _generate_subdomain_from_name(self, business_name: str) -> str:
        subdomain = business_name.lower()
        subdomain = re.sub(r'[^a-z0-9\s-]', '', subdomain)
        subdomain = re.sub(r'\s+', '-', subdomain)
        subdomain = subdomain.strip('-')[:63]
        return subdomain or "mywebsite"
    
    def _get_favicon_content_type(self, filename: str) -> str:
        ext = filename.split('.')[-1].lower()
        return {
            'ico': 'image/x-icon', 'png': 'image/png',
            'svg': 'image/svg+xml', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg'
        }.get(ext, 'image/x-icon')
    
    def _get_existing_favicon_filename(self, website: Website) -> str:
        """Extract favicon filename from the website's existing favicon_url, or default to favicon.ico."""
        if website.favicon_url:
            filename = website.favicon_url.rsplit('/', 1)[-1]
            if filename:
                return filename
        return "favicon.ico"

    def _get_storage_folder(self, subdomain: str) -> str:
        """Deterministic Hash: SHA256(subdomain)[:16]"""
        return hashlib.sha256(subdomain.lower().encode('utf-8')).hexdigest()[:16]

    def _construct_cloudfront_path(self, subdomain: str, page_path: str) -> str:
        """Invalidate using the hashed S3 path - matches Lambda@Edge rewrite."""
        storage_folder = self._get_storage_folder(subdomain)
        if page_path == "/":
            return f"/{storage_folder}/index.html"
        clean_path = page_path.lstrip("/")
        return f"/{storage_folder}/{clean_path}/index.html"
    
    def _construct_cloudfront_url(self, subdomain: str, page_path: str) -> str:
        base = f"https://{subdomain}.{aws_config.CLOUDFRONT_DOMAIN}"
        return base + "/" if page_path == "/" else base + page_path
    
    async def get_user_websites(self) -> list[Website]:
            if not self.current_user: 
                raise HTTPException(status_code=401, detail="Not authenticated")
            
            business_id = self.current_user.business_id
            
            if not business_id:
                # FIX: We are selecting the ID directly, so the result IS the ID
                res = await self.db.execute(
                    select(BusinessUser.business_id)
                    .where(BusinessUser.user_id == self.current_user.user_id)
                )
                found_id = res.scalar_one_or_none()
                
                if not found_id: 
                    return []
                
                # Use the found ID directly
                business_id = found_id

            result = await self.db.execute(select(Website).where(Website.business_id == business_id))
            return result.scalars().all()

    async def get_website_pages(self, website_id: uuid.UUID) -> list[WebsitePage]:
        await self._get_website_with_validation(website_id)
        result = await self.db.execute(select(WebsitePage).where(WebsitePage.website_id == website_id))
        return result.scalars().all()

    async def _get_website_with_validation(self, website_id: uuid.UUID) -> Website:
        """
        Get website and fully validate ownership logic.
        Checks if current_user belongs to the business that owns the website.
        """
        if not self.current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
            
        website = await self.db.get(Website, website_id)
        if not website:
            raise HTTPException(status_code=404, detail="Website not found")
            
        # Check if user's business owns this website
        business_id = self.current_user.business_id
        
        if not business_id:
            # Fallback: Try to find business_id from business_users table
            # This handles cases where user.business_id might be null but they are linked
            result = await self.db.execute(
                select(BusinessUser.business_id)
                .where(BusinessUser.user_id == self.current_user.user_id)
                .limit(1)
            )
            business_user = result.scalar_one_or_none()
            
            if business_user:
                business_id = business_user
            else:
                 # If we still have no business ID, they definitely don't own the site
                raise HTTPException(
                    status_code=403, 
                    detail="User does not have a business account."
                )
        
        # Compare IDs (using str to avoid UUID object mismatch issues)
        if str(website.business_id) != str(business_id):
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to access this website"
            )
            
        return website

    async def quick_publish(self, subdomain: str, website_title: str, html_file: UploadFile) -> dict:
        return await self.publish_from_editor(subdomain, website_title, html_file)
    
    async def check_subdomain_availability(self, subdomain: str) -> bool:
        return await self._check_subdomain_available(subdomain)

    async def set_active_generation(
        self,
        generation_version_id: uuid.UUID,
        page_id: uuid.UUID | None = None,
    ) -> dict:
        """
        Set a page's current_generation_id. Verifies the generation belongs to
        the user's business via MongoDB workflow_input.

        If page_id is provided, sets active generation for that specific page.
        Otherwise defaults to the homepage.

        Returns a dict with:
        - current_generation_id: The new active generation ID
        - preview_link: The preview link for this version (if cached)
        - needs_compilation: True if the version needs to be compiled
        """
        if not self.current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        business_id = self.current_user.business_id
        if not business_id:
            result = await self.db.execute(
                select(BusinessUser.business_id)
                .where(BusinessUser.user_id == self.current_user.user_id)
                .limit(1)
            )
            business_id = result.scalar_one_or_none()
        if not business_id:
            raise HTTPException(
                status_code=403,
                detail="User does not have an associated business.",
            )

        website_result = await self.db.execute(
            select(Website).where(Website.business_id == business_id)
        )
        website = website_result.scalar_one_or_none()
        if not website:
            raise HTTPException(status_code=404, detail="Website not found")

        if page_id:
            page_result = await self.db.execute(
                select(WebsitePage).where(
                    WebsitePage.website_id == website.website_id,
                    WebsitePage.page_id == page_id,
                )
            )
            target_page = page_result.scalar_one_or_none()
            if not target_page:
                raise HTTPException(status_code=404, detail="Page not found")
        else:
            page_result = await self.db.execute(
                select(WebsitePage).where(
                    WebsitePage.website_id == website.website_id,
                    WebsitePage.page_path == "/",
                )
            )
            target_page = page_result.scalar_one_or_none()
            if not target_page:
                raise HTTPException(status_code=404, detail="Homepage not found")

        mongo_db = await get_mongo_database("template_generation")
        coll = mongo_db["workflow_input"]
        doc = await coll.find_one(
            {
                "business_id": str(business_id),
                "generation_version_id": str(generation_version_id),
            }
        )
        if not doc:
            raise HTTPException(
                status_code=403,
                detail="Generation not found or you do not have access to it.",
            )

        # Fetch the GenerationVersion to get its preview_link
        gen_version = await self.db.get(GenerationVersion, generation_version_id)

        target_page.current_generation_id = generation_version_id

        # If this version has a cached preview_link, use it
        needs_compilation = False
        if gen_version and gen_version.preview_link:
            target_page.preview_link = gen_version.preview_link
        else:
            needs_compilation = True

        await self.db.commit()
        await self.db.refresh(target_page)

        return {
            "current_generation_id": target_page.current_generation_id,
            "preview_link": target_page.preview_link,
            "needs_compilation": needs_compilation
        }

def get_publishing_service(
    db_session: AsyncSession = Depends(get_async_db_session),
    current_user: Optional[CurrentUserResponse] = Depends(get_current_user_optional),
    request: Request = None,
):
    return PublishingService(db_session, current_user, request)