# Implementation Plan: 尾牙抽獎活動系統

**Branch**: `001-lottery-event` | **Date**: 2026-01-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-lottery-event/spec.md`

## Summary

建立完整的尾牙抽獎活動系統，包含：
- **後台管理**：活動建立、獎項管理、參與者匯入、開獎執行、發放追蹤
- **前台展示**：即時開獎顯示、中獎者資訊（含隱私遮罩）、個人中獎查詢
- **技術方案**：Rails API + React SPA，使用 ActionCable 實現即時同步

## Technical Context

**Language/Version**: Ruby 3.4.1 / Rails 8.0.2.1 (Backend), TypeScript / React 19.x (Frontend)
**Primary Dependencies**: Rails (API mode), React 19, Vite 5, Tailwind CSS 3, ActionCable (WebSocket)
**Storage**: PostgreSQL (production), SQLite (development/test)
**Testing**: RSpec + FactoryBot + Shoulda-matchers (Backend), Jest (Frontend)
**Target Platform**: Web application (modern browsers)
**Project Type**: Web application (Rails + React SPA)
**Performance Goals**:
- 開獎結果在 2 秒內同步至所有前台
- 支援 500 位同時連線觀眾
**Constraints**:
- 即時性要求（WebSocket）
- 隱私資料遮罩處理
- Session-based 認證（後台 2 小時 timeout）
**Scale/Scope**:
- 單場活動 500 參與者
- 每場活動最多 50 個獎項
- 預估同時 10 場活動

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 原則 I. 簡單優先 ✅

| 檢查項目 | 狀態 | 說明 |
|---------|------|------|
| YAGNI 強制執行 | ✅ | 第一階段不實作通知發送，僅保留介面 |
| 最小依賴 | ✅ | 使用 Rails 內建功能（ActionCable、Session） |
| 避免過早優化 | ✅ | 500 人規模無需特殊快取 |
| 清晰優於巧妙 | ✅ | 使用 Service Object 封裝業務邏輯 |
| 直接解決方案 | ✅ | 無過度抽象層 |

### 原則 II. 測試驅動開發 ✅

| 檢查項目 | 狀態 | 說明 |
|---------|------|------|
| 先寫測試 | ✅ | Model、Service、Request specs 已建立 |
| 紅-綠-重構 | ✅ | 遵循 TDD 流程 |
| 覆蓋率要求 | ✅ | 核心功能（抽獎、隱私遮罩）有完整測試 |
| 測試隔離 | ✅ | 使用 FactoryBot + DatabaseCleaner |
| 快速回饋 | ✅ | 104 個測試在 2 秒內完成 |

### 原則 III. 程式碼品質 ✅

| 檢查項目 | 狀態 | 說明 |
|---------|------|------|
| Rails 慣例 | ✅ | Service Objects、Strong Parameters |
| React 模式 | ✅ | 函數式元件、Hooks、Context |
| 一致的風格 | ✅ | RuboCop 規則（已停用部分過嚴規則） |
| 有意義的命名 | ✅ | 中英文對應清晰（Event, Prize, Participant, Winner） |
| DRY 原則 | ✅ | 共用元件（PrivacyMaskService） |

### 技術標準檢查 ✅

| 標準 | 狀態 | 說明 |
|------|------|------|
| Service Object | ✅ | DrawService, PrivacyMaskService, ParticipantImportService |
| ActiveRecord scope | ✅ | Event.active, Prize.undrawn |
| Strong Parameters | ✅ | 所有 Controller 使用 |
| 函數式元件 | ✅ | 無 Class 元件 |
| Tailwind 優先 | ✅ | 前台使用 Neo-Brutalism 風格 |
| 後台使用 MUI | ✅ | Material UI 元件庫 |

## Project Structure

### Documentation (this feature)

```text
specs/001-lottery-event/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
│   ├── admin-api.yaml   # Admin API OpenAPI spec
│   └── public-api.yaml  # Public API OpenAPI spec
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
app/
├── controllers/
│   └── api/v1/
│       ├── admin/           # Admin API controllers
│       │   ├── base_controller.rb
│       │   ├── sessions_controller.rb
│       │   ├── events_controller.rb
│       │   ├── prizes_controller.rb
│       │   ├── participants_controller.rb
│       │   ├── draws_controller.rb
│       │   └── winners_controller.rb
│       └── public/          # Public API controllers
│           ├── events_controller.rb
│           ├── sessions_controller.rb
│           └── winners_controller.rb
├── models/
│   ├── admin.rb
│   ├── event.rb
│   ├── prize.rb
│   ├── participant.rb
│   └── winner.rb
├── services/
│   ├── draw_service.rb
│   ├── privacy_mask_service.rb
│   └── participant_import_service.rb
├── channels/
│   └── draw_channel.rb
├── jobs/
│   └── scheduled_draw_job.rb
└── frontend/
    ├── entrypoints/
    │   ├── application.jsx
    │   └── admin.jsx
    ├── components/
    │   ├── admin/           # Admin SPA (MUI)
    │   │   ├── AdminApp.jsx
    │   │   ├── AuthContext.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── EventList.jsx
    │   │   ├── EventForm.jsx
    │   │   ├── PrizeManager.jsx
    │   │   ├── ParticipantList.jsx
    │   │   ├── ParticipantImport.jsx
    │   │   ├── DrawControl.jsx
    │   │   └── WinnerManagement.jsx
    │   └── public/          # Public SPA (Neo-Brutalism)
    │       ├── EventPage.jsx
    │       ├── PrizeCard.jsx
    │       ├── WinnerDisplay.jsx
    │       ├── DrawAnimation.jsx
    │       └── PasswordGate.jsx
    └── lib/
        ├── api.js
        └── theme.js

spec/
├── models/
├── services/
├── requests/api/v1/
│   ├── admin/
│   └── public/
├── jobs/
└── factories/
```

**Structure Decision**: Rails 標準結構 + Vite 前端整合，後台與前台分離為獨立 SPA。

## Complexity Tracking

> 無違規需要說明。所有設計決策符合憲章原則。
