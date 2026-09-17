import { getSupabaseClient } from '../auth/supabaseClient';

export interface ComboDeal {
  id: string;
  title: string;
  description: string;
  price: number;
  rating: number;
  imageUrl: string | null;
  bullets: string[];
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateComboDealInput {
  title: string;
  description: string;
  price: number;
  rating: number;
  imageUrl?: string | null;
  bullets: string[];
  isActive: boolean;
  displayOrder: number;
}

export interface UpdateComboDealInput extends CreateComboDealInput {
  id: string;
}

type ComboDealRow = {
  id: string;
  title: string;
  description: string;
  price: number | string;
  rating: number | string;
  image_url: string | null;
  bullets: unknown;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

function mapBullets(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      return [];
    }
  }

  return [];
}

function mapComboDeal(row: ComboDealRow): ComboDeal {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    rating: Number(row.rating),
    imageUrl: row.image_url,
    bullets: mapBullets(row.bullets),
    isActive: row.is_active,
    displayOrder: Number(row.display_order),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const COMBO_COLUMNS = 'id,title,description,price,rating,image_url,bullets,is_active,display_order,created_at,updated_at';

export async function fetchComboDeals(): Promise<ComboDeal[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('combo_deals')
    .select(COMBO_COLUMNS)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    throw new Error(`Unable to load combo deals: ${error.message}`);
  }

  return (data ?? []).map((item) => mapComboDeal(item as ComboDealRow));
}

export async function fetchAllComboDeals(): Promise<ComboDeal[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('combo_deals')
    .select(COMBO_COLUMNS)
    .order('display_order', { ascending: true });

  if (error) {
    throw new Error(`Unable to load combo deals: ${error.message}`);
  }

  return (data ?? []).map((item) => mapComboDeal(item as ComboDealRow));
}

export async function createComboDeal(input: CreateComboDealInput): Promise<ComboDeal> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('combo_deals')
    .insert({
      title: input.title.trim(),
      description: input.description.trim(),
      price: input.price,
      rating: input.rating,
      image_url: input.imageUrl?.trim() || null,
      bullets: input.bullets,
      is_active: input.isActive,
      display_order: input.displayOrder,
    })
    .select(COMBO_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(`Unable to create combo deal: ${error?.message ?? 'No data returned'}`);
  }

  return mapComboDeal(data as ComboDealRow);
}

export async function updateComboDeal(input: UpdateComboDealInput): Promise<ComboDeal> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('combo_deals')
    .update({
      title: input.title.trim(),
      description: input.description.trim(),
      price: input.price,
      rating: input.rating,
      image_url: input.imageUrl?.trim() || null,
      bullets: input.bullets,
      is_active: input.isActive,
      display_order: input.displayOrder,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .select(COMBO_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(`Unable to update combo deal: ${error?.message ?? 'No data returned'}`);
  }

  return mapComboDeal(data as ComboDealRow);
}

export async function deleteComboDeal(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('combo_deals').delete().eq('id', id);

  if (error) {
    throw new Error(`Unable to delete combo deal: ${error.message}`);
  }
}
