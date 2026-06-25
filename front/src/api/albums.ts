import { api } from '@/lib/api';

const BASE = '/api/v1';
interface W<T> { code: number; message: string; data: T; }

export interface Album {
  id: number;
  user_id: number;
  title: string;
  cover_image: string;
  photo_count: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAlbumInput {
  title: string;
  cover_image?: string;
  description?: string;
}

export async function getAlbums(): Promise<Album[]> {
  const w = await api.get<W<Album[]>>(`${BASE}/albums`);
  return w.data;
}

export async function createAlbum(input: CreateAlbumInput): Promise<Album> {
  const w = await api.post<W<Album>>(`${BASE}/albums`, input);
  return w.data;
}

export async function addPhotos(albumId: number, entryIds: number[]): Promise<void> {
  await api.post(`${BASE}/albums/${albumId}/photos`, { entry_ids: entryIds });
}

export async function removePhotos(albumId: number, entryIds: number[]): Promise<void> {
  await api.delete(`${BASE}/albums/${albumId}/photos`, { entry_ids: entryIds });
}

export async function updateAlbumCover(albumId: number, coverImage: string): Promise<void> {
  await api.put(`${BASE}/albums/${albumId}/cover`, { cover_image: coverImage });
}

export interface UpdateAlbumInput {
  title?: string;
  description?: string;
}

export async function updateAlbum(albumId: number, input: UpdateAlbumInput): Promise<Album> {
  const w = await api.patch<W<Album>>(`${BASE}/albums/${albumId}`, input);
  return w.data;
}

export async function deleteAlbum(albumId: number): Promise<void> {
  await api.delete(`${BASE}/albums/${albumId}`);
}
