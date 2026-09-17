
import { getSupabaseClient } from '../auth/supabaseClient';

export type ProductCatalogue = 'products' | 'preowned';

export interface MarketplaceProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  brand: string;
  category: string;
  sku: string;
  costPrice: number | null;
  quantity: number;
  imageUrl: string | null;
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMarketplaceProductInput {
  name: string;
  description: string;
  price: number;
  brand: string;
  category: string;
  sku: string;
  costPrice?: number | null;
  quantity: number;
  imageUrl?: string | null;
  images?: string[];
  isActive?: boolean;
}

export interface UpdateMarketplaceProductInput {
  name?: string;
  description?: string;
  price?: number;
  brand?: string;
  category?: string;
  sku?: string;
  costPrice?: number | null;
  quantity?: number;
  imageUrl?: string | null;
  images?: string[];
  isActive?: boolean;
}

type MarketplaceProductRow = {
  id: string;
  name: string;
  description: string;
  price: number | string;
  brand: string;
  category: string;
  sku: string;
  cost_price: number | string | null;
  quantity: number | string;
  image_url: string | null;
  images: unknown;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const PRODUCT_COLUMNS =
  'id,name,description,price,brand,category,sku,cost_price,quantity,image_url,images,is_active,created_at,updated_at';

function getProductTable(catalogue: ProductCatalogue) {
  return catalogue === 'preowned'
    ? 'preowned_products'
    : 'marketplace_products';
}

function mapImages(value: unknown, fallbackImageUrl: string | null): string[] {
  if (Array.isArray(value)) {
    const urls = value.filter((item): item is string => typeof item === 'string');
    if (urls.length) {
      return urls;
    }
  }

  return fallbackImageUrl ? [fallbackImageUrl] : [];
}

const mapProduct = (
  product: MarketplaceProductRow,
): MarketplaceProduct => ({
  id: product.id,
  name: product.name,
  description: product.description,
  price: Number(product.price),
  brand: product.brand,
  category: product.category,
  sku: product.sku,
  costPrice:
    product.cost_price === null
      ? null
      : Number(product.cost_price),
  quantity: Number(product.quantity),
  imageUrl: product.image_url,
  images: mapImages(product.images, product.image_url),
  isActive: product.is_active,
  createdAt: product.created_at,
  updatedAt: product.updated_at,
});

/**
 * Customer-facing product catalogue.
 *
 * Only active products are returned.
 * This keeps the existing customer catalogue behaviour unchanged.
 */
export async function fetchMarketplaceProducts(): Promise<
  MarketplaceProduct[]
> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('marketplace_products')
    .select(PRODUCT_COLUMNS)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(
      `Unable to load marketplace products: ${error.message}`,
    );
  }

  return (data ?? []).map(
    (product) => mapProduct(product as MarketplaceProductRow),
  );
}

export async function fetchPreOwnedProducts(): Promise<
  MarketplaceProduct[]
> {
  return fetchProducts('preowned', true);
}

async function fetchProducts(
  catalogue: ProductCatalogue,
  activeOnly: boolean,
): Promise<MarketplaceProduct[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from(getProductTable(catalogue))
    .select(PRODUCT_COLUMNS)
    .order('created_at', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Unable to load ${catalogue} products: ${error.message}`);
  }

  return (data ?? []).map(
    (product) => mapProduct(product as MarketplaceProductRow),
  );
}

/**
 * Marketing/admin catalogue.
 *
 * Returns active AND inactive products so the marketing user
 * can manage the complete catalogue.
 */
export async function fetchAllMarketplaceProducts(): Promise<
  MarketplaceProduct[]
> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('marketplace_products')
    .select(PRODUCT_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(
      `Unable to load all marketplace products: ${error.message}`,
    );
  }

  return (data ?? []).map(
    (product) => mapProduct(product as MarketplaceProductRow),
  );
}

export async function fetchAllPreOwnedProducts(): Promise<
  MarketplaceProduct[]
> {
  return fetchProducts('preowned', false);
}

/**
 * Fetch one product by ID.
 */
export async function fetchMarketplaceProductById(
  id: string,
  catalogue: ProductCatalogue = 'products',
): Promise<MarketplaceProduct> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from(getProductTable(catalogue))
    .select(PRODUCT_COLUMNS)
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(
      `Unable to load marketplace product: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error('Marketplace product was not found.');
  }

  return mapProduct(data as MarketplaceProductRow);
}

/**
 * Create a new marketplace product.
 */
export async function createMarketplaceProduct(
  input: CreateMarketplaceProductInput,
  catalogue: ProductCatalogue = 'products',
): Promise<MarketplaceProduct> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from(getProductTable(catalogue))
    .insert({
      name: input.name.trim(),
      description: input.description.trim(),
      price: input.price,
      brand: input.brand.trim(),
      category: input.category.trim(),
      sku: input.sku.trim(),
      cost_price: input.costPrice ?? null,
      quantity: input.quantity,
      image_url: input.images?.[0] ?? input.imageUrl ?? null,
      images: input.images ?? (input.imageUrl ? [input.imageUrl] : []),
      is_active: input.isActive ?? true,
    })
    .select(PRODUCT_COLUMNS)
    .single();

  if (error) {
    throw new Error(
      `Unable to create marketplace product: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error(
      'Product was created but no product data was returned.',
    );
  }

  return mapProduct(data as MarketplaceProductRow);
}

/**
 * Update an existing marketplace product.
 */
export async function updateMarketplaceProduct(
  id: string,
  input: UpdateMarketplaceProductInput,
  catalogue: ProductCatalogue = 'products',
): Promise<MarketplaceProduct> {
  const supabase = getSupabaseClient();

  const updateData: Record<string, unknown> = {};

  if (input.name !== undefined) {
    updateData.name = input.name.trim();
  }

  if (input.description !== undefined) {
    updateData.description = input.description.trim();
  }

  if (input.price !== undefined) {
    updateData.price = input.price;
  }

  if (input.brand !== undefined) {
    updateData.brand = input.brand.trim();
  }

  if (input.category !== undefined) {
    updateData.category = input.category.trim();
  }

  if (input.sku !== undefined) {
    updateData.sku = input.sku.trim();
  }

  if (input.costPrice !== undefined) {
    updateData.cost_price = input.costPrice;
  }

  if (input.quantity !== undefined) {
    updateData.quantity = input.quantity;
  }

  if (input.imageUrl !== undefined) {
    updateData.image_url = input.imageUrl;
  }

  if (input.images !== undefined) {
    updateData.images = input.images;
    updateData.image_url = input.images[0] ?? null;
  }

  if (input.isActive !== undefined) {
    updateData.is_active = input.isActive;
  }

  const { data, error } = await supabase
    .from(getProductTable(catalogue))
    .update(updateData)
    .eq('id', id)
    .select(PRODUCT_COLUMNS)
    .single();

  if (error) {
    throw new Error(
      `Unable to update marketplace product: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error(
      'Product was updated but no product data was returned.',
    );
  }

  return mapProduct(data as MarketplaceProductRow);
}

/**
 * Activate a product.
 */
export async function activateMarketplaceProduct(
  id: string,
  catalogue: ProductCatalogue = 'products',
): Promise<MarketplaceProduct> {
  return updateMarketplaceProduct(id, {
    isActive: true,
  }, catalogue);
}

/**
 * Deactivate a product.
 */
export async function deactivateMarketplaceProduct(
  id: string,
  catalogue: ProductCatalogue = 'products',
): Promise<MarketplaceProduct> {
  return updateMarketplaceProduct(id, {
    isActive: false,
  }, catalogue);
}

/**
 * Toggle product active/inactive status.
 */
export async function toggleMarketplaceProductStatus(
  product: MarketplaceProduct,
): Promise<MarketplaceProduct> {
  return updateMarketplaceProduct(product.id, {
    isActive: !product.isActive,
  });
}

/**
 * Delete a marketplace product permanently.
 */
export async function deleteMarketplaceProduct(
  id: string,
  catalogue: ProductCatalogue = 'products',
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from(getProductTable(catalogue))
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(
      `Unable to delete marketplace product: ${error.message}`,
    );
  }
}

