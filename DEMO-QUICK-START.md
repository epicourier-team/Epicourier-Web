# Epicourier Demo - 快速开始指南

> 课程演示版本 - 包含所有核心功能

## 🚀 一键启动

### 前置条件
- Docker 已启动（Supabase 本地环境）
- Node.js 20+, Python 3.9+

### 步骤 1: 启动本地 Supabase（终端 1）
```bash
cd /home/zhendong/Epicourier-Web
sudo npx supabase start
```

输出示例：
```
✓ Studio        │ http://127.0.0.1:54323
✓ Project URL   │ http://127.0.0.1:54321
✓ Publishable   │ sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
```

### 步骤 2: 启动后端 API（终端 2）
```bash
cd /home/zhendong/Epicourier-Web/backend
export PATH="$HOME/.local/bin:$PATH"
uv run uvicorn api.index:app --reload --host 0.0.0.0 --port 8000
```

后端运行在: **http://localhost:8000**
API 文档: **http://localhost:8000/docs**

### 步骤 3: 启动前端（终端 3）
```bash
cd /home/zhendong/Epicourier-Web/web
npm run dev
```

前端运行在: **http://localhost:3000**

---

## 📋 Demo 功能清单

### ✅ 已实现功能

#### 1. **用户认证系统** 
- 注册新账户
- 登录/登出
- 会话管理

**演示位置**:
- 主页: `http://localhost:3000`
- 注册: `http://localhost:3000/signup`
- 登录: `http://localhost:3000/signin`

#### 2. **食谱浏览和搜索**
- 查看所有食谱列表
- 按关键词搜索食谱
- 按食材过滤
- 按标签过滤
- 查看食谱详细信息
- 绿色评分 (sustainability score)

**演示位置**: `http://localhost:3000/dashboard/recipes`

**演示步骤**:
1. 登录账户
2. 进入食谱页面
3. 搜索 "pasta" 或 "chicken"
4. 点击食谱查看详情

#### 3. **周期meal计划**
- 在日历视图中创建 meal plan
- 查看每日分配的食谱
- 编辑/删除 meal plan

**演示位置**: `http://localhost:3000/dashboard/calendar`

**演示步骤**:
1. 点击日历上的日期
2. 添加食谱到该日期
3. 查看周视图

#### 4. **营养追踪系统** ⭐ 新功能
- 查看每日营养摄取总结
- 按日/周/月查看营养数据
- 设置营养目标
- 导出营养数据 (CSV/PDF)

**演示位置**: `http://localhost:3000/dashboard/nutrients`

**演示步骤**:
1. 添加几个食谱到日历
2. 进入营养追踪页面
3. 查看营养饼图和柱状图
4. 修改日期范围查看历史数据
5. 导出数据

#### 5. **成就和挑战系统** ⭐ 新功能
- 查看已解锁的徽章/成就
- 查看可用的挑战
- 参与挑战并跟踪进度
- 条纹追踪 (streak tracking)

**演示位置**: 
- 成就: `http://localhost:3000/dashboard/achievements`
- 挑战: `http://localhost:3000/dashboard/challenges`
- 首页: `http://localhost:3000/dashboard`

**演示步骤**:
1. 进入首页查看条纹和最新成就
2. 进入成就页面查看所有徽章
3. 进入挑战页面参与挑战

#### 6. **购物清单管理** ⭐ 新功能
- 创建购物清单
- 添加/删除项目
- 标记已购买的项目
- 查看购物清单历史

**演示位置**: `http://localhost:3000/dashboard/shopping`

**演示步骤**:
1. 点击"新建购物清单"
2. 添加食材
3. 标记已购买的项目

---

## 🎬 推荐 Demo 流程（15-20分钟）

### 第一部分：认证和基础功能（3分钟）
1. 显示登录界面
2. 创建新账户或使用演示账户登录
3. 显示仪表板

### 第二部分：食谱浏览（4分钟）
1. 打开食谱页面
2. 演示搜索功能：搜索 "pasta"
3. 演示过滤：按标签筛选
4. 点击一个食谱显示详细信息（营养成分、绿色评分）

### 第三部分：meal计划（5分钟）
1. 打开日历
2. 添加食谱到多个日期
3. 演示周视图
4. 显示生成的meal plan

### 第四部分：营养追踪 ⭐（4分钟）
1. 打开营养追踪页面
2. 显示营养饼图（蛋白质、碳水、脂肪）
3. 演示日期范围选择
4. 显示导出功能

### 第五部分：成就和挑战 ⭐（3分钟）
1. 打开成就页面，展示已解锁的徽章
2. 打开挑战页面，演示参与流程
3. 返回首页显示条纹追踪

### 第六部分：购物清单 ⭐（2分钟）
1. 打开购物清单
2. 创建新清单
3. 添加项目并标记购买

---

## 🧪 API 测试（可选）

访问 **http://localhost:8000/docs** 使用 Swagger UI 测试 API：

### 关键端点
- `GET /api/recipes` - 获取食谱列表
- `GET /api/recipes/{id}` - 获取食谱详情
- `GET /api/nutrients/daily` - 获取每日营养
- `GET /api/achievements` - 获取成就
- `GET /api/challenges` - 获取挑战

---

## 🗄️ 数据库管理

访问 Supabase Studio 管理数据库：
**http://127.0.0.1:54323**

### 关键表
- `recipes` - 食谱数据
- `user_meals` - 用户meal计划
- `nutrient_tracking` - 营养追踪
- `user_achievements` - 用户成就
- `shopping_lists` - 购物清单

---

## ⚠️ 常见问题

### Q: 前端显示 "Invalid supabaseUrl"
A: 确保已启动 Supabase：`sudo npx supabase start`

### Q: 后端启动失败 "Gemini API"
A: AI 推荐功能可选。基础功能无需 Gemini key。

### Q: 营养数据为空
A: 需要先在日历中添加食谱。营养数据来自添加的食谱。

### Q: 购物清单页面显示错误
A: 确保已完成认证并加载了必要的数据。

---

## 🎯 Demo 核心价值点

✅ **全栈应用**：Next.js 前端 + FastAPI 后端 + Supabase 数据库
✅ **现代化 UI**：Tailwind CSS + Radix UI 组件库
✅ **高级功能**：营养追踪、成就系统、AI 推荐（后端就绪）
✅ **实时数据**：Supabase 实时更新
✅ **响应式设计**：Mobile-friendly 界面

---

## 📱 Demo 账户

使用任何邮箱注册新账户进行演示。每个账户的数据是隔离的。

---

## 🔗 项目链接

- **GitHub**: https://github.com/sdxshuai/Epicourier-Web
- **前端**: http://localhost:3000
- **后端 API**: http://localhost:8000
- **数据库**: http://127.0.0.1:54323

---

**最后更新**: 2025-12-05
**状态**: ✅ Demo Ready
