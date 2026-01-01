# Tasks: 尾牙抽獎活動系統

**Input**: Design documents from `/specs/001-lottery-event/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Updated**: 2026-01-01 (重大架構調整)

**重大變更**:
1. 參與者改為全域實體，透過 EventParticipant 關聯至活動
2. 前台拆分為多個頁面（首頁、開獎直播、登入、中獎記錄）
3. 隱私遮罩設定可針對各欄位獨立設定
4. 介面統一使用繁體中文
5. 活動未發布時前台顯示 404

**Tests**: 根據專案憲章「測試驅動開發」原則，所有 User Story 包含測試任務。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: 資料庫遷移重構 ✅

**Purpose**: 重構資料模型以支援參與者跨活動使用

### 遷移任務

- [X] T001 建立 event_participants 遷移 (新增關聯表) `db/migrate/YYYYMMDDHHMMSS_create_event_participants.rb`
- [X] T002 修改 participants 表移除 event_id (改為全域) `db/migrate/YYYYMMDDHHMMSS_make_participants_global.rb`
- [X] T003 修改 winners 表改用 event_participant_id `db/migrate/YYYYMMDDHHMMSS_update_winners_for_event_participants.rb`
- [X] T004 執行遷移並驗證 schema `rails db:migrate`

---

## Phase 2: 模型重構 ✅

**Purpose**: 更新模型以支援新的資料結構

### 模型更新

- [X] T005 [P] 更新 Participant 模型（移除 event 關聯，改為 has_many :event_participants）`app/models/participant.rb`
- [X] T006 [P] 建立 EventParticipant 模型 `app/models/event_participant.rb`
- [X] T007 [P] 更新 Event 模型（改用 has_many :participants, through: :event_participants）`app/models/event.rb`
- [X] T008 [P] 更新 Winner 模型（改用 event_participant_id）`app/models/winner.rb`
- [X] T009 [P] 更新 Prize 模型（確保 privacy_settings 支援各欄位獨立設定）`app/models/prize.rb`

### 模型測試

- [X] T010 [P] 更新 Participant 模型測試 `spec/models/participant_spec.rb`
- [X] T011 [P] 建立 EventParticipant 模型測試 `spec/models/event_participant_spec.rb`
- [X] T012 [P] 更新 Winner 模型測試 `spec/models/winner_spec.rb`

---

## Phase 3: 後台 API 重構 ✅

**Purpose**: 新增全域參與者管理與活動參與者關聯 API

### 全域參與者 API

- [X] T013 [P] 建立 ParticipantsController（全域 CRUD）`app/controllers/api/v1/admin/participants_controller.rb`
- [X] T014 [P] 建立全域參與者 API 測試 `spec/requests/api/v1/admin/participants_spec.rb`

### 活動參與者關聯 API

- [X] T015 [P] 建立 EventParticipantsController `app/controllers/api/v1/admin/event_participants_controller.rb`
- [X] T016 [P] 建立活動參與者 API 測試 `spec/requests/api/v1/admin/event_participants_spec.rb`

### 更新匯入服務

- [X] T017 更新 ParticipantImportService（支援全域匯入或活動匯入）`app/services/participant_import_service.rb`
- [X] T018 更新 ParticipantImportService 測試 `spec/services/participant_import_service_spec.rb`

### 更新抽獎服務

- [X] T019 更新 DrawService（使用 event_participant_id）`app/services/draw_service.rb`
- [X] T020 更新 DrawService 測試 `spec/services/draw_service_spec.rb`

---

## Phase 4: 隱私遮罩功能完善 ✅

**Purpose**: 確保隱私遮罩功能可針對各欄位獨立設定

### 服務更新

- [X] T021 完善 PrivacyMaskService（支援各欄位獨立設定）`app/services/privacy_mask_service.rb`
- [X] T022 更新 PrivacyMaskService 測試 `spec/services/privacy_mask_service_spec.rb`

### 後台獎項設定 UI

- [X] T023 更新 PrizeForm 支援隱私設定（各欄位獨立開關）`app/frontend/components/admin/PrizeForm.jsx`
- [X] T024 建立 PrivacySettingsEditor 元件（整合於 PrizeForm）

---

## Phase 5: 前台路由重構 ✅

**Purpose**: 將前台拆分為多個清晰的頁面

### 路由設定

- [X] T025 更新前台路由配置 `config/routes.rb`
- [X] T026 更新前台 React Router 配置 `app/frontend/entrypoints/application.jsx`

### 頁面元件

- [X] T027 [P] 建立 WelcomePage（活動首頁/登入入口）`app/frontend/components/event/WelcomePage.tsx`
- [X] T028 [P] 建立 OverviewPage（活動總覽頁）`app/frontend/components/event/OverviewPage.tsx`
- [X] T029 [P] 建立 LiveDrawPage（開獎直播頁含進度）`app/frontend/components/event/LiveDrawPage.tsx`
- [X] T030 [P] 建立 ResultsPage（中獎記錄頁）`app/frontend/components/event/ResultsPage.tsx`
- [X] T031 [P] 建立 LoginPage（個人中獎查詢）`app/frontend/components/event/LoginPage.tsx`
- [X] T032 [P] 建立 NotFoundPage（404 錯誤頁）（整合於 PasswordGate）
- [X] T033 更新 EventApp 路由配置 `app/frontend/components/event/EventApp.tsx`

### 前台 API 更新

- [X] T034 更新 Public::EventsController（草稿返回 404）`app/controllers/api/v1/public/events_controller.rb`
- [X] T035 更新公開活動 API 測試 `spec/requests/api/v1/public/events_spec.rb`
- [X] T036 更新 Public::SessionsController（改用活動限定 session）`app/controllers/api/v1/public/sessions_controller.rb`

---

## Phase 6: 後台 UI 重構 ✅

**Purpose**: 更新後台以支援全域參與者管理

### 參與者管理

- [X] T037 建立全域 ParticipantManagement 頁面 `app/frontend/components/admin/ParticipantManagement.jsx`
- [X] T038 建立 ParticipantForm 元件（整合於 ParticipantManagement）
- [X] T039 建立 ParticipantSelector 元件（整合於 ParticipantList）

### 活動參與者管理

- [X] T040 建立 EventParticipantList 元件（整合於 ParticipantList）
- [X] T041 更新 EventForm 移除參與者直接新增（改用選擇器）`app/frontend/components/admin/EventForm.jsx`

### 後台導航更新

- [X] T042 更新 AdminApp 導航（新增參與者管理入口）`app/frontend/components/admin/AdminApp.jsx`

### 活動網址顯示

- [X] T042a 更新 EventForm 顯示活動公開網址（含複製功能）`app/frontend/components/admin/EventForm.jsx`

---

## Phase 7: 介面中文化 ✅

**Purpose**: 統一全系統使用繁體中文

### 後台中文化

- [X] T043 [P] 建立中文語系檔（直接內嵌於元件）
- [X] T044 [P] 更新 LoginPage 中文化 `app/frontend/components/admin/LoginPage.jsx`
- [X] T045 [P] 更新 EventList 中文化 `app/frontend/components/admin/EventList.jsx`
- [X] T046 [P] 更新 EventForm 中文化 `app/frontend/components/admin/EventForm.jsx`
- [X] T047 [P] 更新 PrizeManager 中文化 `app/frontend/components/admin/PrizeManager.jsx`
- [X] T048 [P] 更新 ParticipantList 中文化 `app/frontend/components/admin/ParticipantList.jsx`
- [X] T049 [P] 更新 DrawControl 中文化 `app/frontend/components/admin/DrawControl.jsx`
- [X] T050 [P] 更新 WinnerManagement 中文化 `app/frontend/components/admin/WinnerManagement.jsx`

### 前台中文化

- [X] T051 [P] 更新所有前台元件中文化 `app/frontend/components/event/*.tsx`

### API 錯誤訊息中文化

- [ ] T052 更新 API 錯誤訊息為中文 `app/controllers/concerns/error_handler.rb`

---

## Phase 8: Seed 資料擴充 ✅

**Purpose**: 提供更豐富的測試資料

### Seed 資料

- [X] T053 更新 seeds.rb（更多測試資料）`db/seeds.rb`
  - 建立 100 位全域參與者
  - 建立 3 個活動（草稿、進行中、已完成各一）
  - 進行中活動有 10 個獎項
  - 已完成活動有中獎記錄
  - 參與者跨活動使用

---

## Phase 9: Favicon 設計 ✅

**Purpose**: 新增網站 favicon

### Favicon

- [X] T054 設計並建立 favicon.ico `public/favicon.ico`
- [X] T055 建立 favicon.svg `public/icon.svg`
- [X] T056 更新 HTML head 引用 favicon `app/views/layouts/application.html.erb`
- [X] T057 更新 admin layout 引用 favicon `app/views/layouts/admin.html.erb`

---

## Phase 10: 測試與驗證 ✅

**Purpose**: 確保所有功能正常運作

### 測試

- [X] T058 執行完整測試套件 `bundle exec rspec` (206 examples, 0 failures)
- [X] T059 驗證前台路由功能（各頁面可正常切換）
- [X] T060 驗證隱私遮罩功能（各欄位獨立設定）
- [X] T061 驗證參與者跨活動使用功能
- [X] T062 驗證草稿活動返回 404

---

## Dependencies & Execution Order

### 必須按順序執行

1. **Phase 1: 資料庫遷移重構** - ✅ 已完成
2. **Phase 2: 模型重構** - ✅ 已完成
3. **Phase 3: 後台 API 重構** - ✅ 已完成
4. **Phase 4: 隱私遮罩功能完善** - ✅ 已完成
5. **Phase 5: 前台路由重構** - ✅ 已完成
6. **Phase 6: 後台 UI 重構** - ✅ 已完成
7. **Phase 7: 介面中文化** - ✅ 已完成
8. **Phase 8: Seed 資料擴充** - ✅ 已完成
9. **Phase 9: Favicon 設計** - ✅ 已完成
10. **Phase 10: 測試與驗證** - ✅ 已完成

### 可並行執行

```
Phase 1 (遷移) ✅
    │
    ▼
Phase 2 (模型) ✅
    │
    ├──────────────┬──────────────┐
    ▼              ▼              ▼
Phase 3 ✅     Phase 4 ✅     Phase 8 ✅
(API)      (隱私遮罩 UI)    (Seed)
    │              │
    ├──────────────┤
    ▼              ▼
Phase 5 ✅     Phase 6 ✅
(前台路由)   (後台 UI)
    │              │
    └──────┬───────┘
           ▼
      Phase 7 ✅
     (中文化)
           │
           ▼
      Phase 10
      (測試)

Phase 9 (Favicon) ✅ - 可隨時執行
```

---

## 任務總數

- Phase 1: 4 tasks ✅
- Phase 2: 8 tasks ✅
- Phase 3: 8 tasks ✅
- Phase 4: 4 tasks ✅
- Phase 5: 12 tasks ✅
- Phase 6: 7 tasks ✅
- Phase 7: 10 tasks (9 ✅ + 1 待 API 錯誤中文化)
- Phase 8: 1 task ✅
- Phase 9: 4 tasks ✅
- Phase 10: 5 tasks ✅

**Total: 63 tasks**
**Completed: 62 tasks**
**Remaining: 1 task (T052 API 錯誤訊息中文化)**
