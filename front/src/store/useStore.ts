import { create } from 'zustand';
import type {
  UserProfile, Baby, FamilySpace, FamilyMember, InviteRecord,
  TimelineEntry, EntryComment, EventAlbum, Milestone, Capsule,
  CreativeWork, PageType, AlbumFilter,
} from '@/types';
import type { HealthRecord } from '@/types/health';

/* ═══════════════════════════════════════════
   App State
   ═══════════════════════════════════════════ */
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

  login: () => void;
  logout: () => void;
  setUser: (user: UserProfile) => void;
  addBaby: (baby: Baby) => void;
  updateBaby: (id: string, data: Partial<Baby>) => void;
  setActiveBaby: (id: string) => void;

  createFamilySpace: (space: FamilySpace) => void;
  setActiveSpace: (id: string) => void;
  addFamilyMember: (spaceId: string, member: FamilyMember) => void;
  removeFamilyMember: (spaceId: string, memberId: string) => void;

  createInvite: (invite: InviteRecord) => void;
  useInvite: (code: string, userName: string) => void;

  addTimelineEntry: (entry: TimelineEntry) => void;
  deleteTimelineEntry: (id: string) => void;
  toggleLike: (entryId: string) => void;
  addComment: (entryId: string, comment: EntryComment) => void;
  toggleFeatured: (entryId: string) => void;

  createEventAlbum: (album: EventAlbum) => void;
  movePhotosToAlbum: (photoIds: string[], albumId: string) => void;

  addMilestone: (ms: Milestone) => void;
  addCapsule: (cap: Capsule) => void;
  openCapsule: (id: string) => void;
  addHealthRecord: (record: HealthRecord) => void;
  deleteHealthRecord: (id: string) => void;
  addCreativeWork: (work: CreativeWork) => void;
  deleteCreativeWork: (id: string) => void;

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
   Demo Data
   ═══════════════════════════════════════════ */
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
};

/* ═══════════════════════════════════════════
   Store
   ═══════════════════════════════════════════ */
export const useStore = create<AppState>((set) => ({
  ...initialState,

  // ─── 登录 ───
  login: () => set({ isLoggedIn: true }),
  logout: () => set({ isLoggedIn: false, currentPage: 'home' }),

  // ─── 个人 ───
  setUser: (user) => set({ user }),
  addBaby: (baby) => set((s) => ({ babies: [...s.babies, baby], activeBabyId: baby.id })),
  updateBaby: (id, data) => set((s) => ({ babies: s.babies.map((b) => (b.id === id ? { ...b, ...data } : b)) })),
  setActiveBaby: (id) => set({ activeBabyId: id }),

  // ─── 家庭空间 ───
  createFamilySpace: (space) => set((s) => ({ familySpaces: [...s.familySpaces, space], activeSpaceId: space.id })),
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
  createInvite: (invite) => set((s) => ({ inviteRecords: [...s.inviteRecords, invite] })),
  useInvite: (code, userName) =>
    set((s) => ({
      inviteRecords: s.inviteRecords.map((i) =>
        i.code === code ? { ...i, status: 'used' as const, usedBy: userName, usedAt: new Date().toISOString() } : i
      ),
    })),

  // ─── 内容 ───
  addTimelineEntry: (entry) => set((s) => ({ timeline: [entry, ...s.timeline] })),
  deleteTimelineEntry: (id) => set((s) => ({ timeline: s.timeline.filter((e) => e.id !== id) })),
  toggleLike: (entryId) =>
    set((s) => ({
      timeline: s.timeline.map((e) =>
        e.id === entryId ? { ...e, liked: !e.liked, likes: e.liked ? e.likes - 1 : e.likes + 1 } : e
      ),
    })),
  addComment: (entryId, comment) =>
    set((s) => ({
      timeline: s.timeline.map((e) =>
        e.id === entryId ? { ...e, comments: [...e.comments, comment] } : e
      ),
    })),
  toggleFeatured: (entryId) =>
    set((s) => ({
      timeline: s.timeline.map((e) => (e.id === entryId ? { ...e, featured: !e.featured } : e)),
    })),

  // ─── 相册 ───
  createEventAlbum: (album) => set((s) => ({ eventAlbums: [...s.eventAlbums, album] })),
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
  addMilestone: (ms) => set((s) => ({ milestones: [ms, ...s.milestones] })),
  addCapsule: (cap) => set((s) => ({ capsules: [...s.capsules, cap] })),
  openCapsule: (id) =>
    set((s) => ({ capsules: s.capsules.map((c) => (c.id === id ? { ...c, isOpened: true } : c)) })),

  // ─── 健康记录 ───
  addHealthRecord: (record) =>
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
    }),
  deleteHealthRecord: (id) => set((s) => ({ healthRecords: s.healthRecords.filter((r) => r.id !== id) })),

  // ─── 创意作品 ───
  addCreativeWork: (work) => set((s) => ({ creativeWorks: [work, ...s.creativeWorks] })),
  deleteCreativeWork: (id) => set((s) => ({ creativeWorks: s.creativeWorks.filter((w) => w.id !== id) })),

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

  resetAll: () => set({ ...initialState, isLoggedIn: false, healthRecords: demoHealthRecords }),
}));
