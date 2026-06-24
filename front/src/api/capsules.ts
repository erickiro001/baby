import { api } from '@/lib/api';

const BASE = '/api/v1';
interface W<T> { code: number; message: string; data: T; }

export interface Capsule {
  id: number;
  user_id: number;
  title: string;
  content_type: string;
  content: string;
  unlock_date: string;
  created_date: string;
  is_opened: boolean;
  created_at: string;
}

export interface CreateCapsuleInput {
  title: string;
  content_type: string;
  content: string;
  unlock_date: string;
  created_date: string;
}

export async function getCapsules(): Promise<Capsule[]> {
  const w = await api.get<W<Capsule[]>>(`${BASE}/capsules`);
  return w.data;
}

export async function createCapsule(input: CreateCapsuleInput): Promise<Capsule> {
  const w = await api.post<W<Capsule>>(`${BASE}/capsules`, input);
  return w.data;
}

export async function openCapsule(id: number): Promise<void> {
  await api.post(`${BASE}/capsules/${id}/open`);
}
