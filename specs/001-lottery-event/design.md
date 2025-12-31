# Design Specification: 尾牙抽獎活動系統

**Date**: 2025-12-31
**Feature**: 001-lottery-event

## Overview

本文件定義前台與後台的 UI/UX 設計規範，確保視覺風格一致性。

---

## Frontend (前台公開顯示)

### Design System: Shadcn-ui + Neo-Brutalism

前台採用 **Shadcn-ui** 元件庫，搭配 **Neo-Brutalism** 視覺風格，創造大膽、現代且易於投影顯示的介面。

### Core Characteristics

| 特性 | 說明 |
|------|------|
| **Bold Borders** | 粗黑邊框 (2-4px solid black) |
| **Hard Shadows** | 硬陰影無模糊 (4-8px offset, solid black) |
| **Vibrant Colors** | 鮮豔高對比色彩 |
| **Flat Design** | 無漸層、無圓角或極小圓角 |
| **High Contrast** | 高對比度確保投影清晰 |

### Color Palette

```css
/* Primary Colors */
--primary: #FF6B6B;      /* 活力紅 - 主要動作 */
--secondary: #4ECDC4;    /* 青綠色 - 次要元素 */
--accent: #FFE66D;       /* 亮黃色 - 強調/中獎 */

/* Neutral Colors */
--background: #FFFFFF;   /* 純白背景 */
--foreground: #000000;   /* 純黑文字 */
--border: #000000;       /* 黑色邊框 */

/* State Colors */
--success: #7CFC00;      /* 成功狀態 */
--warning: #FFA500;      /* 警告狀態 */
--error: #FF4444;        /* 錯誤狀態 */
```

### Typography

```css
/* Headings - 投影顯示優化 */
--font-display: "Noto Sans TC", sans-serif;
--font-size-hero: 4rem;      /* 72px - 中獎者名稱 */
--font-size-h1: 3rem;        /* 48px - 獎項名稱 */
--font-size-h2: 2rem;        /* 32px - 副標題 */
--font-size-body: 1.25rem;   /* 20px - 內文 */

/* Font Weight */
--font-weight-bold: 900;
--font-weight-medium: 700;
--font-weight-normal: 400;
```

### Component Styles

#### Button (Neo-Brutalism Style)

```css
.btn-neo {
  border: 3px solid #000;
  box-shadow: 4px 4px 0px #000;
  background: var(--primary);
  font-weight: 700;
  text-transform: uppercase;
  transition: transform 0.1s, box-shadow 0.1s;
}

.btn-neo:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0px #000;
}

.btn-neo:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px #000;
}
```

#### Card (Prize/Winner Display)

```css
.card-neo {
  border: 3px solid #000;
  box-shadow: 6px 6px 0px #000;
  background: #fff;
  padding: 2rem;
}

.card-winner {
  background: var(--accent);
  animation: winner-pulse 0.5s ease-in-out;
}
```

#### Input Fields

```css
.input-neo {
  border: 3px solid #000;
  background: #fff;
  padding: 1rem;
  font-size: 1.25rem;
}

.input-neo:focus {
  outline: none;
  box-shadow: 4px 4px 0px #000;
}
```

### Animation Guidelines

| 動畫 | 用途 | 時長 |
|------|------|------|
| `winner-reveal` | 中獎者揭曉 | 1.5s |
| `card-flip` | 獎項卡片翻轉 | 0.8s |
| `pulse` | 等待狀態強調 | 1s loop |
| `slide-in` | 新資訊進入 | 0.3s |

### Responsive Breakpoints

```css
/* 投影顯示優先 */
--breakpoint-projection: 1920px;  /* 投影機 */
--breakpoint-desktop: 1440px;     /* 桌面 */
--breakpoint-tablet: 768px;       /* 平板 */
--breakpoint-mobile: 375px;       /* 手機 */
```

### Shadcn-ui Integration

使用 Shadcn-ui 作為基礎元件，覆寫樣式實現 Neo-Brutalism：

```jsx
// tailwind.config.js 擴展
module.exports = {
  theme: {
    extend: {
      boxShadow: {
        'neo': '4px 4px 0px 0px #000',
        'neo-lg': '6px 6px 0px 0px #000',
        'neo-xl': '8px 8px 0px 0px #000',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
}
```

```jsx
// Shadcn Button 覆寫範例
<Button
  className="border-3 border-black shadow-neo hover:shadow-neo-lg
             hover:-translate-x-0.5 hover:-translate-y-0.5
             active:translate-x-0.5 active:translate-y-0.5
             active:shadow-none font-bold uppercase"
>
  開始抽獎
</Button>
```

---

## Backend (後台管理介面)

### Design System: Material UI (MUI)

後台採用 **Material UI** 設計系統，提供專業、熟悉的管理介面體驗。

### Core Characteristics

| 特性 | 說明 |
|------|------|
| **Material Design 3** | 遵循 Google Material Design 規範 |
| **Consistent** | 統一的元件風格 |
| **Professional** | 清晰的資訊層次 |
| **Accessible** | 符合 WCAG 2.1 標準 |

### Color Palette (MUI Theme)

```javascript
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976D2',      // MUI Blue
      light: '#42A5F5',
      dark: '#1565C0',
    },
    secondary: {
      main: '#9C27B0',      // MUI Purple
      light: '#BA68C8',
      dark: '#7B1FA2',
    },
    error: {
      main: '#D32F2F',
    },
    warning: {
      main: '#ED6C02',
    },
    success: {
      main: '#2E7D32',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
  },
});
```

### Typography (MUI)

```javascript
typography: {
  fontFamily: '"Noto Sans TC", "Roboto", sans-serif',
  h1: { fontSize: '2.5rem', fontWeight: 500 },
  h2: { fontSize: '2rem', fontWeight: 500 },
  h3: { fontSize: '1.75rem', fontWeight: 500 },
  body1: { fontSize: '1rem' },
  body2: { fontSize: '0.875rem' },
}
```

### Component Usage

#### Data Tables

- 使用 MUI DataGrid 顯示列表資料
- 支援排序、篩選、分頁
- 行內編輯功能

#### Forms

- 使用 MUI TextField、Select、Checkbox
- 即時驗證回饋
- 清晰的錯誤訊息

#### Navigation

- 側邊欄 Drawer 導航
- Breadcrumbs 麵包屑
- Tabs 分頁切換

#### Feedback

- Snackbar 操作回饋
- Dialog 確認對話框
- Progress 載入指示器

### Layout Structure

```
┌─────────────────────────────────────────────────┐
│  AppBar (Logo, User Menu)                       │
├──────────┬──────────────────────────────────────┤
│          │  Breadcrumbs                         │
│  Drawer  ├──────────────────────────────────────┤
│  Nav     │                                      │
│          │  Main Content Area                   │
│  - 活動  │                                      │
│  - 獎項  │  (DataGrid / Forms / Cards)          │
│  - 參與者│                                      │
│  - 中獎  │                                      │
│          │                                      │
└──────────┴──────────────────────────────────────┘
```

---

## Shared Guidelines

### Accessibility

- 所有互動元素需有 focus 狀態
- 色彩對比度 WCAG AA 以上
- 支援鍵盤導航
- 提供 ARIA labels

### Loading States

- 前台：Neo-Brutalism 風格的 skeleton
- 後台：MUI CircularProgress / Skeleton

### Error Handling

- 清楚的錯誤訊息
- 提供解決建議
- 不顯示技術細節給使用者

### Internationalization

- 目前僅支援繁體中文
- 預留 i18n 擴展空間

---

## File Structure

```
app/frontend/
├── styles/
│   ├── neo-brutalism.css    # 前台自定義樣式
│   └── admin-theme.js       # 後台 MUI 主題
├── components/
│   ├── public/              # 前台 (Shadcn + Neo-Brutalism)
│   │   └── ui/              # Shadcn 覆寫元件
│   └── admin/               # 後台 (MUI)
└── lib/
    └── shadcn/              # Shadcn-ui 設定
```

---

## Dependencies

### Frontend (Public)

```json
{
  "dependencies": {
    "@radix-ui/react-*": "latest",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  }
}
```

### Backend (Admin)

```json
{
  "dependencies": {
    "@mui/material": "^5.15.0",
    "@mui/icons-material": "^5.15.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "@mui/x-data-grid": "^7.0.0"
  }
}
```
