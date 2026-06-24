import { api } from '@/lib/api';

const BASE = '/api/v1';
interface W<T> { code: number; message: string; data: T; }

export interface CreativeWork {
  id: number;
  baby_id: number;
  title: string;
  type: string;
  date: string;
  description: string;
  images: string[];
  image_url: string;
  created_at: string;
}

export interface CreateCreativeWorkInput {
  baby_id: number;
  title: string;
  type: string;
  date: string;
  description?: string;
  images?: string[];
  image_url?: string;
}

export async function getWorks(babyId: number): Promise<CreativeWork[]> {
  const w = await api.get<W<CreativeWork[]>>(`${BASE}/babies/${babyId}/works`);
  return w.data;
}

export async function createWork(babyId: number, input: Omit<CreateCreativeWorkInput, 'baby_id'>): Promise<CreativeWork> {
  const w = await api.post<W<CreativeWork>>(`${BASE}/babies/${babyId}/works`, { ...input, baby_id: babyId });
  return w.data;
}

export async function deleteWork(babyId: number, workId: number): Promise<void> {
  await api.delete(`${BASE}/babies/${babyId}/works/${workId}`);
}
