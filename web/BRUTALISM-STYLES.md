# Neo-Brutalism Style Guide

本项目使用了克制的 Neo-Brutalism（新粗野主义）设计风格。所有样式已提取到 `src/styles/globals.css` 中作为可复用的 CSS 类。

## 核心特征

- **粗黑边框**: 所有元素使用 2px 黑色边框
- **硬阴影**: 无模糊的偏移阴影，如实体色块
- **零圆角**: 保持方正造型
- **克制配色**: 以白色为主，选择性使用柔和的强调色

## 可用的 CSS 类

### 边框样式

```css
.brutalism-border          /* 2px 黑色边框 */
.brutalism-border-thick    /* 4px 黑色边框（用于强调） */
```

### 阴影样式

```css
.brutalism-shadow-sm       /* 2x2 硬阴影 */
.brutalism-shadow          /* 3x3 硬阴影（默认） */
.brutalism-shadow-md       /* 4x4 硬阴影 */
.brutalism-shadow-lg       /* 5x5 硬阴影 */
.brutalism-shadow-xl       /* 8x8 硬阴影（用于对话框等） */
```

### 交互效果

```css
.brutalism-hover           /* 悬停时基础变换效果 */
.brutalism-hover-sm        /* 悬停时阴影变为 3x3 */
.brutalism-hover           /* 悬停时阴影变为 4x4 */
.brutalism-hover-md        /* 悬停时阴影变为 5x5 */
.brutalism-hover-lg        /* 悬停时阴影变为 6x6 */
.brutalism-active          /* 点击时移除阴影（按下效果） */
```

### 组合组件样式

#### 卡片

```css
.brutalism-card            /* 白色背景 + 边框 + 阴影 + 悬停效果 */
```

**使用示例**:

```tsx
<div className="brutalism-card p-4">{/* 卡片内容 */}</div>
```

#### 按钮

```css
.brutalism-button          /* 基础按钮样式 */
.brutalism-button-primary  /* 翠绿色按钮（主操作） */
.brutalism-button-secondary /* 天蓝色按钮（次要操作） */
.brutalism-button-neutral  /* 白色按钮（中性操作） */
.brutalism-button-inverse  /* 黑底白字，悬停反转 */
```

**使用示例**:

```tsx
<button className="brutalism-button-primary px-4 py-2">
  Submit
</button>

<button className="brutalism-button-inverse w-full px-4 py-2">
  Cancel
</button>
```

#### 输入框

```css
.brutalism-input           /* 输入框样式，聚焦时阴影加深 */
```

**使用示例**:

```tsx
<input type="text" className="brutalism-input w-full px-3 py-2" placeholder="Enter text..." />
```

#### 标签/筛选

```css
.brutalism-tag             /* 基础标签样式 */
.brutalism-tag-active      /* 选中状态（翠绿色背景） */
```

**使用示例**:

```tsx
<button className={isActive ? "brutalism-tag-active" : "brutalism-tag"}>Tag Name</button>
```

#### 面板/容器

```css
.brutalism-panel           /* 白色面板，带边框和阴影 */
.brutalism-banner          /* 琥珀色横幅 */
.brutalism-banner-accent   /* 黄色强调横幅（粗边框大阴影） */
```

**使用示例**:

```tsx
<div className="brutalism-panel p-4">
  <h3 className="brutalism-heading mb-3">Panel Title</h3>
  {/* 面板内容 */}
</div>

<div className="brutalism-banner p-5 mb-6">
  <h1>Page Title</h1>
</div>
```

### 文字样式

```css
.brutalism-title           /* XL 号标题（加粗大写） */
.brutalism-heading         /* L 号标题（加粗） */
.brutalism-text-bold       /* 加粗文本 */
```

**使用示例**:

```tsx
<h1 className="brutalism-title">Main Title</h1>
<h2 className="brutalism-heading">Section Heading</h2>
<p className="brutalism-text-bold">Important text</p>
```

## 设计原则

### 1. 保持简洁

不要过度使用粗边框和大阴影，仅在需要层次感的地方使用。

### 2. 统一配色

- **主色**: 白色背景
- **强调色**:
  - 翠绿色 (`emerald-300/400`) - 主要操作
  - 天蓝色 (`sky-300`) - 次要操作
  - 琥珀色 (`amber-100`) - 信息横幅
  - 黄色 (`yellow-300`) - 重要横幅

### 3. 合理的交互反馈

- 悬停时：元素向左上移动 1px，阴影变大
- 点击时：阴影消失，模拟按下效果
- 禁用时：降低不透明度至 40%

## 实际应用示例

### 食谱卡片

```tsx
<div className="brutalism-card overflow-hidden">
  <Link href={`/recipes/${id}`} className="p-4">
    <div className="brutalism-border aspect-video overflow-hidden">
      <Image src={imageUrl} alt={name} fill />
    </div>
    <h3 className="brutalism-text-bold mt-3">{name}</h3>
  </Link>
  <div className="brutalism-border border-x-0 border-b-0 p-4">
    <button className="brutalism-button-inverse w-full px-4 py-2">Add to Calendar</button>
  </div>
</div>
```

### 搜索栏

```tsx
<div className="flex gap-3">
  <input className="brutalism-input flex-1 px-3 py-2" placeholder="Search..." />
  <button className="brutalism-button-primary px-5 py-2">Search</button>
</div>
```

### 筛选面板

```tsx
<div className="brutalism-panel p-4">
  <h3 className="brutalism-heading mb-3">Filters</h3>
  <div className="flex flex-wrap gap-2">
    {items.map((item) => (
      <button key={item.id} className={isActive(item) ? "brutalism-tag-active" : "brutalism-tag"}>
        {item.name}
      </button>
    ))}
  </div>
</div>
```

## 注意事项

1. **组合使用**: 这些类可以与 Tailwind 的工具类组合使用（如 `p-4`, `mb-3` 等）
2. **优先级**: 如果需要覆盖样式，可以在后面添加更具体的类
3. **一致性**: 尽量使用预定义的类而不是自定义内联样式
4. **可维护性**: 修改设计系统时，只需更新 `globals.css` 中的定义

## 更新日志

- **2025-01-21**: 初始版本，定义了完整的 Neo-Brutalism 设计系统
