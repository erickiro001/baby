/* ═══════════════════════════════════════════
   宝宝时光 · 家庭馆 — 个人优先版
   核心：我是主人，可以邀请家人/朋友
   ═══════════════════════════════════════════ */

// ─── 用户（我）───
export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  phone?: string;
  createdAt: string;
}

// ─── 宝宝档案 ───
export interface Baby {
  id: string;
  name: string;
  birthday: string;
  gender: 'boy' | 'girl';
  avatar: string;
  bloodType?: string;
  birthWeight?: string;
  birthHeight?: string;
  notes: string;
}

// ─── 家庭空间 ───
export interface FamilySpace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  members: FamilyMember[];
  inviteCode: string;
}

// ─── 家庭成员 ───
export interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  role: string; // 爸爸/妈妈/爷爷/奶奶等
  permission: 'edit' | 'view';
  joinedAt: string;
  isOwner: boolean;
}

// ─── 邀请记录 ───
export interface InviteRecord {
  id: string;
  code: string;
  role: string;
  permission: 'edit' | 'view';
  createdAt: string;
  usedBy?: string;
  usedAt?: string;
  status: 'active' | 'used' | 'expired';
}

// ─── 动态内容 ───
export type ContentType = 'photo' | 'video' | 'text' | 'milestone';

export interface TimelineEntry {
  id: string;
  type: ContentType;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  babyId: string;
  date: string;
  description: string;
  images?: string[];
  imageUrl?: string;
  likes: number;
  liked: boolean;
  comments: EntryComment[];
  featured: boolean;
  tags: string[];
  milestoneTitle?: string;
  albumIds?: string[];
}

export interface EntryComment {
  id: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  timestamp: string;
}

// ─── 事件相册 ───
export interface EventAlbum {
  id: string;
  title: string;
  coverImage: string;
  photoCount: number;
  createdAt: string;
  description: string;
}

// ─── 成长里程碑 ───
export interface Milestone {
  id: string;
  type: 'milestone' | 'event';
  title: string;
  date: string;
  description: string;
  babyId: string;
}

// ─── 时间胶囊 ───
export interface Capsule {
  id: string;
  title: string;
  contentType: 'text' | 'photo' | 'video';
  content: string;
  unlockDate: string;
  createdDate: string;
  isOpened: boolean;
}

// ─── 创意作品 ───
export type CreativeType = 'drawing' | 'handcraft' | 'lego' | 'sandart' | 'photo' | 'video' | 'other';

export interface CreativeWork {
  id: string;
  babyId: string;
  title: string;
  type: CreativeType;
  description: string;
  images?: string[];
  imageUrl?: string;
  date: string;
  createdAt: string;
}

// ─── 页面 ───
export type PageType = 'home' | 'album' | 'growth' | 'profile';

// ─── 相册筛选 ───
export type AlbumFilter = 'all' | 'photo' | 'video' | 'my-upload';
