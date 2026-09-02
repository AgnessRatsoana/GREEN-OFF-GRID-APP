import { getSupabaseClient } from '../auth/supabaseClient';

export type PackageButtonVariant = 'teal' | 'purple';

export interface MarketingPackage {
  id: string;
  title: string;
  description: string;
  bullets: string[];
  price: number;
  rating: number;
  buttonLabel: string;
  buttonVariant: PackageButtonVariant;
  imageUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMarketingPackageInput {
  title: string;
  description: string;
  bullets: string[];
  price: number;
  rating: number;
  buttonLabel: string;
  buttonVariant: PackageButtonVariant;
  imageUrl?: string | null;
  isActive: boolean;
  displayOrder: number;
}

export interface UpdateMarketingPackageInput
  extends CreateMarketingPackageInput {
  id: string;
}

type FranchisePackageRow = {
  id: string;
  title: string;
  description: string;
  bullets: unknown;
  price: number | string;
  rating: number | string;
  button_label: string;
  button_variant: string;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

function mapBullets(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string =>
        typeof item === 'string',
    );
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is string =>
            typeof item === 'string',
        );
      }
    } catch {
      return [];
    }
  }

  return [];
}

function mapButtonVariant(
  value: string,
): PackageButtonVariant {
  return value === 'teal' ? 'teal' : 'purple';
}

function mapPackage(
  franchisePackage: FranchisePackageRow,
): MarketingPackage {
  return {
    id: franchisePackage.id,
    title: franchisePackage.title,
    description: franchisePackage.description,
    bullets: mapBullets(franchisePackage.bullets),
    price: Number(franchisePackage.price),
    rating: Number(franchisePackage.rating),
    buttonLabel: franchisePackage.button_label,
    buttonVariant: mapButtonVariant(
      franchisePackage.button_variant,
    ),
    imageUrl: franchisePackage.image_url,
    isActive: franchisePackage.is_active,
    displayOrder: franchisePackage.display_order,
    createdAt: franchisePackage.created_at,
    updatedAt: franchisePackage.updated_at,
  };
}

/* ============================================================
   READ
============================================================ */

export async function fetchMarketingPackages(): Promise<
  MarketingPackage[]
> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('franchise_packages')
    .select(
      [
        'id',
        'title',
        'description',
        'bullets',
        'price',
        'rating',
        'button_label',
        'button_variant',
        'image_url',
        'is_active',
        'display_order',
        'created_at',
        'updated_at',
      ].join(','),
    )
    .order('display_order', {
      ascending: true,
    });

  if (error) {
    throw new Error(
      `Unable to load franchise packages: ${error.message}`,
    );
  }

  return (data ?? []).map(
  (item) =>
    mapPackage(
      item as unknown as FranchisePackageRow,
    ),
);
}

/* ============================================================
   CREATE
============================================================ */

export async function createMarketingPackage(
  input: CreateMarketingPackageInput,
): Promise<MarketingPackage> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('franchise_packages')
    .insert({
      title: input.title.trim(),
      description: input.description.trim(),
      bullets: input.bullets,
      price: input.price,
      rating: input.rating,
      button_label: input.buttonLabel.trim(),
      button_variant: input.buttonVariant,
      image_url: input.imageUrl?.trim() || null,
      is_active: input.isActive,
      display_order: input.displayOrder,
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `Unable to create franchise package: ${error.message}`,
    );
  }

  return mapPackage(
  data as unknown as FranchisePackageRow,
);
}

/* ============================================================
   UPDATE
============================================================ */

export async function updateMarketingPackage(
  input: UpdateMarketingPackageInput,
): Promise<MarketingPackage> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('franchise_packages')
    .update({
      title: input.title.trim(),
      description: input.description.trim(),
      bullets: input.bullets,
      price: input.price,
      rating: input.rating,
      button_label: input.buttonLabel.trim(),
      button_variant: input.buttonVariant,
      image_url: input.imageUrl?.trim() || null,
      is_active: input.isActive,
      display_order: input.displayOrder,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .select()
    .single();

  if (error) {
    throw new Error(
      `Unable to update franchise package: ${error.message}`,
    );
  }

  return mapPackage(
  data as unknown as FranchisePackageRow,
);
}

/* ============================================================
   DELETE
============================================================ */

export async function deleteMarketingPackage(
  id: string,
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('franchise_packages')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(
      `Unable to delete franchise package: ${error.message}`,
    );
  }
}