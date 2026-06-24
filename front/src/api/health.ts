import { api } from '@/lib/api';

const BASE = '/api/v1';
interface W<T> { code: number; message: string; data: T; }

export interface HealthRecord {
  id: number;
  baby_id: number;
  date: string;
  weight: number;
  height: number;
  head_circumference: number;
  note: string;
  created_at: string;
}

export interface CreateHealthInput {
  baby_id: number;
  date: string;
  weight?: number;
  height?: number;
  head_circumference?: number;
  note?: string;
}

export async function getHealthRecords(babyId: number): Promise<HealthRecord[]> {
  const w = await api.get<W<HealthRecord[]>>(`${BASE}/babies/${babyId}/health`);
  return w.data;
}

export async function createHealthRecord(babyId: number, input: Omit<CreateHealthInput, 'baby_id'>): Promise<HealthRecord> {
  const w = await api.post<W<HealthRecord>>(`${BASE}/babies/${babyId}/health`, { ...input, baby_id: babyId });
  return w.data;
}

export async function deleteHealthRecord(babyId: number, recordId: number): Promise<void> {
  await api.delete(`${BASE}/babies/${babyId}/health/${recordId}`);
}
