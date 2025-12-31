# Implementation Plan: 尾牙抽獎活動系統

**Branch**: `001-lottery-event` | **Date**: 2025-12-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-lottery-event/spec.md`

## Summary

建立一個完整的抽獎活動系統，支援前後台分離架構。後台提供活動管理、獎項設定、開獎控制及發放追蹤；前台提供即時開獎顯示與參與者個人查詢。系統採用 Rails 8 API + React 19 SPA 架構，透過 ActionCable 實現即時同步。

## Technical Context

**Language/Version**: Ruby 3.4.1 / Rails 8.0.2.1 (Backend), TypeScript / React 19.x (Frontend)
**Primary Dependencies**: Rails (API mode), React 19, Vite 5, Tailwind CSS 3, ActionCable (WebSocket)
**Storage**: SQLite 3
**Testing**: RSpec (Backend), Jest + React Testing Library (Frontend)
**Target Platform**: Web (Desktop/Mobile browsers, optimized for projection display)
**Project Type**: Web application (Rails monolith with Vite-powered React frontend)
**Performance Goals**: 2 秒內即時同步、500 位同時觀看
**Constraints**: 前台需支援大螢幕投影顯示、保密資訊遮罩處理
**Scale/Scope**: 500 位參與者/活動、10+ 獎項/活動

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. 簡單優先 ✅

| 檢查項目 | 狀態 | 說明 |
|---------|------|------|
| YAGNI 強制執行 | ✅ | 通知功能第一階段僅保留介面，不實際整合 |
| 最小依賴 | ✅ | 使用 Rails 內建 ActionCable，無需額外 WebSocket 套件 |
| 避免過早優化 | ✅ | 先實作核心功能，效能優化依據實際瓶頸 |
| 直接解決方案 | ✅ | Rails MVC + React SPA，無過度抽象 |

### II. 測試驅動開發 ✅

| 檢查項目 | 狀態 | 說明 |
|---------|------|------|
| 先寫測試 | ✅ | 規劃 RSpec Model/Request specs + React component tests |
| 覆蓋率要求 | ✅ | 關鍵路徑：開獎邏輯、保密遮罩、即時同步 |
| 測試隔離 | ✅ | 使用 FactoryBot + database_cleaner |

### III. 程式碼品質 ✅

| 檢查項目 | 狀態 | 說明 |
|---------|------|------|
| Rails 慣例 | ✅ | Service Object 處理開獎邏輯、Model 處理驗證 |
| React 模式 | ✅ | 函數式元件 + Hooks、Context for state |
| 一致的風格 | ✅ | RuboCop + ESLint 配置 |

## Project Structure

### Documentation (this feature)

```text
specs/001-lottery-event/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API specs)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── models/                    # Rails models
│   ├── event.rb              # 活動
│   ├── prize.rb              # 獎項
│   ├── participant.rb        # 參與者
│   ├── winner.rb             # 中獎記錄
│   └── admin.rb              # 管理者
├── controllers/
│   ├── api/
│   │   └── v1/               # API endpoints
│   │       ├── events_controller.rb
│   │       ├── prizes_controller.rb
│   │       ├── participants_controller.rb
│   │       ├── draws_controller.rb
│   │       └── sessions_controller.rb
│   └── admin/                # Admin backend (if using server-rendered)
├── services/                  # Business logic
│   ├── draw_service.rb       # 開獎邏輯
│   ├── privacy_mask_service.rb  # 保密遮罩
│   └── participant_import_service.rb  # 匯入邏輯
├── channels/
│   └── draw_channel.rb       # ActionCable for real-time
├── frontend/                  # React frontend (Vite)
│   ├── entrypoints/
│   │   ├── application.jsx   # Main entry
│   │   └── admin.jsx         # Admin entry (if separate)
│   └── components/
│       ├── public/           # 前台元件
│       │   ├── DrawDisplay.jsx
│       │   ├── WinnerList.jsx
│       │   └── ParticipantLogin.jsx
│       └── admin/            # 後台元件
│           ├── EventForm.jsx
│           ├── PrizeManager.jsx
│           ├── DrawControl.jsx
│           └── WinnerManagement.jsx
└── views/
    └── layouts/

spec/                          # RSpec tests
├── models/
├── requests/
├── services/
└── channels/

db/
├── migrate/
└── seeds.rb
```

**Structure Decision**: 採用 Rails monolith + Vite React frontend 架構，符合現有專案結構 (`app/frontend/`)。前後台共用同一 Rails 應用，透過 API namespace 區分權限。

## Complexity Tracking

> 無憲章違規需要記錄
