import { api } from '@/lib/api';

const BASE = '/api/v1';
interface W<T> { code: number; message: string; data: T; }

export interface Milestone {
  id: number;
  baby_id: number;
  type: string;
  title: string;
  date: string;
  description: string;
  created_at: string;
}

export interface CreateMilestoneInput {
  baby_id: number;
  type: string;
  title: string;
  date: string;
  description?: string;
}

export async function getMilestones(babyId: number): Promise<Milestone[]> {
  const w = await api.get<W<Milestone[]>>(`${BASE}/babies/${babyId}/milestones`);
  return w.data;
}

export async function createMilestone(babyId: number, input: Omit<CreateMilestoneInput, 'baby_id'>): Promise<Milestone> {
  const w = await api.post<W<Milestone>>(`${BASE}/babies/${babyId}/milestones`, { ...input, baby_id: babyId });
  return w.data;
}

export async function deleteMilestone(babyId: number, milestoneId: number): Promise<void> {
  await api.delete(`${BASE}/babies/${babyId}/milestones/${milestoneId}`);
}
