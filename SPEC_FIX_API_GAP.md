# SPEC: 前后端 API 断层修复

> 基于 `front/API_AUDIT.md` 审计结果，分阶段闭环修复前后端数据断层

---

## P0 — 补齐读操作（打通数据读链路）

**目标**：`fetchInitialData()` 从后端拉取全部实体数据，用户看到的是真实数据而非 demo 数据。

| # | 修改文件 | 改动 |
|---|---------|------|
| P0-1 | `store/useStore.ts` | import 全部 API 模块 (health, milestones, capsules, works, albums, family) |
| P0-2 | `store/useStore.ts` | 新增 `fetchHealth`, `fetchMilestones`, `fetchCapsules`, `fetchWorks`, `fetchAlbums`, `fetchFamily` |
| P0-3 | `store/useStore.ts` | `fetchInitialData()` 并行拉取所有实体，失败不做静默回退，保留 demo 数据兜底但标记来源 |
| P0-4 | `store/useStore.ts` | 新增 `dataSource` 字段区分数据来源: `'server' | 'demo' | 'empty'` |
| P0-5 | `store/useStore.ts` | 新增 `error` 字段在 fetching 失败时显示提示信息 |
| P0-6 | `App.tsx` | `handleLogin` / `useEffect` 中 fetchInitialData 后将数据源状态传达给 UI |

**验收**：登录后所有页面显示的数据来自后端，不再显示硬编码 demo。

---

## P1 — 写操作回写后端（打通数据写链路）

**目标**：所有增删改操作先调用后端 API，成功后再更新本地 state。

| # | 修改文件 | 改动 |
|---|---------|------|
| P1-1 | `store/useStore.ts` | `toggleLike` 改为 async，先调 `timelineApi.toggleLike()` 再更新 state |
| P1-2 | `store/useStore.ts` | `addComment` 改为 async，先调 `timelineApi.addComment()` 再更新 state |
| P1-3 | `store/useStore.ts` | `deleteTimelineEntry` 改为 async，先调 `timelineApi.deleteEntry()` 再更新 state |
| P1-4 | `store/useStore.ts` | `toggleFeatured` 改为 async，先调 `timelineApi.toggleFeatured()` 再更新 state |
| P1-5 | `store/useStore.ts` | `addTimelineEntry` 改为 async，先调 `timelineApi.createEntry()` 再更新 state |
| P1-6 | `store/useStore.ts` | `addMilestone` 改为 async，先调 `milestoneApi.createMilestone()` 再更新 state |
| P1-7 | `store/useStore.ts` | `addCapsule` / `openCapsule` 改为 async，先调后端再更新 state |
| P1-8 | `store/useStore.ts` | `addHealthRecord` / `deleteHealthRecord` 改为 async |
| P1-9 | `store/useStore.ts` | `addCreativeWork` / `deleteCreativeWork` 改为 async |
| P1-10 | `store/useStore.ts` | `createEventAlbum` 改为 async |
| P1-11 | `store/useStore.ts` | `updateBaby` 改为 async |
| P1-12 | `store/useStore.ts` | `createInvite` 改为 async |

**验收**：点赞/评论/删除等操作刷新页面后数据不丢失。

---

## P2 — 补齐缺失功能

**目标**：注册入口、发布动态入口。

| # | 修改文件 | 改动 |
|---|---------|------|
| P2-1 | `LoginPage.tsx` | 新增注册模式切换 (login/register)，调用 `register()` API |
| P2-2 | 新建 `RegisterForm.tsx` | 注册表单组件（用户名、邮箱、密码、确认密码） |
| P2-3 | `HomePage.tsx` 或 `PublishModal.tsx` | 连线 `createEntry` API 实现真正的发布功能 |

**验收**：可以注册新账号并发布动态到后端。

---

## P3 — 清理与优化

**目标**：移除死代码，优化数据流。

| # | 修改文件 | 改动 |
|---|---------|------|
| P3-1 | `store/useStore.ts` | 将 demo 数据提取为独立文件或标记为 `DEMO_MODE` 常量 |
| P3-2 | `store/useStore.ts` | 新增 `dataSource` UI 展示（浮动标签 "演示模式" / "已连接服务器"） |
| P3-3 | 全局搜索 | 移除未引用的 `api/*` 模块确认，或在注释中标注"已对接" |

**验收**：代码清晰，数据来源可识别。

---

## 实施顺序

```
P0 (读) → P1 (写) → P2 (缺失功能) → P3 (清理)
```

每个阶段完成后编译验证，确保无 TypeScript 错误。
