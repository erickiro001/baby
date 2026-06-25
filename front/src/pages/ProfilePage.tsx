import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Key, ChevronRight, LogOut,
  Copy, Check, X, Loader2, Lock,
  Link2, UserPlus,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { uploadFile } from '@/api/upload';
import { updateProfile } from '@/api/auth';
import BottomNav from '@/components/BottomNav';
import type { Baby } from '@/types';

const avatarColor = (name: string) => {
  const colors = ['#FFD6E5', '#A8D8EA', '#FFF4E1', '#B8D4E3', '#FF8A8A', '#D4E5A8'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
};

/* ═══════════════════════════════════════════
   Baby Profile Section (editable + avatar upload)
   ═══════════════════════════════════════════ */
const BabyProfileSection: React.FC = () => {
  const babies = useStore((s) => s.babies);
  const activeBabyId = useStore((s) => s.activeBabyId);
  const setActiveBaby = useStore((s) => s.setActiveBaby);
  const updateBaby = useStore((s) => s.updateBaby);
  const healthRecords = useStore((s) => s.healthRecords);

  const [editBaby, setEditBaby] = useState<Baby | null>(null);
  const [editForm, setEditForm] = useState<Partial<Baby>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const getLatestRecord = (babyId: string) => {
    return healthRecords
      .filter((r) => r.babyId === babyId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  const openEdit = (baby: Baby) => {
    setEditBaby(baby);
    setEditForm({ ...baby });
    setPreviewAvatar(baby.avatar || null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setPreviewAvatar(result);
        setEditForm((prev) => ({ ...prev, avatar: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (editBaby && editForm.name?.trim()) {
      setSaving(true);
      try {
        let avatarUrl = editForm.avatar || '';
        if (avatarFile) {
          const result = await uploadFile(avatarFile);
          avatarUrl = result.url;
        }
        await updateBaby(editBaby.id, {
          name: editForm.name.trim(),
          birthday: editForm.birthday,
          birthTime: editForm.birthTime,
          gender: editForm.gender,
          bloodType: editForm.bloodType,
          birthWeight: editForm.birthWeight,
          birthHeight: editForm.birthHeight,
          notes: editForm.notes?.trim(),
          avatar: avatarUrl,
        });
      } finally {
        setSaving(false);
      }
      setEditBaby(null);
      setPreviewAvatar(null);
      setAvatarFile(null);
    }
  };

  return (
    <div className="mb-4">
      <h2 className="text-base font-heading font-semibold mb-3 px-1" style={{ color: '#5C4033' }}>宝宝档案</h2>
      <div className="space-y-2">
        {babies.map((baby) => {
          const latest = getLatestRecord(baby.id);
          return (
            <motion.div
              key={baby.id}
              className="rounded-xl p-4 relative"
              style={{
                backgroundColor: baby.id === activeBabyId ? '#FFF4E1' : '#FFFCF7',
                border: baby.id === activeBabyId ? '2px solid #5C4033' : '1.5px solid rgba(92,64,51,0.2)',
                boxShadow: 'rgba(92,64,51,0.06) 0 2px 8px',
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveBaby(baby.id)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-heading font-bold shrink-0 overflow-hidden"
                  style={{ backgroundColor: baby.avatar ? 'transparent' : avatarColor(baby.name), color: '#5C4033', border: '2px solid #5C4033' }}
                >
                  {baby.avatar ? (
                    <img src={baby.avatar} alt={baby.name} className="w-full h-full object-cover" />
                  ) : (
                    baby.name.charAt(0)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-heading font-semibold" style={{ color: '#5C4033' }}>{baby.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-heading" style={{ backgroundColor: baby.gender === 'girl' ? '#FFD6E5' : '#A8D8EA', color: '#5C4033' }}>
                      {baby.gender === 'girl' ? '女宝' : '男宝'}
                    </span>
                  </div>
                  <p className="text-xs font-body" style={{ color: '#8B7355' }}>
                    生日 {baby.birthday}{baby.birthTime ? ` ${baby.birthTime}` : ''} · 血型{baby.bloodType || '未知'}
                  </p>
                  <p className="text-xs font-body" style={{ color: '#A09890' }}>
                    {baby.birthWeight || '--'} · {baby.birthHeight || '--'}
                  </p>
                  {latest && (
                    <div className="flex items-center gap-2 mt-1">
                      {latest.weight !== undefined && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-heading" style={{ backgroundColor: '#FFD6E5', color: '#5C4033' }}>体重 {latest.weight}kg</span>}
                      {latest.height !== undefined && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-heading" style={{ backgroundColor: '#A8D8EA', color: '#5C4033' }}>身高 {latest.height}cm</span>}
                    </div>
                  )}
                  {baby.notes && <p className="text-xs font-body mt-0.5" style={{ color: '#A09890' }}>{baby.notes}</p>}
                </div>
                <motion.button
                  className="px-3 py-1.5 rounded-full text-xs font-heading font-semibold shrink-0"
                  style={{ backgroundColor: '#FFD6E5', border: '1.5px solid #5C4033', color: '#5C4033' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => { e.stopPropagation(); openEdit(baby); }}
                >
                  编辑
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Edit Baby Modal */}
      <AnimatePresence>
        {editBaby && (
          <>
            <motion.div className="fixed inset-0 z-[60]" style={{ backgroundColor: 'rgba(92,64,51,0.15)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditBaby(null)} />
            <motion.div className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-2xl overflow-hidden" style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033', borderBottom: 'none' }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(92,64,51,0.1)' }}>
                <h3 className="text-lg font-heading font-semibold" style={{ color: '#5C4033' }}>编辑宝宝信息</h3>
                <button onClick={() => setEditBaby(null)}><X size={18} color="#5C4033" /></button>
              </div>
              <div className="px-4 py-4 space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar">
                {/* Avatar Upload */}
                <div className="flex justify-center">
                  <motion.button
                    className="relative w-20 h-20 rounded-full flex items-center justify-center overflow-hidden"
                    style={{ border: previewAvatar || editForm.avatar ? '2px solid #5C4033' : '2px dashed #A09890' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fileRef.current?.click()}
                  >
                    {previewAvatar || editForm.avatar ? (
                      <motion.img src={previewAvatar || editForm.avatar} alt="avatar" className="w-full h-full object-cover" initial={{ scale: 1.2 }} animate={{ scale: 1 }} />
                    ) : (
                      <Camera size={28} color="#A09890" strokeWidth={1.5} />
                    )}
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </motion.button>
                </div>

                {/* Name */}
                <div><label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>昵称</label><input type="text" value={editForm.name || ''} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} /></div>

                {/* Birthday */}
                <div><label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>生日</label><input type="date" value={editForm.birthday || ''} onChange={(e) => setEditForm((p) => ({ ...p, birthday: e.target.value }))} className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} /></div>

                {/* Birth Time */}
                <div><label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>出生时间（可选）</label><input type="time" value={editForm.birthTime || ''} onChange={(e) => setEditForm((p) => ({ ...p, birthTime: e.target.value }))} className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} /></div>

                {/* Gender */}
                <div><label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>性别</label><div className="flex gap-2">{(['girl', 'boy'] as const).map((g) => <button key={g} className="flex-1 py-2.5 rounded-xl text-sm font-heading border-2" style={{ backgroundColor: editForm.gender === g ? (g === 'girl' ? '#FFD6E5' : '#A8D8EA') : '#FFFCF7', borderColor: editForm.gender === g ? '#5C4033' : '#A09890', color: '#5C4033' }} onClick={() => setEditForm((p) => ({ ...p, gender: g }))}>{g === 'girl' ? '女宝' : '男宝'}</button>)}</div></div>

                {/* Blood Type */}
                <div><label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>血型</label><div className="flex flex-wrap gap-2">{['A', 'B', 'AB', 'O', '未知'].map((bt) => <button key={bt} className="px-3 py-2 rounded-lg text-sm font-heading border-2" style={{ backgroundColor: editForm.bloodType === bt ? '#FFD6E5' : '#FFFCF7', borderColor: editForm.bloodType === bt ? '#5C4033' : '#A09890', color: '#5C4033' }} onClick={() => setEditForm((p) => ({ ...p, bloodType: bt }))}>{bt}</button>)}</div></div>

                {/* Birth Weight & Height */}
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>出生体重</label><input type="text" placeholder="例如: 3.2kg" value={editForm.birthWeight || ''} onChange={(e) => setEditForm((p) => ({ ...p, birthWeight: e.target.value }))} className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} /></div>
                  <div><label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>出生身高</label><input type="text" placeholder="例如: 50cm" value={editForm.birthHeight || ''} onChange={(e) => setEditForm((p) => ({ ...p, birthHeight: e.target.value }))} className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} /></div>
                </div>

                {/* Notes */}
                <div><label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>备注</label><textarea value={editForm.notes || ''} onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))} rows={2} className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none resize-none" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} /></div>

                <motion.button className="w-full py-3 rounded-full font-heading font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: '#FFD6E5', border: '2px solid #5C4033', color: '#5C4033', opacity: saving ? 0.7 : 1 }} whileTap={saving ? {} : { scale: 0.97 }} disabled={saving} onClick={handleSave}>
                  {saving && <Loader2 size={18} className="animate-spin" />}
                  {saving ? '保存中...' : '保存'}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Stats, Family, Invite, Settings sections ─── */
const StatsSection: React.FC = () => {
  const timeline = useStore((s) => s.timeline);
  const milestones = useStore((s) => s.milestones);
  const capsules = useStore((s) => s.capsules);
  const stats = [
    { label: '动态', value: timeline.length },
    { label: '照片', value: timeline.filter((t) => t.type === 'photo').reduce((acc, t) => acc + (t.images?.length || 0), 0) },
    { label: '里程碑', value: milestones.length },
    { label: '胶囊', value: capsules.length },
  ];
  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      {stats.map((s, i) => (
        <motion.div key={s.label} className="rounded-xl p-3 flex flex-col items-center text-center" style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <span className="text-lg font-display" style={{ color: '#5C4033' }}>{s.value}</span>
          <span className="text-[10px] font-heading" style={{ color: '#8B7355' }}>{s.label}</span>
        </motion.div>
      ))}
    </div>
  );
};

const FamilySection: React.FC<{ onOpenInvite: () => void; onOpenJoin: () => void }> = ({ onOpenInvite, onOpenJoin }) => {
  const familySpaces = useStore((s) => s.familySpaces);
  const activeSpaceId = useStore((s) => s.activeSpaceId);
  const activeSpace = familySpaces.find((sp) => sp.id === activeSpaceId);
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-base font-heading font-semibold" style={{ color: '#5C4033' }}>我的家庭</h2>
        <div className="flex gap-2">
          <motion.button className="flex items-center gap-1 text-xs font-heading font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: '#A8D8EA', color: '#5C4033', border: '1.5px solid #5C4033' }} whileTap={{ scale: 0.95 }} onClick={onOpenJoin}>
            <Link2 size={12} />加入家庭
          </motion.button>
          <motion.button className="flex items-center gap-1 text-xs font-heading font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: '#FFD6E5', color: '#5C4033', border: '1.5px solid #5C4033' }} whileTap={{ scale: 0.95 }} onClick={onOpenInvite}>
            <UserPlus size={12} />邀请家人
          </motion.button>
        </div>
      </div>
      {activeSpace && (
        <div className="rounded-xl p-4" style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033', boxShadow: 'rgba(92,64,51,0.06) 0 2px 8px' }}>
          <h3 className="text-sm font-heading font-semibold mb-3" style={{ color: '#5C4033' }}>{activeSpace.name}</h3>
          <div className="flex flex-wrap gap-3">
            {activeSpace.members.map((member) => (
              <div key={member.id} className="flex flex-col items-center gap-1">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-heading font-bold overflow-hidden" style={{ backgroundColor: member.avatar ? 'transparent' : avatarColor(member.name), color: '#5C4033', border: member.isOwner ? '2px solid #5C4033' : '1px solid rgba(92,64,51,0.3)' }}>
                  {member.avatar ? (
                    <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    member.name.charAt(0)
                  )}
                </div>
                <span className="text-[10px] font-heading" style={{ color: '#8B7355' }}>{member.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const InviteModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const inviteRecords = useStore((s) => s.inviteRecords);
  const createInvite = useStore((s) => s.createInvite);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [newRole, setNewRole] = useState('妈妈');
  const [newPermission, setNewPermission] = useState<'edit' | 'upload' | 'view'>('upload');
  const presetRoles = ['妈妈', '爸爸', '爷爷', '奶奶', '外公', '外婆', '哥哥', '姐姐'];

  const activeInvites = inviteRecords.filter((i) => i.status === 'active');

  const handleCreateInvite = () => {
    const code = `BB${Date.now().toString(36).toUpperCase().slice(-6)}`;
    createInvite({ id: `inv_${Date.now()}`, code, role: newRole, permission: newPermission, createdAt: new Date().toISOString(), status: 'active' });
  };

  const handleCopy = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <>
      <motion.div className="fixed inset-0 z-[60]" style={{ backgroundColor: 'rgba(92,64,51,0.15)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-2xl overflow-hidden flex flex-col" style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033', borderBottom: 'none', maxHeight: '70vh' }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
        <div className="px-4 py-3 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'rgba(92,64,51,0.1)' }}>
          <h3 className="text-lg font-heading font-semibold" style={{ color: '#5C4033' }}>邀请家人</h3>
          <button onClick={onClose}><X size={18} color="#5C4033" /></button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4">
          <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#FFF4E1', border: '1.5px dashed #5C4033' }}>
            <h4 className="text-sm font-heading font-semibold mb-2" style={{ color: '#5C4033' }}>生成新邀请</h4>
            <div className="flex gap-2 mb-2 flex-wrap">
              {['妈妈', '爸爸', '爷爷', '奶奶', '外公', '外婆', '哥哥', '姐姐'].map((role) => (
                <button key={role} className="px-2.5 py-1.5 rounded-lg text-xs font-heading border-2" style={{ backgroundColor: newRole === role ? '#FFD6E5' : '#FFFCF7', borderColor: newRole === role ? '#5C4033' : '#A09890', color: '#5C4033' }} onClick={() => setNewRole(role)}>{role}</button>
              ))}
            </div>
            <input
              type="text"
              placeholder="或自定义身份（如：叔叔、姑姑…）"
              value={presetRoles.includes(newRole) ? '' : newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs font-heading outline-none mb-2"
              style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }}
            />
            <div className="flex gap-2 mb-3">{(['edit', 'upload', 'view'] as const).map((p) => <button key={p} className="flex-1 py-2 rounded-lg text-xs font-heading font-semibold border-2" style={{ backgroundColor: newPermission === p ? '#FFD6E5' : '#FFFCF7', borderColor: newPermission === p ? '#5C4033' : '#A09890', color: '#5C4033' }} onClick={() => setNewPermission(p)}>{p === 'edit' ? '可编辑' : p === 'upload' ? '可上传' : '仅查看'}</button>)}</div>
            <motion.button className="w-full py-2.5 rounded-full text-sm font-heading font-semibold" style={{ backgroundColor: '#FFD6E5', border: '2px solid #5C4033', color: '#5C4033' }} whileTap={{ scale: 0.97 }} onClick={handleCreateInvite}><div className="flex items-center justify-center gap-2"><Link2 size={14} />生成邀请码</div></motion.button>
          </div>
          <h4 className="text-sm font-heading font-semibold mb-2" style={{ color: '#5C4033' }}>有效的邀请</h4>
          {activeInvites.length === 0 ? <p className="text-xs font-body text-center py-4" style={{ color: '#A09890' }}>暂无有效邀请</p> : (
            <div className="space-y-2">{activeInvites.map((invite) => (
              <div key={invite.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033' }}>
                <div className="flex-1"><div className="flex items-center gap-2"><span className="text-lg font-heading font-bold tracking-wider" style={{ color: '#5C4033' }}>{invite.code}</span><span className="text-[10px] px-2 py-0.5 rounded-full font-heading" style={{ backgroundColor: '#A8D8EA', color: '#5C4033' }}>{invite.role}</span></div><p className="text-[11px]" style={{ color: '#8B7355' }}>{invite.permission === 'edit' ? '可编辑' : invite.permission === 'upload' ? '可上传（不可删除）' : '仅查看'}</p></div>
                <motion.button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: copiedCode === invite.code ? '#A8D8EA' : '#FFD6E5' }} whileTap={{ scale: 0.9 }} onClick={() => handleCopy(invite.code)}>{copiedCode === invite.code ? <Check size={16} color="#5C4033" /> : <Copy size={16} color="#5C4033" />}</motion.button>
              </div>
            ))}</div>
          )}
          <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: '#F5F0EB' }}><p className="text-xs font-body" style={{ color: '#8B7355' }}>将邀请码发给家人，他们输入后即可加入你的家庭空间，共同记录宝宝的成长。</p></div>
        </div>
      </motion.div>
    </>
  );
};

/* ─── Join Family Modal ─── */
const JoinFamilyModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const fetchFamily = useStore((s) => s.fetchFamily);

  const handleJoin = async () => {
    if (!code.trim()) { setError('请输入邀请码'); return; }
    setJoining(true);
    setError('');
    try {
      const { joinFamily } = await import('@/api/family');
      await joinFamily(code.trim().toUpperCase());
      await fetchFamily();
      onClose();
    } catch (e: unknown) {
      setError((e as { data?: { message?: string } })?.data?.message || '加入失败，请检查邀请码');
    }
    setJoining(false);
  };

  return (
    <>
      <motion.div className="fixed inset-0 z-[60]" style={{ backgroundColor: 'rgba(92,64,51,0.15)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-2xl overflow-hidden" style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033', borderBottom: 'none' }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(92,64,51,0.1)' }}>
          <h3 className="text-lg font-heading font-semibold" style={{ color: '#5C4033' }}>加入家庭</h3>
          <button onClick={onClose}><X size={18} color="#5C4033" /></button>
        </div>
        <div className="px-4 py-6 space-y-4">
          <p className="text-sm font-body text-center" style={{ color: '#8B7355' }}>输入家人分享给你的邀请码，即可加入家庭空间</p>
          <input
            type="text"
            placeholder="输入邀请码（如 TANG2026）"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
            className="w-full px-4 py-3 rounded-xl text-center text-lg font-heading font-bold tracking-widest outline-none"
            style={{ border: error ? '2px solid #FF8A8A' : '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }}
            autoFocus
          />
          {error && <p className="text-xs font-body text-center" style={{ color: '#FF8A8A' }}>{error}</p>}
          <motion.button
            className="w-full py-3 rounded-full font-heading font-semibold text-sm disabled:opacity-50"
            style={{ backgroundColor: '#FFD6E5', border: '2px solid #5C4033', color: '#5C4033' }}
            whileTap={{ scale: 0.97 }}
            onClick={handleJoin}
            disabled={joining}
          >
            {joining ? '加入中…' : '确认加入'}
          </motion.button>
          <p className="text-[10px] font-body text-center" style={{ color: '#A09890' }}>加入后你可以在家庭空间中查看和记录宝宝的成长</p>
        </div>
      </motion.div>
    </>
  );
};

const SettingsSection: React.FC = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [changing, setChanging] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdOk, setPwdOk] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPwd || !newPwd) { setPwdError('请填写所有密码字段'); return; }
    if (newPwd.length < 6) { setPwdError('新密码至少6位'); return; }
    setChanging(true);
    setPwdError('');
    try {
      const { changePassword } = await import('@/api/auth');
      await changePassword(oldPwd, newPwd);
      setPwdOk(true);
      setTimeout(() => { setShowPassword(false); setOldPwd(''); setNewPwd(''); setPwdOk(false); setPwdError(''); }, 1500);
    } catch (e: unknown) {
      setPwdError((e as { data?: { message?: string } })?.data?.message || (e as { message?: string })?.message || '修改失败');
    }
    setChanging(false);
  };

  return (
    <div className="mb-4">
      <h2 className="text-base font-heading font-semibold mb-3 px-1" style={{ color: '#5C4033' }}>设置</h2>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033', boxShadow: 'rgba(92,64,51,0.06) 0 2px 8px' }}>
        <motion.button
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowPassword(true)}
        >
          <Key size={18} color="#5C4033" strokeWidth={2} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-body" style={{ color: '#5C4033' }}>修改密码</p>
          </div>
          <ChevronRight size={16} color="#A09890" />
        </motion.button>
        <div className="border-t mx-4" style={{ borderColor: 'rgba(92,64,51,0.1)' }} />
        <motion.button
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowConfirm(true)}
        >
          <LogOut size={18} color="#FF8A8A" strokeWidth={2} />
          <span className="text-sm font-body" style={{ color: '#FF8A8A' }}>退出登录</span>
        </motion.button>
      </div>

      {/* Confirm Logout */}
      <AnimatePresence>
        {showConfirm && (
          <>
            <motion.div className="fixed inset-0 z-[80]" style={{ backgroundColor: 'rgba(92,64,51,0.3)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirm(false)} />
            <motion.div className="fixed top-1/2 left-4 right-4 z-[90] -translate-y-1/2 rounded-2xl p-6" style={{ backgroundColor: '#FFFCF7', border: '2px solid #5C4033', boxShadow: 'rgba(92,64,51,0.2) 0 8px 24px' }} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
              <h3 className="text-lg font-heading font-semibold text-center mb-2" style={{ color: '#5C4033' }}>确认退出？</h3>
              <p className="text-sm font-body text-center mb-6" style={{ color: '#8B7355' }}>退出后需要重新输入账号密码才能登录。</p>
              <div className="flex gap-3">
                <motion.button className="flex-1 py-3 rounded-full font-heading font-semibold text-sm" style={{ backgroundColor: '#FFFCF7', border: '2px solid #5C4033', color: '#5C4033' }} whileTap={{ scale: 0.97 }} onClick={() => setShowConfirm(false)}>取消</motion.button>
                <motion.button className="flex-1 py-3 rounded-full font-heading font-semibold text-sm" style={{ backgroundColor: '#FF8A8A', border: '2px solid #5C4033', color: '#FFFCF7' }} whileTap={{ scale: 0.97 }} onClick={() => { useStore.getState().logout(); setShowConfirm(false); }}>确认</motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPassword && (
          <>
            <motion.div className="fixed inset-0 z-[60]" style={{ backgroundColor: 'rgba(92,64,51,0.15)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowPassword(false); setPwdError(''); }} />
            <motion.div className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-2xl overflow-hidden" style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033', borderBottom: 'none' }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(92,64,51,0.1)' }}>
                <h3 className="text-lg font-heading font-semibold" style={{ color: '#5C4033' }}>修改密码</h3>
                <button onClick={() => { setShowPassword(false); setPwdError(''); }}><X size={18} color="#5C4033" /></button>
              </div>
              <div className="px-4 py-4 space-y-3">
                {pwdOk ? (
                  <p className="text-center text-sm font-heading font-semibold py-6" style={{ color: '#A8D8EA' }}>密码修改成功</p>
                ) : (
                  <>
                    <div>
                      <label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>原密码</label>
                      <input type="password" placeholder="输入原密码" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} />
                    </div>
                    <div>
                      <label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>新密码</label>
                      <input type="password" placeholder="至少 6 位" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} />
                    </div>
                    {pwdError && <p className="text-xs text-center" style={{ color: '#FF8A8A' }}>{pwdError}</p>}
                    <motion.button className="w-full py-3 rounded-full font-heading font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: '#FFD6E5', border: '2px solid #5C4033', color: '#5C4033', opacity: changing ? 0.7 : 1 }} whileTap={changing ? {} : { scale: 0.97 }} disabled={changing} onClick={handleChangePassword}>
                      {changing && <Loader2 size={18} className="animate-spin" />}
                      {changing ? '修改中...' : '确认修改'}
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ═══════════════════════════════════════════
   Main Profile Page
   ═══════════════════════════════════════════ */
const ProfilePage: React.FC = () => {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const familySpaces = useStore((s) => s.familySpaces);
  const [showInvite, setShowInvite] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const userAvatarRef = useRef<HTMLInputElement>(null);

  const updateAvatars = (fullUrl: string) => {
    if (!user) return;
    setUser({ ...user, avatar: fullUrl });
    localStorage.setItem('user_avatar', fullUrl);
    // 同步更新家庭空间中自己的头像
    useStore.setState((s) => ({
      familySpaces: s.familySpaces.map((fs) => ({
        ...fs,
        members: fs.members.map((m) =>
          m.name === user.name ? { ...m, avatar: fullUrl } : m
        ),
      })),
    }));
  };

  const handleUserAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setUser({ ...user, avatar: result });
    };
    reader.readAsDataURL(file);
    // Upload to server in background
    try {
      const result = await uploadFile(file);
      const fullUrl = result.url;
      updateAvatars(fullUrl);
      await updateProfile({ avatar: fullUrl });
    } catch { /* preview stays */ }
  };

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: '#FFFCF7' }}>
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-4">
          {/* Tappable user avatar */}
          <motion.button
            className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
            style={{
              backgroundColor: user?.avatar ? 'transparent' : avatarColor(user?.name || '我'),
              color: '#5C4033',
              border: '2.5px solid #5C4033',
            }}
            whileTap={{ scale: 0.93 }}
            onClick={() => userAvatarRef.current?.click()}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <>
                <span className="text-xl font-heading font-bold">{user?.name?.charAt(0) || '我'}</span>
                <Camera size={14} color="#FFFCF7" strokeWidth={2} style={{ position: 'absolute', bottom: -1, right: -1, backgroundColor: '#5C4033', borderRadius: '50%', padding: 3 }} />
              </>
            )}
            <input
              ref={userAvatarRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUserAvatarChange}
            />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-display" style={{ color: '#5C4033' }}>{user?.name || '我'}</h1>
          </div>
        </div>
        <StatsSection />
        <BabyProfileSection />
        <FamilySection onOpenInvite={() => setShowInvite(true)} onOpenJoin={() => setShowJoin(true)} />
        <SettingsSection />
      </div>
      <AnimatePresence>{showInvite && <InviteModal onClose={() => setShowInvite(false)} />}</AnimatePresence>
      <AnimatePresence>{showJoin && <JoinFamilyModal onClose={() => setShowJoin(false)} />}</AnimatePresence>
      <BottomNav />
    </div>
  );
};

export default ProfilePage;
