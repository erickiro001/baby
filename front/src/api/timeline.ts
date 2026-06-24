import { api } from '@/lib/api';

const BASE = '/api/v1';

interface ApiWrapper<T> { code: number; message: string; data: T; }

// ─── Types ───
export interface EntryComment {
  id: number;
  user_id: number;
  entry_id: number;
  author_name: string;
  author_avatar: string;
  text: string;
  timestamp: string;
}

export interface TimelineEntry {
  id: number;
  author_id: number;
  author_name: string;
  author_avatar: string;
  baby_id: number;
  type: string;
  date: string;
  description: string;
  images: string[];
  image_url: string;
  video_url?: string;
  likes: number;
  liked?: boolean;
  featured: boolean;
  tags: string[];
  comments: EntryComment[];
  milestone_title: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEntryInput {
  baby_id: number;
  type: string;
  date: string;
  description?: string;
  images?: string[];
  image_url?: string;
  video_url?: string;
  tags?: string[];
  milestone_title?: string;
}

export interface ListTimelineParams {
  baby_id: number;
  type?: string;
  name?: string;
  content_type?: string;
}

export async function getTimeline(params: ListTimelineParams): Promise<TimelineEntry[]> {
  const query = new URLSearchParams();
  query.set('baby_id', String(params.baby_id));
  if (params.type) query.set('type', params.type);
  if (params.name) query.set('name', params.name);
  if (params.content_type) query.set('content_type', params.content_type);
  const w = await api.get<ApiWrapper<TimelineEntry[]>>(`${BASE}/timeline?${query}`);
  return w.data;
}

export async function getEntry(id: number): Promise<TimelineEntry> {
  const w = await api.get<ApiWrapper<TimelineEntry>>(`${BASE}/timeline/${id}`);
  return w.data;
}

export async function createEntry(input: CreateEntryInput): Promise<TimelineEntry> {
  const w = await api.post<ApiWrapper<TimelineEntry>>(`${BASE}/timeline`, input);
  return w.data;
}

export async function deleteEntry(id: number): Promise<void> {
  await api.delete(`${BASE}/timeline/${id}`);
}

export async function toggleLike(entryId: number): Promise<void> {
  await api.post(`${BASE}/timeline/${entryId}/like`);
}

export async function toggleFeatured(entryId: number): Promise<void> {
  await api.patch(`${BASE}/timeline/${entryId}/featured`);
}

export async function addComment(entryId: number, text: string): Promise<EntryComment> {
  const w = await api.post<ApiWrapper<EntryComment>>(`${BASE}/timeline/${entryId}/comments`, { text });
  return w.data;
}

export async function deleteComment(entryId: number, commentId: number): Promise<void> {
  await api.delete(`${BASE}/timeline/${entryId}/comments/${commentId}`);
}
