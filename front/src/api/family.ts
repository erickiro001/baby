import { api } from '@/lib/api';

const BASE = '/api/v1';
interface W<T> { code: number; message: string; data: T; }

export interface FamilyMember {
  id: number;
  user_id: number;
  space_id: number;
  name: string;
  avatar: string;
  role: string;
  permission: string;
  is_owner: boolean;
  joined_at: string;
}

export interface FamilySpace {
  id: number;
  owner_id: number;
  name: string;
  invite_code: string;
  members: FamilyMember[];
  created_at: string;
  updated_at: string;
}

export interface InviteRecord {
  id: number;
  space_id: number;
  code: string;
  role: string;
  permission: string;
  status: string;
  used_by: number;
  used_at: string;
  created_at: string;
}

export interface CreateSpaceInput {
  name: string;
  owner_name: string;
  invite_code: string;
}

export interface CreateInviteInput {
  code: string;
  role?: string;
  permission: string;
}

export async function getFamilies(): Promise<FamilySpace[]> {
  const w = await api.get<W<FamilySpace[]>>(`${BASE}/family`);
  return w.data;
}

export async function createFamily(input: CreateSpaceInput): Promise<FamilySpace> {
  const w = await api.post<W<FamilySpace>>(`${BASE}/family`, input);
  return w.data;
}

export async function createInvite(spaceId: number, input: CreateInviteInput): Promise<InviteRecord> {
  const w = await api.post<W<InviteRecord>>(`${BASE}/family/${spaceId}/invites`, input);
  return w.data;
}

export async function updateFamily(spaceId: number, name: string): Promise<void> {
  await api.patch<W<null>>(`${BASE}/family/${spaceId}`, { name });
}
