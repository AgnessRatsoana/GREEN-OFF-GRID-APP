import * as ImagePicker from 'expo-image-picker';

import { getSupabaseClient } from '../auth/supabaseClient';

const BUCKET_NAME = 'avatars';

export async function pickProfileImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Media library permission is required to choose a profile image.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  return result.assets[0].uri;
}

function getFileExtension(uri: string): string {
  const cleanUri = uri.split('?')[0];
  const extension = cleanUri.split('.').pop();
  return extension ? extension.toLowerCase() : 'jpg';
}

function getContentType(extension: string): string {
  switch (extension) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'heic':
      return 'image/heic';
    case 'jpeg':
    case 'jpg':
    default:
      return 'image/jpeg';
  }
}

export async function uploadProfileImage(uri: string, userId: string): Promise<string> {
  const supabase = getSupabaseClient();

  const extension = getFileExtension(uri);
  const contentType = getContentType(extension);
  const fileName = `avatar-${Date.now()}.${extension}`;
  const filePath = `${userId}/${fileName}`;

  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error('Unable to read the selected profile image.');
  }

  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, arrayBuffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(`Profile image upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

  if (!data.publicUrl) {
    throw new Error('Profile image uploaded, but a public image URL could not be generated.');
  }

  return data.publicUrl;
}
