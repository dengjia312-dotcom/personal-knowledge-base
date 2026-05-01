# LumenKB Brain View V0 数据体检

## 调研范围

本轮只做 Brain View V0 开发前的数据、接口、路由和命名体检。未修改 `src/`、`server.ts`、`db/`、`package.json`、`vite.config.ts`、`vercel.json`，也未新增 3D 页面或安装依赖。

## 核心结论

- 当前前端文档列表来自 `src/context/AppContext.tsx` 的 `AppProvider`，页面通过 `useAppContext()` 读取 `documents`。
- 文档主数据接口是 `GET /api/documents`，后端由 `server.ts` 转发到 `db/documents.ts` 的 `getAllDocuments()`。
- `title`、`category`、`tags`、`summary`、`createdAt`、`lastReviewAt`、`reviewStatus` 均已有数据来源。
- `insight` 不是文档对象字段，而是独立的 `insights` 表和 `/api/insights/:docId` 接口，前端在文档详情页单独读取并保存。
- 当前文档详情页路由是 `/page1?id=<docId>`，阅读模式是 `/page1?id=<docId>&read=1`。
- 当前导航在 `src/components/Layout.tsx`，路由表在 `src/App.tsx`。
- 当前没有集中式 API client；`API_BASE` 和 `fetch` 分散在 `AppContext.tsx`、`Page1.tsx`、`Page3.tsx`。
- 若新增 `/brain` 页面，V1 最小改动可只涉及新增页面、注册路由、添加导航入口，不需要改后端和数据库。

## 数据来源

### 前端数据入口

`src/context/AppContext.tsx`：

- 定义 `Document` TypeScript interface。
- 定义 `documents` 状态。
- 在 `useEffect` 中请求 `${API_BASE}/api/documents`。
- 请求失败时回退到本地 `defaultDocs`。
- 暴露 `documents`、`addDocument`、`updateDocument`、`searchQuery`、`setSearchQuery` 给所有页面。

关键位置：

- `API_BASE`：`src/context/AppContext.tsx:3`
- `Document` interface：`src/context/AppContext.tsx:5`
- `documents` state：`src/context/AppContext.tsx:106`
- 拉取文档列表：`src/context/AppContext.tsx:112`
- 新增文档：`src/context/AppContext.tsx:123`
- 更新文档：`src/context/AppContext.tsx:137`

### 后端接口链路

`server.ts`：

- `GET /api/documents` 返回所有文档。
- `POST /api/documents` 新增文档。
- `PUT /api/documents/:id` 更新文档。
- `GET /api/insights/:docId` 获取某篇文档的个人感悟。
- `PUT /api/insights/:docId` 保存某篇文档的个人感悟。
- `POST /api/summarize` 生成 AI 摘要。

`db/documents.ts`：

- `getAllDocuments()` 执行 `SELECT * FROM documents ORDER BY "createdAt" DESC`。
- `createDocument()` 写入文档字段。
- `updateDocument()` 更新文档字段。
- `syncSystemDocs()` 同步系统内置文档。

`db/insights.ts`：

- `getInsight(docId)` 按 `docId` 读取 `insights.content`。
- `upsertInsight(docId, content)` 写入或更新感悟。

### 数据库结构

`db/database.ts` 中有三张主要表：

- `documents`：文档主表。
- `profile`：用户资料表。
- `insights`：个人感悟表，使用 `docId` 关联文档。

Brain View V0 只需要读取 `documents` 即可形成基础知识图谱；如果要把个人感悟也纳入节点详情，则需要额外请求 `/api/insights/:docId`，或后续新增聚合接口。

## 文档字段表

| 字段 | 前端 `Document` | DB/API | 当前是否可用 | Brain View V0 建议用途 |
| --- | --- | --- | --- | --- |
| `id` | `string` | `TEXT PRIMARY KEY` | 是 | 节点唯一 id，详情跳转参数 |
| `title` | `string` | `TEXT` | 是 | 节点标题、搜索关键词、详情面板标题 |
| `category` | `string` | `TEXT` | 是 | 节点颜色、分类聚类、分类边 |
| `content` | `string` | `TEXT` | 是 | 悬浮摘要、关键词提取候选，但 V0 不建议重解析全文 |
| `summary` | `string[]` | `JSONB` | 是 | 节点摘要、搜索文本、相似度启发式输入 |
| `tags` | `string[]` | `JSONB` | 是 | 建图核心字段：同标签文档连边 |
| `createdAt` | `string` | `TEXT` | 是 | 时间轴、节点大小或排序 |
| `reviewStatus` | `'learning' \| 'mastered'` | `TEXT` | 是 | 节点边框/状态颜色 |
| `lastReviewAt` | `string?` | `TEXT NULL` | 是 | 复习热度、近期活跃标识 |
| `lastReviewResult` | `'again' \| 'hard' \| 'good'?` | `TEXT NULL` | 是 | V1 可用于掌握程度可视化 |
| `imageUrl` | `string?` | `TEXT NULL` | 是 | 节点详情封面，V0 可选 |
| `isSystem` | 未声明 | `INTEGER` | API 可能返回 | 系统文档标记；前端类型未声明，V0 不建议依赖 |
| `systemVersion` | 未声明 | `TEXT NULL` | API 可能返回 | 系统文档版本；V0 不需要 |
| `systemKey` | 未声明 | `TEXT NULL` | API 可能返回 | 系统文档 key；V0 不需要 |
| `insight` | 未声明 | 独立 `insights.content` | 间接可用 | 不是文档字段；V0 可先不接入 |

### 指定字段确认

| 字段 | 结论 |
| --- | --- |
| `title` | 有，前端、后端、数据库均存在 |
| `category` | 有，前端、后端、数据库均存在 |
| `tags` | 有，前端为 `string[]`，数据库为 `JSONB` |
| `summary` | 有，前端为 `string[]`，数据库为 `JSONB` |
| `insight` | 文档对象没有；在独立 `insights` 表中，通过 `docId` 读取 |
| `createdAt` | 有，当前为字符串日期 |
| `lastReviewAt` | 有，前端可选，数据库可空 |
| `reviewStatus` | 有，前端限定为 `learning` 或 `mastered` |

## 当前页面、路由与导航

### 路由表

当前路由定义在 `src/App.tsx`：

- `/` 默认跳转到 `/page3`
- `/page1`：文档详情/今日任务入口
- `/page2`：知识库列表
- `/page3`：新建文档
- `/page4`：每日复习
- `/page5`：设置

文档详情使用 query 参数：

- 详情页：`/page1?id=<docId>`
- 阅读模式：`/page1?id=<docId>&read=1`

### 导航结构

当前导航定义在 `src/components/Layout.tsx`：

- 桌面端：左侧 `aside` 内的 `NavLink`。
- 移动端：底部 `nav` 内的 `NavLink`。
- 全局搜索框也在 `Layout.tsx`，搜索时会写入 `searchQuery` 并跳转 `/page2`。
- 内容区域通过 `<Outlet />` 渲染子路由页面。

如果新增 `/brain`，需要同时考虑桌面侧边栏和移动底部导航是否都加入入口。

## 当前 API 请求封装

当前没有统一的 API 请求封装文件，也没有 `apiClient`、`services` 或 `lib/api`。

现状是：

- `src/context/AppContext.tsx` 内定义 `API_BASE`，并直接 `fetch` 文档和用户资料接口。
- `src/pages/Page1.tsx` 内定义 `API_BASE`，并直接 `fetch` 感悟与 AI 摘要接口。
- `src/pages/Page3.tsx` 内定义 `API_BASE`，并直接 `fetch` AI 摘要接口。

对 Brain View V0 的影响：

- 如果只读 `documents`，直接复用 `useAppContext()` 即可，不需要新增 API。
- 如果要读取所有 insight，目前没有批量接口；逐篇请求会产生 N+1 请求风险。
- 若后续要做完整图谱数据接口，建议新增聚合 API，但 V0 不建议动后端。

## 已有分类、标签、复习状态逻辑

### 分类逻辑

`src/pages/Page2.tsx`：

- 从 `documents.map(doc => doc.category)` 推导分类列表。
- 使用 `selectedFolder` 做分类筛选。

`src/pages/Page3.tsx`：

- 从已有文档推导 `categoryOptions`，作为新建文档的分类输入建议。

Brain View 可复用思路：

- 按 `category` 给节点分组、定色、初始化空间位置。
- 建立同分类的弱连接边。

### 标签逻辑

`src/pages/Page3.tsx`：

- 新建文档时通过逗号分隔输入标签。
- 保存时 `tags.split(',').map(...).filter(Boolean)`。

当前列表页未使用 tags 做筛选，但数据字段已经存在。

Brain View 可复用思路：

- 标签是 V0 最适合用来建边的字段。
- 两篇文档共享标签时建立关系边。
- 共享标签越多，边权重越高。

### 复习状态逻辑

`src/pages/Page2.tsx`：

- `filterStatus` 支持 `all`、`learning`、`mastered`。
- 用 `doc.reviewStatus` 过滤文档。

`src/pages/Page4.tsx`：

- 用 `reviewStatus !== 'mastered'` 生成待复习队列。
- 用 `lastReviewAt` 判断今天是否已复习。
- 复习结果会更新 `reviewStatus`、`lastReviewAt`、`lastReviewResult`。

Brain View 可复用思路：

- `reviewStatus` 显示掌握状态。
- `lastReviewAt` 显示节点活跃度。
- `lastReviewResult` 显示最近复习难度。

## 可复用的现有组件/函数

### 可直接复用

- `useAppContext()`：读取 `documents`、`searchQuery`，必要时使用 `updateDocument`。
- `Document` 类型：Brain View 页面可直接 import。
- `Layout` 的路由框架：新增页面后会自然渲染在主内容区。
- 详情页跳转模式：使用 `navigate(`/page1?id=${doc.id}`)`。

### 可复用思路，但当前不是导出函数

- `Page2` 的分类列表推导：`Array.from(new Set(documents.map(doc => doc.category)))`。
- `Page2` 的搜索、分类、状态过滤逻辑。
- `Page4` 的 `isToday()` 与 `formatTimeAgo()`。
- `Page1` 的 `relatedDocs` 概念，但当前只是取前两个非当前文档，不是真实关联推荐。

### 建议新增为本地纯函数

Brain View V1 可在新页面或独立工具文件中新增：

- `buildBrainGraph(documents)`：把文档转换为 `{ nodes, links }`。
- `getDocTags(doc)`：安全读取 tags。
- `getCategoryColor(category)`：分类到颜色映射。
- `getReviewState(doc)`：复习状态显示模型。

## 需要新增的文件

V1 最小实现建议：

- `src/pages/BrainView.tsx`：Brain View 页面主体。

可选但推荐：

- `src/utils/brainGraph.ts`：图谱数据构建逻辑，便于测试和后续迭代。

如果暂时只做单页面 V1，也可以先不新增 utils，把建图逻辑放在 `BrainView.tsx` 内，后续稳定后再抽离。

## 需要修改的文件

新增 `/brain` 页面最少需要修改：

- `src/App.tsx`：import 新页面，并新增 `<Route path="brain" element={<BrainView />} />`。
- `src/components/Layout.tsx`：在桌面侧边栏和移动底部导航中加入 Brain View 入口；如果使用新图标，需要补充 lucide icon import。

如果选择抽离图谱工具：

- `src/pages/BrainView.tsx`：调用 `buildBrainGraph`。
- `src/utils/brainGraph.ts`：新增工具文件。

V1 不需要修改：

- `server.ts`
- `db/`
- `package.json`
- `vite.config.ts`
- `vercel.json`

## V1 实施风险

1. `insight` 不是文档字段  
   如果 V1 强依赖个人感悟，需要逐篇调用 `/api/insights/:docId`，会出现 N+1 请求。建议 V1 先不展示 insight，或只在打开某个节点详情时懒加载。

2. 当前没有真实文档关系字段  
   数据库没有 links、relatedDocIds、backlinks 等显式关系。V1 只能基于 `tags`、`category`、`summary` 做启发式建图。

3. `tags` 可能为空  
   新建文档允许没有标签。无标签文档需要 fallback 到 category 聚类，否则会成为孤立节点。

4. `createdAt`、`lastReviewAt` 是字符串  
   需要容错无效日期。当前已有页面使用 `new Date(...).getTime()`，Brain View 也要处理 `NaN`。

5. 前端类型与后端返回字段不完全一致  
   后端 `SELECT *` 可能返回 `isSystem`、`systemVersion`、`systemKey`，但前端 `Document` 未声明这些字段。V1 不应依赖这些未声明字段，除非先补类型。

6. 3D 技术依赖未确认  
   当前 `package.json` 没有 Three.js、React Three Fiber 或 3D force graph 依赖。本轮不安装依赖。V1 如必须是真 3D，需要后续明确是否允许新增依赖；若不允许，只能做 CSS 3D / Canvas 伪 3D 或轻量交互图。

7. 移动端可用性  
   3D 图谱在移动端容易出现拖拽、缩放、文字遮挡和性能问题。V1 需要提供列表/筛选侧栏或降级视图。

8. 导航空间  
   当前桌面导航已有工作台、知识库、新建、复习、设置；移动底部已有 5 个入口。新增 Brain View 后移动端底部导航可能拥挤，需要决定是否替换某个入口、放入设置/更多，或仅桌面显示。

## 推荐的 V1 开发方案

### 目标

先做一个实用型 Brain View，不追求复杂知识推理，重点让用户能看清：

- 有多少知识文档。
- 哪些文档同分类。
- 哪些文档共享标签。
- 哪些文档仍在学习中，哪些已掌握。
- 点击节点能跳到现有文档详情页。

### 数据策略

直接复用 `useAppContext().documents`，不新增 API。

节点：

- 每篇文档一个 document node。
- 每个 category 可作为虚拟 category node。
- 每个 tag 可作为虚拟 tag node。

边：

- 文档到分类：`doc -> category`。
- 文档到标签：`doc -> tag`。
- 可选：共享标签的文档之间增加弱边。

节点视觉编码：

- 分类决定颜色。
- `reviewStatus === 'mastered'` 显示为已掌握样式。
- `reviewStatus === 'learning'` 显示为学习中样式。
- `summary.length` 或 `content.length` 可影响节点大小，但 V1 建议克制。

### 页面交互

V1 推荐交互：

- 左侧或顶部筛选：全部、学习中、已掌握、分类。
- 中央图谱：节点拖拽/旋转/缩放。
- 右侧详情面板：标题、分类、标签、摘要、复习状态、创建时间。
- 点击详情按钮跳转 `/page1?id=<docId>`。

### 技术建议

分两档：

1. 无新增依赖版本  
   使用 SVG/Canvas + CSS 3D transform 做轻量图谱。优点是符合当前依赖限制；缺点是 3D 真实感和物理布局有限。

2. 允许新增依赖版本  
   使用 Three.js 或 React Three Fiber 构建真实 3D 场景。优点是体验更接近「3D Brain View」；缺点是需要新增依赖、处理性能和构建体积。

在当前项目状态下，建议 V1 先做「无新增后端、无数据库变更」的前端页面：

- 新增 `src/pages/BrainView.tsx`。
- 在页面内部通过 `useMemo` 构建 graph。
- 只使用现有字段 `id`、`title`、`category`、`tags`、`summary`、`createdAt`、`lastReviewAt`、`reviewStatus`。
- 点击节点跳现有详情页。
- 暂不接入 `insight`，避免 N+1 请求。

## 最小文件改动清单

如果正式开发 `/brain`：

必须新增：

- `src/pages/BrainView.tsx`

必须修改：

- `src/App.tsx`
- `src/components/Layout.tsx`

可选新增：

- `src/utils/brainGraph.ts`

暂不需要修改：

- `server.ts`
- `db/`
- `package.json`
- `vite.config.ts`
- `vercel.json`

