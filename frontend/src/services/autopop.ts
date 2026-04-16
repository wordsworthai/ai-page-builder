import { AGENTIC_BASE_URL } from "../config/env"; // base API URL

// API response shapes
type ApiBrand = {
  name: string;
  url: string; // homepage url
  entity_count: number;
};

type ApiProductsResponse = {
  success: boolean;
  message: string;
  brand_url: string;
  data: Array<{
    entity_name: string;
    entity_url: string;
    entity_type: string;
  }>;
  total_count: number;
};

type ApiBrandsResponse = {
  success: boolean;
  message: string;
  data: ApiBrand[];
  total_count: number;
};

// UI shapes (retain names and urls)
export type Brand = {
  id: string;                 // stable id for selection; uses hostname
  name: string;
  domain: string;             // hostname
  homepageUrl: string;        // the real homepage url from API
  entityCount: number;
  logoUrl?: string;
};

export type Product = {
  id: string;                 // slug from entity_url
  title: string;              // entity_name
  url: string;                // real product url
  entityType: string;         // e.g., "product"
  thumb?: string;
};

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function slugOf(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || url;
  } catch {
    const parts = url.split("/").filter(Boolean);
    return parts[parts.length - 1] || url;
  }
}

export async function listAutopopBrands(): Promise<Brand[]> {
  const url = `${AGENTIC_BASE_URL}/autopop-brands`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Brands request failed: ${res.status}`);
  const json = (await res.json()) as ApiBrandsResponse;
  const brands = (json.data || []).map((b) => ({
    id: hostnameOf(b.url),
    name: b.name,
    domain: hostnameOf(b.url),
    homepageUrl: b.url,
    entityCount: b.entity_count,
  }));
  return brands;
}

export async function listSupportedProducts(brandUrl: string): Promise<Product[]> {
  const pathBrand = encodeURIComponent(brandUrl);
  const url = `${AGENTIC_BASE_URL}/${pathBrand}/supported-products`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Products request failed: ${res.status}`);
  const json = (await res.json()) as ApiProductsResponse;
  const prods: Product[] = (json.data || []).map((p) => ({
    id: slugOf(p.entity_url),
    title: p.entity_name,
    url: p.entity_url,
    entityType: p.entity_type,
  }));
  return prods;
}

export async function resolveBrand(input: { brandId?: string; brandUrl?: string }): Promise<string> {
  const brands = await listAutopopBrands();
  if (input.brandUrl) {
    const host = hostnameOf(input.brandUrl);
    const m = brands.find((b) => hostnameOf(b.homepageUrl) === host);
    if (!m) throw new Error("Brand URL not recognized");
    return m.homepageUrl; // canonical brand url
  }
  if (input.brandId) {
    const m = brands.find((b) => b.id === input.brandId || b.domain === input.brandId);
    if (!m) throw new Error("Unknown brandId");
    return m.homepageUrl;
  }
  throw new Error("Provide brandId or brandUrl");
}

export async function resolveProduct(input: { brandId: string; productId?: string; productUrl?: string }): Promise<string> {
  const brandUrl = input.brandId;
  const prods = await listSupportedProducts(brandUrl);
  if (input.productId) {
    const ok = prods.some((p) => p.id === input.productId);
    if (!ok) throw new Error("Unknown productId for this brand");
    return input.productId;
  }
  if (input.productUrl) {
    const slug = slugOf(input.productUrl);
    const m = prods.find((p) => p.id === slug || p.url === input.productUrl);
    if (!m) throw new Error("Product URL not recognized for this brand");
    return m.id;
  }
  throw new Error("Provide productId or productUrl");
}


