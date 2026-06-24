# 🔍 前端项目 API 接口使用情况审计报告

> 审计时间：2026-06-24 | 审计范围：`front/src/` 全部源码

---

## 一、API 基础设施

| 项目 | 详情 |
|------|------|
| **HTTP 库** | 原生 `fetch`（`/src/lib/api.ts` 封装） |
| **Base URL** | 开发环境 `http://localhost:8080`，生产环境同域空字符串 |
| **认证方式** | Bearer Token（localStorage `token`） |
| **超时设置** | 默认 10 秒（AbortController） |
| **错误处理** | 状态码非 2xx 抛 `ApiError`，超时抛 AbortError |
| **统一响应格式** | `{ code: number, message: string, data: T }` |

---

## 二、接口定义 vs 实际调用对比

### ✅ 已定义且已调用（4 个）

| 接口 | 方法 | 路径 | 调用位置 | 数据走向 |
|------|------|------|---------|---------|
| login | POST | `/api/v1/auth/login` | `LoginPage.tsx:24` | 获取 token → localStorage → 更新 isLoggedIn |
| getProfile | GET | `/api/v1/profile` | `App.tsx:27` | 验证 token 有效性，触发自动登录 |
| getBabies | GET | `/api/v1/babies` | `store/useStore.ts:455` | 后端数据 → 转换为前端 Baby 类型 → zustand state |
| getTimeline | GET | `/api/v1/timeline` | `store/useStore.ts:479` | 后端数据 → convertEntry() → zustand state |

### ⚠️ 已定义但从未调用（29 个）

#### auth.ts（1 个未用）
| 函数 | 路径 | 说明 |
|------|------|------|
| `register()` | POST `/api/v1/auth/register` | 注册接口已定义但没有注册页面/入口 |

#### babies.ts（4 个未用）
| 函数 | 路径 | 说明 |
|------|------|------|
| `getBaby()` | GET `/api/v1/babies/:id` | 不存在单个宝宝详情页 |
| `createBaby()` | POST `/api/v1/babies` | 无创建宝宝入口 |
| `updateBaby()` | PUT `/api/v1/babies/:id` | ProfilePage 有编辑UI但只改了本地 state |
| `deleteBaby()` | DELETE `/api/v1/babies/:id` | 无删除宝宝功能 |

#### timeline.ts（7 个未用）
| 函数 | 路径 | 说明 |
|------|------|------|
| `getEntry()` | GET `/api/v1/timeline/:id` | 无详情页 |
| `createEntry()` | POST `/api/v1/timeline` | 无发布入口，只有 PublishModal 但未连线 |
| `deleteEntry()` | DELETE `/api/v1/timeline/:id` | 删除操作只改本地 state |
| `toggleLike()` | POST `/api/v1/timeline/:id/like` | 点赞只改本地 state |
| `toggleFeatured()` | PATCH `/api/v1/timeline/:id/featured` | 精选切换只改本地 state |
| `addComment()` | POST `/api/v1/timeline/:id/comments` | 评论只改本地 state |
| `deleteComment()` | DELETE `/api/v1/timeline/:id/comments/:commentId` | 删除评论只改本地 state |

#### albums.ts（4 个未用）
| 函数 | 路径 | 说明 |
|------|------|------|
| `getAlbums()` | GET `/api/v1/albums` | 伪事件相册用的是本地 demo 数据 |
| `createAlbum()` | POST `/api/v1/albums` | 创建相册只在本地 |
| `addPhotos()` | POST `/api/v1/albums/:id/photos` | 添加到相册只在本地 |
| `removePhotos()` | DELETE `/api/v1/albums/:id/photos` | 从相册移除只在本地 |

#### 完全未被引用的模块（3 个模块，9 个函数）

| 模块 | 导入状态 | 函数 |
|------|---------|------|
| `api/family.ts` | ❌ 无任何 import | getFamilies, createFamily, createInvite |
| `api/works.ts` | ❌ 无任何 import | getWorks, createWork, deleteWork |
| `api/milestones.ts` | ❌ 无任何 import | getMilestones, createMilestone |
| `api/health.ts` | ❌ 无任何 import | getHealthRecords, createHealthRecord, deleteHealthRecord |
| `api/capsules.ts` | ❌ 无任何 import | getCapsules, createCapsule, openCapsule |

---

## 三、核心问题：前后端数据断层

```
┌─────────────────────────────────────────────────────────────┐
│  前端 arch                                                    │
│  ┌──────────┐   import(仅2个模块)   ┌──────────────────┐    │
│  │  Pages   │ ◄────────────────── │   useStore.ts     │    │
│  │          │   所有增删改经store   │                   │    │
│  │ LoginPage│──(直接调login)──────►│ import timelineApi │    │
│  │ App.tsx  │──(直接调getProfile)─►│ import babyApi     │    │
│  └──────────┘                     │                   │    │
│                                   │ fetchBabies() ✅   │    │
│                                   │ fetchTimeline() ✅ │    │
│                                   │ toggleLike()   ❌   │    │
│                                   │ addComment()   ❌   │    │
│                                   │ addMilestone() ❌   │    │
│                                   │ openCapsule()  ❌   │    │
│                                   │ ...全部只改内存     │    │
│                                   └──────────────────┘    │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Demo Data (initialState)                        │    │
│  │  → demoUser, demoBabies, demoTimeline,          │    │
│  │    demoAlbums, demoCreativeWorks,               │    │
│  │    demoHealthRecords, demoMilestones,           │    │
│  │    demoCapsules, demoInvites                    │    │
│  │                                                  │    │
│  │  问题：用户看到的是 demo 数据还是后端数据？      │    │
│  │       无法区分！                                 │    │
│  └──────────────────────────────────────────────────┘    │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │  src/api/*.ts — 9个文件29个函数                    │    │
│  │  已完整定义了所有后端API调用                      │    │
│  │  但其中仅 4 个被实际使用                          │    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP (只读了 timeline + babies)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend (Go/Gin)                                           │
│  共 34 个路由全部已实现且正常工作                            │
│  但只有 4 个被前端真正调用                                   │
└─────────────────────────────────────────────────────────────┘
```

### 具体症状

1. **用户登录后**：`fetchInitialData()` 拉取 `babies` + `timeline`，成功则覆盖 demo 数据；失败则静默保留全部 demo 数据 — **用户无法判断看到的是真实数据还是假数据**。

2. **所有交互操作不回写后端**：点赞、评论、精选、删除动态、创建里程碑、开启胶囊等，全部只操作 zustand 内存状态。**刷新页面后所有操作丢失**。

3. **ProfilePage 编辑宝宝信息**：只更新本地 store，没有调用 `babyApi.updateBaby()`。

4. **注册功能**：`api/auth.ts` 中 `register()` 已实现，但前端没有注册入口页面。

5. **3 个 API 模块完全死代码**：`family.ts`、`works.ts`、`milestones.ts`、`health.ts`、`capsules.ts` 从未被任何文件 import。

---

## 四、接口覆盖率统计

| 类别 | 后端已实现 | 前端已定义 | 前端实际调用 | 前端覆盖率 |
|------|:---------:|:---------:|:---------:|:--------:|
| Auth | 3 | 3 | 2 | 66% |
| Babies CRUD | 5 | 5 | 1 | 20% |
| Timeline | 8 | 8 | 1 | 12.5% |
| Health | 3 | 3 | 0 | 0% |
| Albums | 6 | 4 | 0 | 0% |
| Family | 3 | 3 | 0 | 0% |
| Capsules | 3 | 3 | 0 | 0% |
| Milestones | 2 | 2 | 0 | 0% |
| Creative Works | 3 | 3 | 0 | 0% |
| **合计** | **36** | **34** | **4** | **11.8%** |

> 注：后端有 `GET /albums/:id/photos` 和 `DELETE /albums/:id` 前端未定义对应函数；前端有 `removePhotos` 后端也已实现。

---

## 五、建议修复方案

### 优先级 P0 — 读操作补齐
1. `fetchInitialData()` 补充拉取 healthRecords、milestones、capsules、creativeWorks、albums、familySpaces 等初始数据
2. 增加 loading/error/empty 状态区分，让用户明确知道当前是 demo 数据还是真实数据

### 优先级 P1 — 写操作回写后端
3. `store` 中的增删改操作全部改为先调后端 API，成功后更新本地 state（乐观更新或确认更新）
4. 需要改造的操作：`toggleLike`、`addComment`、`deleteTimelineEntry`、`toggleFeatured`、`addMilestone`、`openCapsule`、`addHealthRecord`、`deleteHealthRecord`、`addCreativeWork`、`deleteCreativeWork`、`updateBaby`、`createEventAlbum`、`createInvite`

### 优先级 P2 — 缺失功能
5. 添加注册页面入口
6. 添加发布动态（createEntry）功能入口（PublishModal 连线）
7. 移除或显式标记 demo 数据为"离线预览模式"

### 优先级 P3 — 清理
8. 清理未引用的 `api/` 模块 import，或明确标注为"待对接"
9. 考虑使用 React Query / SWR 做数据缓存和自动重新获取
