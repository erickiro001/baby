import { api } from '@/lib/api';

const BASE = '/api/v1';

interface ApiWrapper<T> { code: number; message: string; data: T; }

// ─── Types ───
export interface Baby {
  id: number;
  user_id: number;
  name: string;
  birthday: string;
  gender: string;
  avatar: string;
  blood_type: string;
  birth_weight: string;
  birth_height: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBabyInput {
  name: string;
  birthday: string;
  gender: string;
  avatar?: string;
  blood_type?: string;
  birth_weight?: string;
  birth_height?: string;
  notes?: string;
}

export interface UpdateBabyInput extends Partial<CreateBabyInput> {}

export async function getBabies(): Promise<Baby[]> {
  const w = await api.get<ApiWrapper<Baby[]>>(`${BASE}/babies`);
  return w.data;
}

export async function getBaby(id: number): Promise<Baby> {
  const w = await api.get<ApiWrapper<Baby>>(`${BASE}/babies/${id}`);
  return w.data;
}

export async function createBaby(input: CreateBabyInput): Promise<Baby> {
  const w = await api.post<ApiWrapper<Baby>>(`${BASE}/babies`, input);
  return w.data;
}

export async function updateBaby(id: number, input: UpdateBabyInput): Promise<Baby> {
  const w = await api.put<ApiWrapper<Baby>>(`${BASE}/babies/${id}`, input);
  return w.data;
}

export async function deleteBaby(id: number): Promise<void> {
  await api.delete(`${BASE}/babies/${id}`);
}
