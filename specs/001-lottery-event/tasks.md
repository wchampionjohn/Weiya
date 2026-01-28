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

**Phase 1 Total: 63 tasks**
**Phase 1 Completed: 62 tasks**
**Phase 1 Remaining: 1 task (T052 API 錯誤訊息中文化)**

---

# Phase 2 Tasks: 進階功能擴充

**Updated**: 2026-01-02
**Input**: Phase 2 specifications from spec.md, research.md, data-model.md, contracts/phase2-api.yaml

**Phase 2 新增功能**:
1. 臨時加碼獎項（活動進行中即時新增）
2. 參與者年資與部門欄位（支援資格條件篩選）
3. 獎項時程表顯示
4. 指定中獎人功能
5. 批次發放功能
6. 通知模板設定
7. 快速建立活動（從過去活動複製）

**優先順序**: P2 (US8, US10, US13, US15) → P3 (US9, US11, US12, US14)

---

## Phase 2-1: 資料庫遷移（Phase 2 欄位）

**Purpose**: 新增 Phase 2 所需的資料庫欄位

### 遷移任務

- [X] T063 [P] 建立 Participant 欄位遷移（+hire_date, +department）`db/migrate/20260102010557_add_phase2_fields_to_participants.rb`
- [X] T064 [P] 建立 Event 欄位遷移（+sms_template, +email_template, +copied_from_event_id）`db/migrate/20260102010558_add_phase2_fields_to_events.rb`
- [X] T065 [P] 建立 Prize 欄位遷移（+eligibility_rules, +designated_participant_id, +is_bonus）`db/migrate/20260102010600_add_phase2_fields_to_prizes.rb` (scheduled_at 已存在)
- [X] T066 [P] 建立 Winner 欄位遷移（+is_designated）`db/migrate/20260102010601_add_phase2_fields_to_winners.rb`
- [X] T067 執行遷移並驗證 schema `rails db:migrate`

---

## Phase 2-2: 模型更新（Phase 2 欄位）

**Purpose**: 更新模型以支援 Phase 2 欄位與驗證

### 模型更新

- [X] T068 [P] 更新 Participant 模型（+hire_date, +department, +seniority_years_for 方法）`app/models/participant.rb`
- [X] T069 [P] 更新 Event 模型（+sms_template, +email_template, +copied_from_event_id）`app/models/event.rb`
- [X] T070 [P] 更新 Prize 模型（+eligibility_rules, +designated_participant_id, +is_bonus, +scheduled_at）`app/models/prize.rb`
- [X] T071 [P] 更新 Winner 模型（+is_designated）`app/models/winner.rb`
- [X] T072 [P] 更新 EventParticipant 模型（+eligible_for scope）`app/models/event_participant.rb`

### 模型測試

- [X] T073 [P] 更新 Participant 模型測試（年資計算）`spec/models/participant_spec.rb`
- [X] T074 [P] 更新 Prize 模型測試（eligibility_rules, designated_participant）`spec/models/prize_spec.rb`
- [X] T075 [P] 更新 EventParticipant 模型測試（eligible_for scope）`spec/models/event_participant_spec.rb`

---

## Phase 2-3: US15 快速建立活動 (P2)

**Purpose**: 從過去活動複製設定建立新活動

### 服務層

- [X] T076 建立 EventCopyService `app/services/event_copy_service.rb`
- [X] T077 建立 EventCopyService 測試 `spec/services/event_copy_service_spec.rb`

### API 層

- [X] T078 新增 EventsController#copy action `app/controllers/api/v1/admin/events_controller.rb`
- [X] T079 新增複製活動 API 測試 `spec/requests/api/v1/admin/events_spec.rb`

### 前端

- [X] T080 更新 EventList 新增「複製」按鈕 `app/frontend/components/admin/EventList.jsx`
- [X] T081 建立 CopyEventDialog 元件 `app/frontend/components/admin/CopyEventDialog.jsx`

---

## Phase 2-4: US8 臨時加碼獎項 (P2)

**Purpose**: 活動進行中即時新增加碼獎項

### 模型層

- [X] T082 新增 Prize#insert_after_latest_drawn 方法 `app/models/prize.rb`

### API 層

- [X] T083 新增 PrizesController#bonus action `app/controllers/api/v1/admin/prizes_controller.rb`
- [X] T084 新增加碼獎項 API 測試 `spec/requests/api/v1/admin/prizes_spec.rb`

### ActionCable

- [X] T085 更新 DrawChannel 廣播新獎項事件 `app/channels/draw_channel.rb`

### 前端

- [X] T086 更新 PrizeManager 支援加碼獎項 `app/frontend/components/admin/PrizeManager.jsx`
- [X] T087 更新前台 LiveDrawPage 接收新獎項事件 `app/frontend/components/event/LiveDrawPage.tsx`

---

## Phase 2-5: US10 獎項開獎時間 (P2)

**Purpose**: 設定預計開獎時間，前台顯示時程表

### API 層

- [X] T088 更新 PrizesController 支援 scheduled_at `app/controllers/api/v1/admin/prizes_controller.rb`
- [X] T089 更新 Public::EventsController 回傳時程資訊 `app/controllers/api/v1/public/events_controller.rb`

### 前端後台

- [X] T090 更新 PrizeForm 新增開獎時間欄位 `app/frontend/components/admin/PrizeForm.jsx`

### 前端前台

- [X] T091 建立 ScheduleDisplay 時程表元件 `app/frontend/components/event/ScheduleDisplay.tsx`
- [X] T092 更新 OverviewPage 整合時程表 `app/frontend/components/event/OverviewPage.tsx`

---

## Phase 2-6: US13 批次發放 (P2)

**Purpose**: 批次標記多筆中獎記錄為已發放

### 服務層

- [X] T093 建立 WinnerBatchDistributeService `app/services/winner_batch_distribute_service.rb`
- [X] T094 建立 WinnerBatchDistributeService 測試 `spec/services/winner_batch_distribute_service_spec.rb`

### API 層

- [X] T095 新增 WinnersController#batch_distribute action `app/controllers/api/v1/admin/winners_controller.rb`
- [X] T096 新增批次發放 API 測試 `spec/requests/api/v1/admin/winners_spec.rb`

### 前端

- [X] T097 更新 WinnerManagement 支援批次選取 `app/frontend/components/admin/WinnerManagement.jsx`
- [X] T098 新增批次發放確認對話框 `app/frontend/components/admin/BatchDistributeDialog.jsx`

---

## Phase 2-7: US9 參與者年資資訊 (P3)

**Purpose**: 支援年資欄位匯入與計算

### 服務層

- [X] T099 更新 ParticipantImportService 支援 hire_date, department `app/services/participant_import_service.rb`
- [X] T100 更新 ParticipantImportService 測試 `spec/services/participant_import_service_spec.rb`

### 前端

- [X] T101 更新 ParticipantForm 新增年資部門欄位 `app/frontend/components/admin/ParticipantManagement.jsx`
- [X] T102 更新 ParticipantList 顯示年資部門 `app/frontend/components/admin/ParticipantList.jsx`

---

## Phase 2-8: US11 參與資格條件 (P3)

**Purpose**: 獎項可設定年資、部門等資格條件

### 服務層

- [X] T103 更新 DrawService 支援 eligibility_rules 篩選 `app/services/draw_service.rb` (已透過 eligible_for scope 實現)
- [X] T104 更新 DrawService 測試（資格條件篩選）`spec/services/draw_service_spec.rb`

### API 層

- [X] T105 新增 PrizesController#eligibility action (合併至 eligible_participants)
- [X] T106 新增 PrizesController#eligible_participants action `app/controllers/api/v1/admin/prizes_controller.rb`
- [X] T107 新增資格條件 API 測試 `spec/requests/api/v1/admin/prizes_spec.rb`

### 前端

- [X] T108 建立 EligibilityRulesEditor 元件 `app/frontend/components/admin/EligibilityRulesEditor.jsx`
- [X] T109 更新 PrizeForm 整合資格條件編輯器 `app/frontend/components/admin/PrizeForm.jsx`
- [X] T110 EligibleParticipantsPreview 功能整合於 EligibilityRulesEditor 中

---

## Phase 2-9: US12 指定中獎人 (P3)

**Purpose**: 獎項可預先指定中獎者

### 服務層

- [X] T111 更新 DrawService 支援指定中獎人 `app/services/draw_service.rb`
- [X] T112 更新 DrawService 測試（指定中獎人）`spec/services/draw_service_spec.rb`

### API 層

- [X] T113 designated_participant_id 已在 prize_params 中支援
- [X] T114 API 測試整合於現有測試中

### 前端

- [X] T115 建立 DesignateWinnerSelector 元件 `app/frontend/components/admin/DesignateWinnerSelector.jsx`
- [X] T116 更新 PrizeForm 整合指定中獎人選擇器 `app/frontend/components/admin/PrizeForm.jsx`

---

## Phase 2-10: US14 通知模板 (P3) ✅

**Purpose**: 設定簡訊/Email 通知模板

### 服務層

- [X] T117 建立 NotificationTemplateService `app/services/notification_template_service.rb`
- [X] T118 建立 NotificationTemplateService 測試 `spec/services/notification_template_service_spec.rb`

### API 層

- [X] T119 新增 EventsController#preview_notification action `app/controllers/api/v1/admin/events_controller.rb`
- [X] T120 新增通知模板預覽 API 測試 `spec/requests/api/v1/admin/events_spec.rb`

### 前端

- [X] T121 建立 NotificationTemplateEditor 元件 `app/frontend/components/admin/NotificationTemplateEditor.jsx`
- [X] T122 更新 EventForm 整合通知模板編輯器 `app/frontend/components/admin/EventForm.jsx`

---

## Phase 2-11: Seed 資料更新 ✅

**Purpose**: 更新種子資料以包含 Phase 2 欄位

- [X] T123 更新 seeds.rb 加入 Phase 2 測試資料 `db/seeds.rb`
  - 參與者含 hire_date 與 department
  - 獎項含 scheduled_at 與 eligibility_rules
  - 活動含通知模板
  - 獎項含指定中獎人 (designated_participant_id)

---

## Phase 2-12: 測試與驗證 ✅

**Purpose**: 確保 Phase 2 功能正常運作

- [X] T124 執行完整測試套件 `bundle exec rspec` - **312 examples, 0 failures**
- [X] T125 驗證活動複製功能 (EventCopyService: 11 specs passed)
- [X] T126 驗證加碼獎項功能 (PrizesController#bonus: 2 specs passed)
- [X] T127 驗證開獎時程表顯示 (scheduled_at in prize jbuilder)
- [X] T128 驗證批次發放功能 (WinnerBatchDistributeService: 5 specs passed)
- [X] T129 驗證年資部門匯入 (ParticipantImportService: 22 specs passed)
- [X] T130 驗證資格條件篩選 (DrawService eligibility: 4 specs passed)
- [X] T131 驗證指定中獎人功能 (DrawService designated: 2 specs passed)
- [X] T132 驗證通知模板預覽 (NotificationTemplateService: 11 specs passed)

---

## Phase 2 Dependencies & Execution Order

### 必須按順序執行

1. **Phase 2-1: 資料庫遷移** - 基礎
2. **Phase 2-2: 模型更新** - 依賴 Phase 2-1
3. **Phase 2-3 ~ 2-10: 功能開發** - 依賴 Phase 2-2，可並行
4. **Phase 2-11: Seed 更新** - 依賴 Phase 2-2
5. **Phase 2-12: 測試驗證** - 最後執行

### 可並行執行

```
Phase 2-1 (遷移)
    │
    ▼
Phase 2-2 (模型)
    │
    ├───────────┬───────────┬───────────┬───────────┐
    ▼           ▼           ▼           ▼           ▼
Phase 2-3   Phase 2-4   Phase 2-5   Phase 2-6   Phase 2-11
(US15 複製) (US8 加碼) (US10 時程) (US13 批次) (Seed)
    │           │           │           │
    └───────────┴───────────┴───────────┘
                      │
    ┌─────────────────┼─────────────────┐
    ▼                 ▼                 ▼
Phase 2-7         Phase 2-8         Phase 2-9
(US9 年資)        (US11 資格)       (US12 指定)
    │                 │                 │
    └─────────────────┼─────────────────┘
                      │
                      ▼
                Phase 2-10
                (US14 通知)
                      │
                      ▼
                Phase 2-12
                (測試驗證)
```

### User Story 依賴關係

| User Story | 依賴 | 原因 |
|------------|------|------|
| US15 快速建立活動 | Phase 2-2 | 需要新欄位 |
| US8 加碼獎項 | Phase 2-2 | 需要 is_bonus 欄位 |
| US10 開獎時程 | Phase 2-2 | 需要 scheduled_at 欄位 |
| US13 批次發放 | Phase 2-2 | 基礎功能擴充 |
| US9 年資資訊 | Phase 2-2 | 需要 hire_date/department 欄位 |
| US11 資格條件 | US9 | 需要年資部門資料 |
| US12 指定中獎人 | Phase 2-2 | 需要 designated_participant_id 欄位 |
| US14 通知模板 | Phase 2-2 | 需要 sms_template/email_template 欄位 |

---

## Phase 2 任務總數

- Phase 2-1: 5 tasks (遷移)
- Phase 2-2: 8 tasks (模型)
- Phase 2-3: 6 tasks (US15 複製活動)
- Phase 2-4: 6 tasks (US8 加碼獎項)
- Phase 2-5: 5 tasks (US10 時程表)
- Phase 2-6: 6 tasks (US13 批次發放)
- Phase 2-7: 4 tasks (US9 年資)
- Phase 2-8: 8 tasks (US11 資格條件)
- Phase 2-9: 6 tasks (US12 指定中獎人)
- Phase 2-10: 6 tasks (US14 通知模板)
- Phase 2-11: 1 task (Seed)
- Phase 2-12: 9 tasks (測試驗證)

**Phase 2 Total: 70 tasks**
**Overall Total: 133 tasks (Phase 1: 63 + Phase 2: 70)**
