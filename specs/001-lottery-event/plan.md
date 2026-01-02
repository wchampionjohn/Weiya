# Implementation Plan: 尾牙抽獎活動系統 (Phase 2)

**Branch**: `001-lottery-event` | **Date**: 2026-01-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-lottery-event/spec.md`
**Phase**: Phase 2 - 進階功能擴充

## Summary

Phase 2 為現有抽獎系統新增進階功能：
- 臨時加碼獎項（活動進行中即時新增）
- 參與者年資與部門欄位（支援資格條件篩選）
- 獎項排程顯示（前台時程表）
- 指定中獎人功能（後台預設得獎者）
- 批次發放功能（提升作業效率）
- 通知模板設定（簡訊/Email 範本）
- 快速建立活動（從過去活動複製）

## Technical Context

**Language/Version**: Ruby 3.4.1 / Rails 8.0.2.1 (Backend), TypeScript / React 19.x (Frontend)
**Primary Dependencies**: Rails (API mode), React 19, Vite 5, Tailwind CSS 3, ActionCable (WebSocket)
**Storage**: SQLite 3 (development/production)
**Testing**: RSpec (Rails), Vitest (optional for Frontend)
**Target Platform**: Web application (desktop browser + 投影大螢幕)
**Project Type**: Web application (monorepo: Rails API + React SPA)
**Performance Goals**: 500 concurrent WebSocket connections, <2s result sync
**Constraints**: 繁體中文 UI, 隱私遮罩, 無外部通知服務整合
**Scale/Scope**: ~500 participants per event, ~10 prizes, ~100 winners

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. 簡單優先 | ✅ PASS | 使用 Rails 內建功能，不引入新依賴 |
| II. 測試驅動開發 | ✅ PASS | 所有 User Story 包含測試任務 |
| III. 程式碼品質 | ✅ PASS | 遵循 Rails 慣例、Service Object 模式 |

**Gate Result**: PASS - 可進入 Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/001-lottery-event/
├── plan.md              # This file (Phase 2 update)
├── research.md          # Phase 1 + Phase 2 research
├── data-model.md        # Phase 1 + Phase 2 entity updates
├── quickstart.md        # Integration scenarios
├── contracts/           # API contracts
└── tasks.md             # Implementation tasks (Phase 2 TBD)
```

### Source Code (repository root)

```text
app/
├── controllers/
│   └── api/v1/
│       ├── admin/           # 後台 API
│       │   ├── events_controller.rb
│       │   ├── prizes_controller.rb
│       │   ├── participants_controller.rb
│       │   ├── event_participants_controller.rb
│       │   ├── draws_controller.rb
│       │   └── winners_controller.rb
│       └── public/          # 前台 API
│           ├── events_controller.rb
│           ├── winners_controller.rb
│           └── sessions_controller.rb
├── models/
│   ├── admin.rb
│   ├── event.rb
│   ├── prize.rb
│   ├── participant.rb        # Phase 2: +hire_date, +department
│   ├── event_participant.rb
│   └── winner.rb             # Phase 2: +is_designated
├── services/
│   ├── draw_service.rb       # Phase 2: 支援指定中獎人
│   ├── privacy_mask_service.rb
│   ├── participant_import_service.rb  # Phase 2: 支援年資/部門欄位
│   └── event_copy_service.rb          # Phase 2: 新增
├── channels/
│   └── draw_channel.rb
└── frontend/
    ├── components/
    │   ├── admin/           # 後台元件
    │   │   ├── EventForm.jsx      # Phase 2: 複製活動功能
    │   │   ├── PrizeForm.jsx      # Phase 2: 指定中獎人
    │   │   ├── WinnerManagement.jsx  # Phase 2: 批次發放
    │   │   └── NotificationTemplateEditor.jsx  # Phase 2: 新增
    │   └── event/           # 前台元件
    │       ├── LiveDrawPage.tsx
    │       ├── ScheduleDisplay.tsx   # Phase 2: 時程表
    │       └── ResultsPage.tsx
    └── entrypoints/
        ├── application.jsx
        └── admin.jsx

spec/
├── models/
├── requests/
│   └── api/v1/
│       ├── admin/
│       └── public/
└── services/
```

**Structure Decision**: 延續 Phase 1 結構，新增 Phase 2 相關元件與服務。

## Complexity Tracking

> 無違規需要記錄

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none) | - | - |
