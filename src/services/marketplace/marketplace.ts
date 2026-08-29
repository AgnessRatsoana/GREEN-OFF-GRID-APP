import { getSupabaseClient } from '../auth/supabaseClient';

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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  quantity: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

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
  quantity: product.quantity,
  imageUrl: product.image_url,
  isActive: product.is_active,
  createdAt: product.created_at,
  updatedAt: product.updated_at,
});

export async function fetchMarketplaceProducts(): Promise<
  MarketplaceProduct[]
> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('marketplace_products')
    .select(
      'id,name,description,price,brand,category,sku,cost_price,quantity,image_url,is_active,created_at,updated_at',
    )
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(
      `Unable to load marketplace products: ${error.message}`,
    );
  }

  return (data ?? []).map(mapProduct);
}