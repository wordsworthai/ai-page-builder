"""
BigQuery Client Service
========================
Wrapper for executing BigQuery queries with error handling,
connection management, and result parsing.

UPDATED: Works with flattened schema (breakdown_type, breakdown_key, breakdown_value)
"""
from datetime import date
from typing import List, Dict, Any
import logging

from google.cloud import bigquery
from google.cloud.exceptions import GoogleCloudError
from fastapi import HTTPException

from app.products.page_builder.config.gcp import gcp_config, get_bigquery_client


class BigQueryClient:
    """
    BigQuery client wrapper for analytics queries.
    
    Handles:
    - Query execution with timeout
    - Result parsing and type conversion
    - Error handling and logging
    - Connection management
    """
    
    def __init__(self):
        """Initialize BigQuery client."""
        self.client = get_bigquery_client()
        self.project_id = gcp_config.GCP_PROJECT_ID
        self.dataset = gcp_config.BIGQUERY_DATASET
        self.table = gcp_config.BIGQUERY_TABLE
        self.table_id = gcp_config.bigquery_table_id
        if self.client is None:
            logging.warning("BigQuery client unavailable; analytics queries will return empty data")
    
    def get_website_overview(
        self,
        subdomain: str,
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        """
        Get overview analytics for a website.
        
        Args:
            subdomain: Website subdomain
            start_date: Start date (inclusive)
            end_date: End date (inclusive)
        
        Returns:
            Dict with total pageviews, unique visitors, and daily trend
        """
        if self.client is None:
            return {
                'total_pageviews': 0,
                'total_unique_visitors': 0,
                'trend': []
            }
        # Use country breakdown to avoid counting pageviews multiple times
        # (each page appears 3x in flattened data: country, device, referrer)
        query = f"""
        SELECT 
          date,
          SUM(pageviews) as daily_pageviews,
          SUM(unique_visitors) as daily_unique_visitors
        FROM `{self.table_id}`
        WHERE subdomain = @subdomain
          AND date >= @start_date
          AND date <= @end_date
          AND breakdown_type = 'country'
        GROUP BY date
        ORDER BY date ASC
        """
        
        # Use parameterized query for safety
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("subdomain", "STRING", subdomain),
                bigquery.ScalarQueryParameter("start_date", "DATE", start_date),
                bigquery.ScalarQueryParameter("end_date", "DATE", end_date),
            ]
        )
        
        try:
            query_job = self.client.query(query, job_config=job_config)
            results = query_job.result(timeout=gcp_config.BIGQUERY_TIMEOUT_SECONDS)
            
            # Calculate totals and build trend
            total_pageviews = 0
            total_unique_visitors = 0
            trend = []
            
            for row in results:
                daily_views = row['daily_pageviews'] or 0
                daily_visitors = row['daily_unique_visitors'] or 0
                
                total_pageviews += daily_views
                total_unique_visitors += daily_visitors
                
                trend.append({
                    'date': row['date'].isoformat(),
                    'pageviews': daily_views,
                    'unique_visitors': daily_visitors
                })
            
            return {
                'total_pageviews': total_pageviews,
                'total_unique_visitors': total_unique_visitors,
                'trend': trend
            }
            
        except GoogleCloudError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch overview data: {str(e)}"
            )
    
    def get_top_pages(
        self,
        subdomain: str,
        start_date: date,
        end_date: date,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get top pages by pageviews.
        
        Args:
            subdomain: Website subdomain
            start_date: Start date (inclusive)
            end_date: End date (inclusive)
            limit: Maximum number of pages to return
        
        Returns:
            List of page dicts with path, pageviews, unique_visitors
        """
        if self.client is None:
            return []
        # Use country breakdown to deduplicate pages
        query = f"""
        SELECT 
          page_path,
          SUM(pageviews) as total_pageviews,
          SUM(unique_visitors) as total_unique_visitors
        FROM `{self.table_id}`
        WHERE subdomain = @subdomain
          AND date >= @start_date
          AND date <= @end_date
          AND breakdown_type = 'country'
        GROUP BY page_path
        ORDER BY total_pageviews DESC
        LIMIT @limit
        """
        
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("subdomain", "STRING", subdomain),
                bigquery.ScalarQueryParameter("start_date", "DATE", start_date),
                bigquery.ScalarQueryParameter("end_date", "DATE", end_date),
                bigquery.ScalarQueryParameter("limit", "INT64", limit),
            ]
        )
        
        try:
            query_job = self.client.query(query, job_config=job_config)
            results = query_job.result(timeout=gcp_config.BIGQUERY_TIMEOUT_SECONDS)
            
            pages = []
            for row in results:
                pages.append({
                    'page_path': row['page_path'],
                    'pageviews': row['total_pageviews'] or 0,
                    'unique_visitors': row['total_unique_visitors'] or 0
                })
            
            return pages
            
        except GoogleCloudError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch top pages: {str(e)}"
            )
    
    def get_traffic_sources(
        self,
        subdomain: str,
        start_date: date,
        end_date: date
    ) -> Dict[str, int]:
        """
        Get aggregated traffic sources (referrers).
        
        Args:
            subdomain: Website subdomain
            start_date: Start date (inclusive)
            end_date: End date (inclusive)
        
        Returns:
            Dict mapping referrer to pageview count
        """
        if self.client is None:
            return {}
        query = f"""
        SELECT 
          breakdown_key as referrer,
          SUM(breakdown_value) as total_visits
        FROM `{self.table_id}`
        WHERE subdomain = @subdomain
          AND date >= @start_date
          AND date <= @end_date
          AND breakdown_type = 'referrer'
        GROUP BY breakdown_key
        ORDER BY total_visits DESC
        """
        
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("subdomain", "STRING", subdomain),
                bigquery.ScalarQueryParameter("start_date", "DATE", start_date),
                bigquery.ScalarQueryParameter("end_date", "DATE", end_date),
            ]
        )
        
        try:
            query_job = self.client.query(query, job_config=job_config)
            results = query_job.result(timeout=gcp_config.BIGQUERY_TIMEOUT_SECONDS)
            
            # Build dict from results
            sources = {}
            for row in results:
                sources[row['referrer']] = row['total_visits'] or 0
            
            return sources
            
        except GoogleCloudError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch traffic sources: {str(e)}"
            )
    
    def get_country_breakdown(
        self,
        subdomain: str,
        start_date: date,
        end_date: date
    ) -> Dict[str, int]:
        """
        Get aggregated country breakdown.
        
        Args:
            subdomain: Website subdomain
            start_date: Start date (inclusive)
            end_date: End date (inclusive)
        
        Returns:
            Dict mapping country code to pageview count
        """
        if self.client is None:
            return {}
        query = f"""
        SELECT 
          breakdown_key as country,
          SUM(breakdown_value) as total_visits
        FROM `{self.table_id}`
        WHERE subdomain = @subdomain
          AND date >= @start_date
          AND date <= @end_date
          AND breakdown_type = 'country'
        GROUP BY breakdown_key
        ORDER BY total_visits DESC
        """
        
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("subdomain", "STRING", subdomain),
                bigquery.ScalarQueryParameter("start_date", "DATE", start_date),
                bigquery.ScalarQueryParameter("end_date", "DATE", end_date),
            ]
        )
        
        try:
            query_job = self.client.query(query, job_config=job_config)
            results = query_job.result(timeout=gcp_config.BIGQUERY_TIMEOUT_SECONDS)
            
            # Build dict from results
            countries = {}
            for row in results:
                countries[row['country']] = row['total_visits'] or 0
            
            return countries
            
        except GoogleCloudError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch country breakdown: {str(e)}"
            )
    
    def get_device_breakdown(
        self,
        subdomain: str,
        start_date: date,
        end_date: date
    ) -> Dict[str, int]:
        """
        Get aggregated device breakdown.
        
        Args:
            subdomain: Website subdomain
            start_date: Start date (inclusive)
            end_date: End date (inclusive)
        
        Returns:
            Dict mapping device type to pageview count
        """
        if self.client is None:
            return {}
        query = f"""
        SELECT 
          breakdown_key as device,
          SUM(breakdown_value) as total_visits
        FROM `{self.table_id}`
        WHERE subdomain = @subdomain
          AND date >= @start_date
          AND date <= @end_date
          AND breakdown_type = 'device'
        GROUP BY breakdown_key
        ORDER BY total_visits DESC
        """
        
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("subdomain", "STRING", subdomain),
                bigquery.ScalarQueryParameter("start_date", "DATE", start_date),
                bigquery.ScalarQueryParameter("end_date", "DATE", end_date),
            ]
        )
        
        try:
            query_job = self.client.query(query, job_config=job_config)
            results = query_job.result(timeout=gcp_config.BIGQUERY_TIMEOUT_SECONDS)
            
            # Build dict from results
            devices = {}
            for row in results:
                devices[row['device']] = row['total_visits'] or 0
            
            return devices
            
        except GoogleCloudError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch device breakdown: {str(e)}"
            )
    
    def check_data_exists(
        self,
        subdomain: str,
        start_date: date,
        end_date: date
    ) -> bool:
        """
        Check if any data exists for subdomain in date range.
        
        Args:
            subdomain: Website subdomain
            start_date: Start date (inclusive)
            end_date: End date (inclusive)
        
        Returns:
            True if data exists, False otherwise
        """
        if self.client is None:
            return False
        query = f"""
        SELECT COUNT(*) as row_count
        FROM `{self.table_id}`
        WHERE subdomain = @subdomain
          AND date >= @start_date
          AND date <= @end_date
        LIMIT 1
        """
        
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("subdomain", "STRING", subdomain),
                bigquery.ScalarQueryParameter("start_date", "DATE", start_date),
                bigquery.ScalarQueryParameter("end_date", "DATE", end_date),
            ]
        )
        
        try:
            query_job = self.client.query(query, job_config=job_config)
            results = query_job.result(timeout=gcp_config.BIGQUERY_TIMEOUT_SECONDS)
            
            row = list(results)[0]
            return row['row_count'] > 0
            
        except Exception:
            # If query fails, assume no data
            return False