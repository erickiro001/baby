import { create } from 'zustand';
import type {
  UserProfile, Baby, FamilySpace, FamilyMember, InviteRecord,
  TimelineEntry, EntryComment, EventAlbum, Milestone, Capsule,
  CreativeWork, PageType, AlbumFilter,
} from '@/types';
import type { HealthRecord } from '@/types/health';
import * as timelineApi from '@/api/timeline';
import * as babyApi from '@/api/babies';
import * as healthApi from '@/api/health';
import * as milestoneApi from '@/api/milestones';
import * as capsuleApi from '@/api/capsules';
import * as worksApi from '@/api/works';
import * as albumsApi from '@/api/albums';
import * as familyApi from '@/api/family';

/* ═══════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════ */
function convertEntry(e: timelineApi.TimelineEntry): TimelineEntry {
  return {
    id: String(e.id),
    type: e.type as TimelineEntry['type'],
    authorId: String(e.author_id),
    authorName: e.author_name,
    authorAvatar: e.author_avatar || '',
    babyId: String(e.baby_id),
    date: e.date,
    description: e.description || '',
    images: (e.images as string[]) || [],
    imageUrl: e.image_url || '',
    videoUrl: (e as Record<string, unknown>).video_url as string | undefined,
    likes: e.likes,
    liked: !!(e.liked),
    featured: e.featured,
    tags: (e.tags as string[]) || [],
    comments: (e.comments || []).map((c): EntryComment => ({
      id: String(c.id),
      authorName: c.author_name,
      authorAvatar: c.author_avatar || '',
      text: c.text,
      timestamp: c.timestamp,
    })),
    milestoneTitle: e.milestone_title || '',
  };
}

function convertHealthRecord(r: healthApi.HealthRecord): HealthRecord {
  return {
    id: String(r.id),
    babyId: String(r.baby_id),
    date: r.date,
    weight: r.weight,
    height: r.height,
    headCircumference: r.head_circumference,
    note: r.note || '',
    createdAt: r.created_at,
  };
}

function convertMilestone(m: milestoneApi.Milestone): Milestone {
  return {
    id: String(m.id),
    type: m.type as 'milestone' | 'event',
    title: m.title,
    date: m.date,
    description: m.description || '',
    babyId: String(m.baby_id),
  };
}

function convertCapsule(c: capsuleApi.Capsule): Capsule {
  return {
    id: String(c.id),
    title: c.title,
    contentType: c.content_type as 'text' | 'photo' | 'video',
    content: c.content || '',
    unlockDate: c.unlock_date,
    createdDate: c.created_date,
    isOpened: c.is_opened,
  };
}

function convertCreativeWork(w: worksApi.CreativeWork): CreativeWork {
  return {
    id: String(w.id),
    babyId: String(w.baby_id),
    title: w.title,
    type: w.type as CreativeWork['type'],
    description: w.description || '',
    images: (w.images as string[]) || [],
    imageUrl: w.image_url || '',
    date: w.date,
    createdAt: w.created_at,
  };
}

function convertAlbum(a: albumsApi.Album): EventAlbum {
  return {
    id: String(a.id),
    title: a.title,
    coverImage: a.cover_image || '',
    photoCount: a.photo_count || 0,
    createdAt: a.created_at,
    description: a.description || '',
  };
}

function convertFamilySpace(fs: familyApi.FamilySpace): FamilySpace {
  return {
    id: String(fs.id),
    name: fs.name,
    ownerId: String(fs.owner_id),
    createdAt: fs.created_at,
    inviteCode: fs.invite_code || '',
    members: (fs.members || []).map((m): FamilyMember => ({
      id: String(m.id),
      name: m.name,
      avatar: m.avatar || '',
      role: m.role,
      permission: (m.permission as 'edit' | 'view') || 'view',
      joinedAt: m.joined_at || '',
      isOwner: !!(m.is_owner),
    })),
  };
}

/* ═══════════════════════════════════════════
   App State
   ═══════════════════════════════════════════ */

/** 数据来源标记 */
export type DataSource = 'server' | 'demo' | 'empty';

interface AppState {
  // ─── 个人 ───
  user: UserProfile | null;
  babies: Baby[];
  activeBabyId: string | null;

  // ─── 家庭空间 ───
  familySpaces: FamilySpace[];
  activeSpaceId: string | null;

  // ─── 邀请 ───
  inviteRecords: InviteRecord[];

  // ─── 内容 ───
  timeline: TimelineEntry[];
  eventAlbums: EventAlbum[];
  milestones: Milestone[];
  capsules: Capsule[];
  healthRecords: HealthRecord[];
  creativeWorks: CreativeWork[];

  // ─── 导航 ───
  currentPage: PageType;

  // ─── 相册 ───
  albumFilter: AlbumFilter;
  albumSearch: string;

  // ─── 批量模式 ───
  batchMode: boolean;
  selectedPhotoIds: string[];

  // ─── 登录 ───
  isLoggedIn: boolean;

  // ─── 弹窗 ───
  isCommentsOpen: boolean;
  selectedEntryId: string | null;
  isInviteModalOpen: boolean;
  isBabyFormOpen: boolean;
  isMilestoneFormOpen: boolean;
  isCapsuleFormOpen: boolean;

  // ─── 数据同步 ───
  loading: boolean;
  dataLoaded: boolean;
  /** 数据来源标记: server = 后端数据, demo = 演示数据, empty = 空 */
  dataSource: DataSource;
  /** fetchInitialData 期间出现的错误消息 */
  fetchError: string | null;

  login: () => void;
  logout: () => void;
  fetchInitialData: () => Promise<void>;
  fetchTimeline: (babyId: string) => Promise<void>;
  fetchBabies: () => Promise<void>;
  fetchHealthRecords: (babyId: string) => Promise<void>;
  fetchMilestones: (babyId: string) => Promise<void>;
  fetchCapsules: () => Promise<void>;
  fetchWorks: (babyId: string) => Promise<void>;
  fetchAlbums: () => Promise<void>;
  fetchFamily: () => Promise<void>;

  setUser: (user: UserProfile) => void;
  addBaby: (baby: Baby) => void;
  updateBaby: (id: string, data: Partial<Baby>) => Promise<void>;
  setActiveBaby: (id: string) => void;

  createFamilySpace: (space: FamilySpace) => Promise<void>;
  setActiveSpace: (id: string) => void;
  addFamilyMember: (spaceId: string, member: FamilyMember) => void;
  removeFamilyMember: (spaceId: string, memberId: string) => void;

  createInvite: (invite: InviteRecord) => Promise<void>;
  useInvite: (code: string, userName: string) => void;

  addTimelineEntry: (entry: TimelineEntry) => Promise<void>;
  deleteTimelineEntry: (id: string) => Promise<void>;
  toggleLike: (entryId: string) => Promise<void>;
  addComment: (entryId: string, text: string) => Promise<void>;
  toggleFeatured: (entryId: string) => Promise<void>;

  createEventAlbum: (album: EventAlbum) => Promise<void>;
  movePhotosToAlbum: (photoIds: string[], albumId: string) => void;

  addMilestone: (ms: Milestone) => Promise<void>;
  addCapsule: (cap: Capsule) => Promise<void>;
  openCapsule: (id: string) => Promise<void>;
  addHealthRecord: (record: HealthRecord) => Promise<void>;
  deleteHealthRecord: (id: string) => Promise<void>;
  addCreativeWork: (work: CreativeWork) => Promise<void>;
  deleteCreativeWork: (id: string) => Promise<void>;

  setCurrentPage: (page: PageType) => void;
  setAlbumFilter: (f: AlbumFilter) => void;
  setAlbumSearch: (s: string) => void;

  setBatchMode: (mode: boolean) => void;
  togglePhotoSelection: (id: string) => void;
  selectAllPhotos: (ids: string[]) => void;
  clearSelection: () => void;
  deleteSelectedPhotos: () => void;

  openComments: (entryId: string) => void;
  closeComments: () => void;
  openInviteModal: () => void;
  closeInviteModal: () => void;
  openBabyForm: () => void;
  closeBabyForm: () => void;
  openMilestoneForm: () => void;
  closeMilestoneForm: () => void;
  openCapsuleForm: () => void;
  closeCapsuleForm: () => void;

  resetAll: () => void;
}

/* ═══════════════════════════════════════════
   Demo Data (仅开发环境兜底)
   ═══════════════════════════════════════════ */
const DEMO_MODE = true; // 设为 false 可关闭 demo 数据兜底

const demoUser: UserProfile = {
  id: 'u1', name: '嘻嘻爸爸', avatar: '', createdAt: '2026-01-01T00:00:00',
};

const demoBabies: Baby[] = [
  { id: 'b1', name: '嘻嘻', birthday: '2024-06-13', gender: 'girl', avatar: '', bloodType: 'O', birthWeight: '13kg', birthHeight: '90cm', notes: '爱笑的小公主' },
];

const demoSpace: FamilySpace = {
  id: 'fs1', name: '嘻嘻的家', ownerId: 'u1', createdAt: '2026-01-01T00:00:00',
  members: [
    { id: 'm1', name: '嘻嘻爸爸', avatar: '', role: '爸爸', permission: 'edit', joinedAt: '2026-01-01T00:00:00', isOwner: true },
  ],
  inviteCode: 'TANG2026',
};

const demoTimeline: TimelineEntry[] = [
  {
    id: 't1', type: 'photo', authorId: 'u1', authorName: '嘻嘻爸爸', authorAvatar: '', babyId: 'b1',
    date: '2026-06-23T08:30:00',
    description: '今天去公园野餐啦，嘻嘻看到了好多小花花！',
    images: [
      'https://picsum.photos/seed/tang01/400/300',
      'https://picsum.photos/seed/tang02/400/400',
      'https://picsum.photos/seed/tang03/400/350',
      'https://picsum.photos/seed/tang04/400/300',
    ],
    likes: 15, liked: false, featured: true,
    tags: ['#公园时光', '#野餐'],
    comments: [
      { id: 'c1', authorName: '嘻嘻爸爸', authorAvatar: '', text: '照片拍得真好！', timestamp: '2026-06-23T09:00:00' },
    ],
  },
  {
    id: 't2', type: 'milestone', authorId: 'u1', authorName: '嘻嘻爸爸', authorAvatar: '', babyId: 'b1',
    date: '2026-06-22T14:00:00',
    description: '嘻嘻今天终于学会爬了！从客厅这头爬到那头，好激动！',
    likes: 32, liked: true, featured: true,
    tags: ['#第一次爬行', '#大事件'],
    milestoneTitle: '嘻嘻会爬了！',
    comments: [],
  },
  {
    id: 't3', type: 'video', authorId: 'u1', authorName: '嘻嘻爸爸', authorAvatar: '', babyId: 'b1',
    date: '2026-06-21T19:20:00',
    description: '嘻嘻第一次吃辅食的视频，小表情太丰富了！',
    imageUrl: 'https://picsum.photos/seed/tangvid/400/225',
    likes: 24, liked: false, featured: false,
    tags: ['#辅食日记', '#第一次'],
    comments: [],
  },
  {
    id: 't4', type: 'text', authorId: 'u1', authorName: '嘻嘻爸爸', authorAvatar: '', babyId: 'b1',
    date: '2026-06-20T21:00:00',
    description: '今天带嘻嘻去做了六个月体检，医生说发育得很好。还打了疫苗，嘻嘻就哭了一下下，很快就笑了，真勇敢！',
    likes: 8, liked: false, featured: false,
    tags: ['#体检', '#疫苗接种'],
    comments: [],
  },
  {
    id: 't5', type: 'photo', authorId: 'u1', authorName: '嘻嘻爸爸', authorAvatar: '', babyId: 'b1',
    date: '2026-06-10T16:00:00',
    description: '第一次带嘻嘻去海边，她听到海浪声一脸懵',
    images: [
      'https://picsum.photos/seed/tangbeach1/400/300',
      'https://picsum.photos/seed/tangbeach2/400/400',
      'https://picsum.photos/seed/tangbeach3/400/350',
    ],
    likes: 28, liked: false, featured: false,
    tags: ['#海边', '#第一次'],
    comments: [],
  },
  {
    id: 't6', type: 'photo', authorId: 'u1', authorName: '嘻嘻爸爸', authorAvatar: '', babyId: 'b1',
    date: '2026-05-23T09:00:00',
    description: '满月的小嘻嘻，那时候好小一只',
    images: ['https://picsum.photos/seed/tangmoon/400/400'],
    likes: 52, liked: true, featured: true,
    tags: ['#回忆', '#满月'],
    comments: [],
  },
];

const demoAlbums: EventAlbum[] = [
  { id: 'ea1', title: '周岁生日派对', coverImage: 'https://picsum.photos/seed/birthday1/300/300', photoCount: 24, createdAt: '2025-06-13T10:00:00', description: '嘻嘻一岁生日，全家团聚' },
  { id: 'ea2', title: '三亚旅行', coverImage: 'https://picsum.photos/seed/sanya1/300/300', photoCount: 18, createdAt: '2026-05-01T08:00:00', description: '第一次带宝宝看大海' },
  { id: 'ea3', title: '满月纪念', coverImage: 'https://picsum.photos/seed/fullmoon1/300/300', photoCount: 12, createdAt: '2024-07-13T09:00:00', description: '嘻嘻满月啦' },
];

const demoCreativeWorks: CreativeWork[] = [
  { id: 'cw1', babyId: 'b1', title: '手指画小鸟', type: 'drawing', description: '嘻嘻第一次用手指画画，画了一只彩色的小鸟，虽然不太像但颜色搭配很棒！', images: ['https://picsum.photos/seed/creative1/400/400'], date: '2026-05-10', createdAt: '2026-05-10T10:00:00' },
  { id: 'cw2', babyId: 'b1', title: '乐高小房子', type: 'lego', description: '用大块乐高搭了一座小房子，还知道把红色放屋顶', images: ['https://picsum.photos/seed/creative2/400/400'], date: '2026-04-20', createdAt: '2026-04-20T15:00:00' },
  { id: 'cw3', babyId: 'b1', title: '母亲节手工卡', type: 'handcraft', description: '手掌印做的爱心卡片，送给妈妈的礼物', images: ['https://picsum.photos/seed/creative3/400/400'], date: '2026-03-08', createdAt: '2026-03-08T09:00:00' },
  { id: 'cw4', babyId: 'b1', title: '沙滩城堡', type: 'sandart', description: '在三亚海边用沙子堆的城堡', images: ['https://picsum.photos/seed/creative4/400/400'], date: '2026-02-15', createdAt: '2026-02-15T14:00:00' },
];

const demoHealthRecords: HealthRecord[] = [
  { id: 'hr1', babyId: 'b1', date: '2024-06-13', weight: 3.2, height: 50, headCircumference: 34, note: '出生', createdAt: '2024-06-13T00:00:00' },
  { id: 'hr2', babyId: 'b1', date: '2024-07-13', weight: 4.8, height: 55, headCircumference: 37, note: '满月', createdAt: '2024-07-13T00:00:00' },
  { id: 'hr3', babyId: 'b1', date: '2024-09-21', weight: 6.2, height: 61, headCircumference: 40, note: '百日', createdAt: '2024-09-21T00:00:00' },
  { id: 'hr4', babyId: 'b1', date: '2024-12-13', weight: 7.8, height: 68, headCircumference: 42, note: '六个月', createdAt: '2024-12-13T00:00:00' },
  { id: 'hr5', babyId: 'b1', date: '2025-06-13', weight: 10.5, height: 78, headCircumference: 46, note: '周岁', createdAt: '2025-06-13T00:00:00' },
  { id: 'hr6', babyId: 'b1', date: '2025-12-13', weight: 12.0, height: 85, headCircumference: 47, note: '十八个月', createdAt: '2025-12-13T00:00:00' },
  { id: 'hr7', babyId: 'b1', date: '2026-06-23', weight: 13, height: 90, headCircumference: 48, note: '两周岁', createdAt: '2026-06-23T00:00:00' },
];

const demoMilestones: Milestone[] = [
  { id: 'ms1', type: 'milestone', title: '第一次翻身', date: '2024-08-20', description: '在床上自己翻过去了', babyId: 'b1' },
  { id: 'ms2', type: 'milestone', title: '第一次叫妈妈', date: '2024-10-05', description: '声音甜甜的', babyId: 'b1' },
  { id: 'ms3', type: 'milestone', title: '第一次游泳', date: '2026-05-01', description: '在婴儿游泳池里扑腾', babyId: 'b1' },
  { id: 'ms4', type: 'event', title: '百日宴', date: '2024-09-21', description: '全家庆祝嘻嘻100天', babyId: 'b1' },
  { id: 'ms5', type: 'event', title: '满月酒', date: '2024-07-13', description: '亲朋好友来祝贺', babyId: 'b1' },
];

const demoCapsules: Capsule[] = [
  { id: 'cap1', title: '给十八岁的你', contentType: 'text', content: '亲爱的宝贝，当你打开这封信的时候...', unlockDate: '2044-06-01', createdDate: '2026-06-01', isOpened: false },
  { id: 'cap2', title: '周岁纪念视频', contentType: 'video', content: 'video_url', unlockDate: '2026-12-15', createdDate: '2026-03-15', isOpened: false },
];

const demoInvites: InviteRecord[] = [
  { id: 'i1', code: 'TANG2026', role: '爸爸', permission: 'edit', createdAt: '2026-06-01T00:00:00', status: 'active' },
];

const initialState = {
  isLoggedIn: false,
  user: DEMO_MODE ? demoUser : null,
  babies: DEMO_MODE ? demoBabies : [],
  activeBabyId: DEMO_MODE ? 'b1' : null,
  familySpaces: DEMO_MODE ? [demoSpace] : [],
  activeSpaceId: DEMO_MODE ? 'fs1' : null,
  inviteRecords: DEMO_MODE ? demoInvites : [],
  timeline: DEMO_MODE ? demoTimeline : [],
  eventAlbums: DEMO_MODE ? demoAlbums : [],
  milestones: DEMO_MODE ? demoMilestones : [],
  capsules: DEMO_MODE ? demoCapsules : [],
  healthRecords: DEMO_MODE ? demoHealthRecords : [],
  creativeWorks: DEMO_MODE ? demoCreativeWorks : [],
  currentPage: 'home' as PageType,
  albumFilter: 'all' as AlbumFilter,
  albumSearch: '',
  batchMode: false,
  selectedPhotoIds: [] as string[],
  isCommentsOpen: false,
  selectedEntryId: null as string | null,
  isInviteModalOpen: false,
  isBabyFormOpen: false,
  isMilestoneFormOpen: false,
  isCapsuleFormOpen: false,
  loading: false,
  dataLoaded: false,
  dataSource: DEMO_MODE ? 'demo' as DataSource : 'empty' as DataSource,
  fetchError: null as string | null,
};

/* ═══════════════════════════════════════════
   Return demo state for offline/error fallback
   ═══════════════════════════════════════════ */
function getDemoFallback() {
  return {
    user: demoUser,
    babies: demoBabies,
    activeBabyId: 'b1',
    familySpaces: [demoSpace],
    activeSpaceId: 'fs1',
    inviteRecords: demoInvites,
    timeline: demoTimeline,
    eventAlbums: demoAlbums,
    milestones: demoMilestones,
    capsules: demoCapsules,
    healthRecords: demoHealthRecords,
    creativeWorks: demoCreativeWorks,
    dataSource: 'demo' as DataSource,
  };
}

/* ═══════════════════════════════════════════
   Store
   ═══════════════════════════════════════════ */
export const useStore = create<AppState>((set, get) => ({
  ...initialState,

  // ─── 登录 ───
  login: () => set({ isLoggedIn: true }),
  logout: () => set({ isLoggedIn: false, currentPage: 'home' }),

  // ─── 个人 ───
  setUser: (user) => set({ user }),
  addBaby: (baby) => set((s) => ({ babies: [...s.babies, baby], activeBabyId: baby.id })),
  updateBaby: async (id, data) => {
    set((s) => ({ babies: s.babies.map((b) => (b.id === id ? { ...b, ...data } : b)) }));
    try {
      await babyApi.updateBaby(Number(id), {
        name: data.name,
        birthday: data.birthday,
        gender: data.gender,
        avatar: data.avatar,
        blood_type: data.bloodType,
        birth_weight: data.birthWeight,
        birth_height: data.birthHeight,
        notes: data.notes,
      });
    } catch { /* 乐观更新 */ }
  },
  setActiveBaby: (id) => set({ activeBabyId: id }),

  // ─── 家庭空间 ───
  createFamilySpace: async (space) => {
    set((s) => ({ familySpaces: [...s.familySpaces, space], activeSpaceId: space.id }));
    try {
      await familyApi.createFamily({
        name: space.name,
        owner_name: get().user?.name || '我',
        invite_code: space.inviteCode,
      });
    } catch { /* 乐观创建 */ }
  },
  setActiveSpace: (id) => set({ activeSpaceId: id }),
  addFamilyMember: (spaceId, member) =>
    set((s) => ({
      familySpaces: s.familySpaces.map((sp) =>
        sp.id === spaceId ? { ...sp, members: [...sp.members, member] } : sp
      ),
    })),
  removeFamilyMember: (spaceId, memberId) =>
    set((s) => ({
      familySpaces: s.familySpaces.map((sp) =>
        sp.id === spaceId ? { ...sp, members: sp.members.filter((m) => m.id !== memberId) } : sp
      ),
    })),

  // ─── 邀请 ───
  createInvite: async (invite) => {
    set((s) => ({ inviteRecords: [...s.inviteRecords, invite] }));
    try {
      const spaceId = get().activeSpaceId;
      if (spaceId) {
        await familyApi.createInvite(Number(spaceId), {
          code: invite.code,
          role: invite.role,
          permission: invite.permission,
        });
      }
    } catch { /* 乐观创建 */ }
  },
  useInvite: (code, userName) =>
    set((s) => ({
      inviteRecords: s.inviteRecords.map((i) =>
        i.code === code ? { ...i, status: 'used' as const, usedBy: userName, usedAt: new Date().toISOString() } : i
      ),
    })),

  // ─── 内容 ───
  addTimelineEntry: async (entry) => {
    // 乐观更新 UI
    set((s) => ({ timeline: [entry, ...s.timeline] }));
    // 异步回写后端
    try {
      await timelineApi.createEntry({
        baby_id: Number(entry.babyId),
        type: entry.type,
        date: entry.date,
        description: entry.description || undefined,
        images: entry.images,
        image_url: entry.imageUrl,
        video_url: entry.videoUrl,
        tags: entry.tags,
        milestone_title: entry.milestoneTitle,
      });
    } catch { /* 失败时暂时不回滚，后续可加 error toast */ }
  },

  deleteTimelineEntry: async (id) => {
    set((s) => ({ timeline: s.timeline.filter((e) => e.id !== id) }));
    try {
      await timelineApi.deleteEntry(Number(id));
    } catch { /* 乐观删除，失败可加重试 */ }
  },

  toggleLike: async (entryId) => {
    // 乐观切换
    set((s) => ({
      timeline: s.timeline.map((e) =>
        e.id === entryId ? { ...e, liked: !e.liked, likes: e.liked ? e.likes - 1 : e.likes + 1 } : e
      ),
    }));
    try {
      await timelineApi.toggleLike(Number(entryId));
    } catch {
      // 回滚
      set((s) => ({
        timeline: s.timeline.map((e) =>
          e.id === entryId ? { ...e, liked: !e.liked, likes: e.liked ? e.likes - 1 : e.likes + 1 } : e
        ),
      }));
    }
  },

  addComment: async (entryId, text) => {
    const newComment: EntryComment = {
      id: `temp_${Date.now()}`,
      authorName: get().user?.name || '我',
      authorAvatar: get().user?.avatar || '',
      text,
      timestamp: new Date().toISOString(),
    };
    // 乐观添加
    set((s) => ({
      timeline: s.timeline.map((e) =>
        e.id === entryId ? { ...e, comments: [...e.comments, newComment] } : e
      ),
    }));
    try {
      const result = await timelineApi.addComment(Number(entryId), text);
      // 用服务端返回的真实 ID 替换临时 ID
      set((s) => ({
        timeline: s.timeline.map((e) =>
          e.id === entryId ? {
            ...e,
            comments: e.comments.map((c) =>
              c.id === newComment.id
                ? { ...c, id: String(result.id), timestamp: result.timestamp }
                : c
            ),
          } : e
        ),
      }));
    } catch {
      // 移除临时评论
      set((s) => ({
        timeline: s.timeline.map((e) =>
          e.id === entryId ? { ...e, comments: e.comments.filter((c) => c.id !== newComment.id) } : e
        ),
      }));
    }
  },

  toggleFeatured: async (entryId) => {
    set((s) => ({
      timeline: s.timeline.map((e) => (e.id === entryId ? { ...e, featured: !e.featured } : e)),
    }));
    try {
      await timelineApi.toggleFeatured(Number(entryId));
    } catch {
      // 回滚
      set((s) => ({
        timeline: s.timeline.map((e) => (e.id === entryId ? { ...e, featured: !e.featured } : e)),
      }));
    }
  },

  // ─── 相册 ───
  createEventAlbum: async (album) => {
    set((s) => ({ eventAlbums: [...s.eventAlbums, album] }));
    try {
      await albumsApi.createAlbum({
        title: album.title,
        cover_image: album.coverImage || undefined,
        description: album.description || undefined,
      });
    } catch { /* 乐观创建 */ }
  },
  movePhotosToAlbum: (photoIds, albumId) =>
    set((s) => ({
      timeline: s.timeline.map((e) => {
        if (photoIds.includes(e.id)) {
          const current = e.albumIds || [];
          return !current.includes(albumId) ? { ...e, albumIds: [...current, albumId] } : e;
        }
        return e;
      }),
    })),

  // ─── 成长 ───
  addMilestone: async (ms) => {
    set((s) => ({ milestones: [ms, ...s.milestones] }));
    try {
      await milestoneApi.createMilestone(Number(ms.babyId), {
        type: ms.type,
        title: ms.title,
        date: ms.date,
        description: ms.description || undefined,
      });
    } catch { /* 乐观创建 */ }
  },

  addCapsule: async (cap) => {
    set((s) => ({ capsules: [...s.capsules, cap] }));
    try {
      await capsuleApi.createCapsule({
        title: cap.title,
        content_type: cap.contentType,
        content: cap.content,
        unlock_date: cap.unlockDate,
        created_date: cap.createdDate,
      });
    } catch { /* 乐观创建 */ }
  },

  openCapsule: async (id) => {
    set((s) => ({ capsules: s.capsules.map((c) => (c.id === id ? { ...c, isOpened: true } : c)) }));
    try {
      await capsuleApi.openCapsule(Number(id));
    } catch {
      // 回滚
      set((s) => ({ capsules: s.capsules.map((c) => (c.id === id ? { ...c, isOpened: false } : c)) }));
    }
  },

  // ─── 健康记录 ───
  addHealthRecord: async (record) => {
    // 乐观更新（保持原有的 birthWeight/birthHeight 自动更新逻辑）
    set((s) => {
      const newRecords = [record, ...s.healthRecords];
      const baby = s.babies.find((b) => b.id === record.babyId);
      if (baby && record.date) {
        const recordDate = new Date(record.date).getTime();
        const existingLatest = s.healthRecords
          .filter((r) => r.babyId === record.babyId && r.id !== record.id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        const isLatest = !existingLatest || recordDate >= new Date(existingLatest.date).getTime();
        if (isLatest) {
          const updates: Partial<Baby> = {};
          if (record.weight !== undefined) updates.birthWeight = `${record.weight}kg`;
          if (record.height !== undefined) updates.birthHeight = `${record.height}cm`;
          return {
            healthRecords: newRecords,
            babies: s.babies.map((b) => (b.id === record.babyId ? { ...b, ...updates } : b)),
          };
        }
      }
      return { healthRecords: newRecords };
    });
    // 异步回写后端
    try {
      await healthApi.createHealthRecord(Number(record.babyId), {
        date: record.date,
        weight: record.weight,
        height: record.height,
        head_circumference: record.headCircumference,
        note: record.note,
      });
    } catch { /* 乐观创建 */ }
  },

  deleteHealthRecord: async (id) => {
    set((s) => ({ healthRecords: s.healthRecords.filter((r) => r.id !== id) }));
    try {
      const babyId = get().activeBabyId;
      if (babyId) {
        await healthApi.deleteHealthRecord(Number(babyId), Number(id));
      }
    } catch { /* 乐观删除 */ }
  },

  // ─── 创意作品 ───
  addCreativeWork: async (work) => {
    set((s) => ({ creativeWorks: [work, ...s.creativeWorks] }));
    try {
      await worksApi.createWork(Number(work.babyId), {
        title: work.title,
        type: work.type,
        date: work.date,
        description: work.description || undefined,
        images: work.images,
        image_url: work.imageUrl,
      });
    } catch { /* 乐观创建 */ }
  },

  deleteCreativeWork: async (id) => {
    set((s) => ({ creativeWorks: s.creativeWorks.filter((w) => w.id !== id) }));
    try {
      const babyId = get().activeBabyId;
      if (babyId) {
        await worksApi.deleteWork(Number(babyId), Number(id));
      }
    } catch { /* 乐观删除 */ }
  },

  // ─── 导航 ───
  setCurrentPage: (page) => set({ currentPage: page }),
  setAlbumFilter: (f) => set({ albumFilter: f }),
  setAlbumSearch: (s) => set({ albumSearch: s }),

  // ─── 批量 ───
  setBatchMode: (mode) => set({ batchMode: mode, selectedPhotoIds: [] }),
  selectAllPhotos: (ids) => set({ selectedPhotoIds: ids }),
  togglePhotoSelection: (id) =>
    set((s) => ({
      selectedPhotoIds: s.selectedPhotoIds.includes(id)
        ? s.selectedPhotoIds.filter((pid) => pid !== id)
        : [...s.selectedPhotoIds, id],
    })),
  clearSelection: () => set({ selectedPhotoIds: [] }),
  deleteSelectedPhotos: () =>
    set((s) => ({
      timeline: s.timeline.filter((e) => !s.selectedPhotoIds.includes(e.id)),
      selectedPhotoIds: [],
      batchMode: false,
    })),

  // ─── 弹窗 ───
  openComments: (entryId) => set({ isCommentsOpen: true, selectedEntryId: entryId }),
  closeComments: () => set({ isCommentsOpen: false, selectedEntryId: null }),
  openInviteModal: () => set({ isInviteModalOpen: true }),
  closeInviteModal: () => set({ isInviteModalOpen: false }),
  openBabyForm: () => set({ isBabyFormOpen: true }),
  closeBabyForm: () => set({ isBabyFormOpen: false }),
  openMilestoneForm: () => set({ isMilestoneFormOpen: true }),
  closeMilestoneForm: () => set({ isMilestoneFormOpen: false }),
  openCapsuleForm: () => set({ isCapsuleFormOpen: true }),
  closeCapsuleForm: () => set({ isCapsuleFormOpen: false }),

  // ═══════════════════════════════════════════
  // P0: 数据同步 — 全部从后端拉取
  // ═══════════════════════════════════════════

  fetchBabies: async () => {
    try {
      const data = await babyApi.getBabies();
      const converted: Baby[] = data.map((b) => ({
        id: String(b.id),
        name: b.name,
        birthday: b.birthday,
        gender: b.gender as 'boy' | 'girl',
        avatar: b.avatar || '',
        bloodType: b.blood_type || '',
        birthWeight: b.birth_weight || '',
        birthHeight: b.birth_height || '',
        notes: b.notes || '',
      }));
      if (converted.length > 0) {
        const current = get();
        set({
          babies: converted,
          activeBabyId: current.activeBabyId && converted.some((b) => b.id === current.activeBabyId)
            ? current.activeBabyId
            : converted[0].id,
          dataSource: 'server',
        });
      } else {
        set({ babies: [], dataSource: 'empty' });
      }
    } catch {
      // 后端不可用：保留 demo 兜底
      if (DEMO_MODE) {
        set(getDemoFallback());
      }
    }
  },

  fetchTimeline: async (babyId: string) => {
    const bid = Number(babyId);
    if (!bid || isNaN(bid)) return;
    try {
      const data = await timelineApi.getTimeline({ baby_id: bid });
      const converted = data.map(convertEntry);
      set({ timeline: converted, dataSource: 'server' });
    } catch {
      // 保留当前数据
    }
  },

  fetchHealthRecords: async (babyId: string) => {
    const bid = Number(babyId);
    if (!bid || isNaN(bid)) return;
    try {
      const data = await healthApi.getHealthRecords(bid);
      const converted = data.map(convertHealthRecord);
      set({ healthRecords: converted, dataSource: 'server' });
    } catch { /* 保留当前数据 */ }
  },

  fetchMilestones: async (babyId: string) => {
    const bid = Number(babyId);
    if (!bid || isNaN(bid)) return;
    try {
      const data = await milestoneApi.getMilestones(bid);
      const converted = data.map(convertMilestone);
      set({ milestones: converted, dataSource: 'server' });
    } catch { /* 保留当前数据 */ }
  },

  fetchCapsules: async () => {
    try {
      const data = await capsuleApi.getCapsules();
      const converted = data.map(convertCapsule);
      set({ capsules: converted, dataSource: 'server' });
    } catch { /* 保留当前数据 */ }
  },

  fetchWorks: async (babyId: string) => {
    const bid = Number(babyId);
    if (!bid || isNaN(bid)) return;
    try {
      const data = await worksApi.getWorks(bid);
      const converted = data.map(convertCreativeWork);
      set({ creativeWorks: converted, dataSource: 'server' });
    } catch { /* 保留当前数据 */ }
  },

  fetchAlbums: async () => {
    try {
      const data = await albumsApi.getAlbums();
      const converted = data.map(convertAlbum);
      set({ eventAlbums: converted, dataSource: 'server' });
    } catch { /* 保留当前数据 */ }
  },

  fetchFamily: async () => {
    try {
      const data = await familyApi.getFamilies();
      const converted = data.map(convertFamilySpace);
      if (converted.length > 0) {
        set({
          familySpaces: converted,
          activeSpaceId: converted[0].id,
          dataSource: 'server',
        });
      }
    } catch { /* 保留当前数据 */ }
  },

  fetchInitialData: async () => {
    set({ loading: true, fetchError: null });
    const errors: string[] = [];

    const safeFetch = async (label: string, fn: () => Promise<void>) => {
      try {
        await fn();
      } catch {
        errors.push(label);
      }
    };

    // 1) 先拉取用户关联数据（按依赖顺序）
    await safeFetch('babies', () => get().fetchBabies());
    const state = get();
    const activeBabyId = state.activeBabyId;
    const isRealId = activeBabyId && /^\d+$/.test(activeBabyId);

    if (isRealId) {
      // 2) 并行拉取所有与宝宝相关的数据
      await Promise.all([
        safeFetch('timeline', () => state.fetchTimeline(activeBabyId!)),
        safeFetch('health', () => state.fetchHealthRecords(activeBabyId!)),
        safeFetch('milestones', () => state.fetchMilestones(activeBabyId!)),
        safeFetch('works', () => state.fetchWorks(activeBabyId!)),
      ]);
    }

    // 3) 拉取全局数据（不依赖 babyId）
    await Promise.all([
      safeFetch('capsules', () => state.fetchCapsules()),
      safeFetch('albums', () => state.fetchAlbums()),
      safeFetch('family', () => state.fetchFamily()),
    ]);

    // 4) 汇总结果
    const finalState = get();
    const hadErrors = errors.length > 0;
    const noServerData = finalState.dataSource !== 'server';

    if (noServerData && DEMO_MODE) {
      set(getDemoFallback());
    }

    set({
      loading: false,
      dataLoaded: true,
      fetchError: hadErrors && noServerData
        ? `部分数据加载失败: ${errors.join(', ')}，当前为演示数据`
        : hadErrors
          ? `部分数据加载失败: ${errors.join(', ')}`
          : null,
    });
  },

  resetAll: () => set({ ...initialState, isLoggedIn: false, healthRecords: demoHealthRecords }),
}));
