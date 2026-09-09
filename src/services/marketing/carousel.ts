import type { RealtimeChannel } from '@supabase/supabase-js';

import { getSupabaseClient } from '../auth/supabaseClient';

export type CarouselMediaType = 'image' | 'video';

export interface CarouselItem {
  id: string;
  type: CarouselMediaType;
  uri: string;
  subtitle: string;
  mainTitle: string;
  pointOne: string;
  pointTwo: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type CarouselRow = {
  id: string;
  media_type: CarouselMediaType;
  media_url: string;
  subtitle: string;
  main_title: string;
  point_one: string;
  point_two: string;
  primary_button_text: string;
  secondary_button_text: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const BUCKET_NAME = 'carousel-media';
const COLUMNS = 'id,media_type,media_url,subtitle,main_title,point_one,point_two,primary_button_text,secondary_button_text,display_order,is_active,created_at,updated_at';

function mapCarouselItem(row: CarouselRow): CarouselItem {
  return {
    id: row.id,
    type: row.media_type,
    uri: row.media_url,
    subtitle: row.subtitle,
    mainTitle: row.main_title,
    pointOne: row.point_one,
    pointTwo: row.point_two,
    primaryButtonText: row.primary_button_text,
    secondaryButtonText: row.secondary_button_text,
    displayOrder: row.display_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchCarouselItems(includeInactive = false): Promise<CarouselItem[]> {
  let query = getSupabaseClient()
    .from('carousel_slides')
    .select(COLUMNS)
    .order('display_order', { ascending: true });

  if (!includeInactive) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) throw new Error(`Unable to load carousel content: ${error.message}`);
  return ((data ?? []) as CarouselRow[]).map(mapCarouselItem);
}

export async function uploadCarouselMedia(uri: string, type: CarouselMediaType): Promise<string> {
  const extension = uri.split('?')[0].split('.').pop()?.toLowerCase() || (type === 'video' ? 'mp4' : 'jpg');
  const contentType = type === 'video'
    ? `video/${extension === 'mov' ? 'quicktime' : 'mp4'}`
    : `image/${extension === 'png' ? 'png' : 'jpeg'}`;
  const path = `${type}s/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
  const response = await fetch(uri);
  if (!response.ok) throw new Error('Unable to read the selected carousel media.');
  const { error } = await getSupabaseClient().storage.from(BUCKET_NAME).upload(path, await response.arrayBuffer(), { contentType, upsert: false });
  if (error) throw new Error(`Carousel media upload failed: ${error.message}`);
  return getSupabaseClient().storage.from(BUCKET_NAME).getPublicUrl(path).data.publicUrl;
}

export async function saveCarouselItem(input: Omit<CarouselItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<CarouselItem> {
  const existingItems = await fetchCarouselItems(true);
  const nextOrder = existingItems.reduce(
    (highest, item) => Math.max(highest, item.displayOrder),
    -1,
  ) + 1;
  const payload = {
    media_type: input.type,
    media_url: input.uri,
    subtitle: input.subtitle.trim(),
    main_title: input.mainTitle.trim(),
    point_one: input.pointOne.trim(),
    point_two: input.pointTwo.trim(),
    primary_button_text: input.primaryButtonText.trim(),
    secondary_button_text: input.secondaryButtonText.trim(),
    display_order: input.id || input.displayOrder > 0 ? input.displayOrder : nextOrder,
    is_active: input.isActive,
  };
  const supabase = getSupabaseClient();

  if (input.id) {
    const { error: updateError } = await supabase
      .from('carousel_slides')
      .update(payload)
      .eq('id', input.id);

    if (updateError) {
      throw new Error(`Unable to save carousel content: ${updateError.message}`);
    }

    const { data, error: reloadError } = await supabase
      .from('carousel_slides')
      .select(COLUMNS)
      .eq('id', input.id)
      .maybeSingle();

    if (reloadError || !data) {
      throw new Error(`Carousel update was not confirmed: ${reloadError?.message ?? 'record not found'}`);
    }

    return mapCarouselItem(data as CarouselRow);
  }

  const { data, error: insertError } = await supabase
    .from('carousel_slides')
    .insert(payload)
    .select(COLUMNS)
    .single();

  if (insertError || !data) {
    throw new Error(`Unable to publish carousel content: ${insertError?.message ?? 'record was not created'}`);
  }

  return mapCarouselItem(data as CarouselRow);
}

export async function deleteCarouselItem(id: string): Promise<void> {
  const { data, error } = await getSupabaseClient()
    .from('carousel_slides')
    .delete()
    .eq('id', id)
    .select('id');

  if (error) throw new Error(`Unable to delete carousel content: ${error.message}`);
  if (!data || data.length === 0) throw new Error('Carousel slide was not deleted. Check your management permissions.');
}

export function subscribeToCarouselItems(onChange: () => void): () => void {
  const channel: RealtimeChannel = getSupabaseClient()
    .channel(`carousel-slides-${Date.now()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'carousel_slides' }, onChange)
    .subscribe();
  return () => { void getSupabaseClient().removeChannel(channel); };
}