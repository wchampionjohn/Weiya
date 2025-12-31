# Tasks: 尾牙抽獎活動系統

**Input**: Design documents from `/specs/001-lottery-event/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: 根據專案憲章「測試驅動開發」原則，所有 User Story 包含測試任務。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure:
- **Backend**: `app/models/`, `app/controllers/api/v1/`, `app/services/`, `app/channels/`
- **Frontend**: `app/frontend/components/`, `app/frontend/entrypoints/`
- **Tests**: `spec/models/`, `spec/requests/`, `spec/services/`
- **Database**: `db/migrate/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Configure Rails API mode and dependencies in Gemfile
- [ ] T002 [P] Configure Vite and React dependencies in package.json
- [ ] T003 [P] Setup RuboCop configuration in .rubocop.yml
- [ ] T004 [P] Setup ESLint configuration in eslint.config.js
- [ ] T005 [P] Configure Tailwind CSS with Neo-Brutalism custom styles in app/frontend/styles/neo-brutalism.css
- [ ] T006 [P] Setup Shadcn-ui configuration in app/frontend/lib/shadcn/
- [ ] T007 [P] Setup MUI theme for admin in app/frontend/styles/admin-theme.js
- [ ] T008 Configure ActionCable with Solid Cable in config/cable.yml
- [ ] T009 Configure Solid Queue for background jobs in config/queue.yml

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Migrations

- [ ] T010 Create admins migration in db/migrate/YYYYMMDDHHMMSS_create_admins.rb
- [ ] T011 Create events migration in db/migrate/YYYYMMDDHHMMSS_create_events.rb
- [ ] T012 Create prizes migration in db/migrate/YYYYMMDDHHMMSS_create_prizes.rb
- [ ] T013 Create participants migration in db/migrate/YYYYMMDDHHMMSS_create_participants.rb
- [ ] T014 Create winners migration in db/migrate/YYYYMMDDHHMMSS_create_winners.rb
- [ ] T015 Run migrations and verify schema in db/schema.rb

### Base Models

- [ ] T016 [P] Create Admin model with has_secure_password in app/models/admin.rb
- [ ] T017 [P] Create Event model with status enum in app/models/event.rb
- [ ] T018 [P] Create Prize model with prize_type enum in app/models/prize.rb
- [ ] T019 [P] Create Participant model in app/models/participant.rb
- [ ] T020 [P] Create Winner model in app/models/winner.rb

### Base Infrastructure

- [ ] T021 Setup API v1 routes namespace in config/routes.rb
- [ ] T022 [P] Create ApplicationController base in app/controllers/application_controller.rb
- [ ] T023 [P] Create Api::V1::BaseController in app/controllers/api/v1/base_controller.rb
- [ ] T024 [P] Create ApplicationCable::Connection in app/channels/application_cable/connection.rb
- [ ] T025 Create seed data with test admin in db/seeds.rb

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 6 - 後台管理者登入 (Priority: P2 → Moved to P1)

**Goal**: 管理者必須透過帳號密碼登入後台才能進行活動管理

**Independent Test**: 使用正確帳密登入後台，驗證可以存取管理功能

**Note**: 雖然規格為 P2，但登入是後續所有後台功能的前置條件，提升為實作優先

### Tests for User Story 6

- [ ] T026 [P] [US6] Create Admin model spec in spec/models/admin_spec.rb
- [ ] T027 [P] [US6] Create sessions controller request spec in spec/requests/api/v1/admin/sessions_spec.rb

### Implementation for User Story 6

- [ ] T028 [US6] Add session timeout check to Api::V1::Admin::BaseController in app/controllers/api/v1/admin/base_controller.rb
- [ ] T029 [US6] Implement SessionsController (login/logout) in app/controllers/api/v1/admin/sessions_controller.rb
- [ ] T030 [P] [US6] Create admin login page component in app/frontend/components/admin/LoginPage.jsx
- [ ] T031 [US6] Setup admin authentication context in app/frontend/components/admin/AuthContext.jsx

**Checkpoint**: Admin authentication complete - admin features can now be implemented

---

## Phase 4: User Story 1 - 後台管理者建立抽獎活動 (Priority: P1) 🎯 MVP

**Goal**: 管理者登入後台後，可以建立一場尾牙抽獎活動，設定活動名稱、日期時間，並新增多個獎項

**Independent Test**: 可透過後台介面建立一場包含至少 3 個獎項的活動，並驗證所有設定都被正確儲存

### Tests for User Story 1

- [ ] T032 [P] [US1] Create Event model spec in spec/models/event_spec.rb
- [ ] T033 [P] [US1] Create Prize model spec in spec/models/prize_spec.rb
- [ ] T034 [P] [US1] Create Participant model spec in spec/models/participant_spec.rb
- [ ] T035 [P] [US1] Create events controller request spec in spec/requests/api/v1/admin/events_spec.rb
- [ ] T036 [P] [US1] Create prizes controller request spec in spec/requests/api/v1/admin/prizes_spec.rb
- [ ] T037 [P] [US1] Create participants controller request spec in spec/requests/api/v1/admin/participants_spec.rb
- [ ] T038 [P] [US1] Create ParticipantImportService spec in spec/services/participant_import_service_spec.rb
- [ ] T039 [P] [US1] Create PrivacyMaskService spec in spec/services/privacy_mask_service_spec.rb

### Implementation for User Story 1

- [ ] T040 [US1] Implement EventsController (CRUD) in app/controllers/api/v1/admin/events_controller.rb
- [ ] T041 [US1] Implement PrizesController (CRUD) in app/controllers/api/v1/admin/prizes_controller.rb
- [ ] T042 [US1] Implement ParticipantsController (CRUD + import) in app/controllers/api/v1/admin/participants_controller.rb
- [ ] T043 [US1] Implement ParticipantImportService in app/services/participant_import_service.rb
- [ ] T044 [US1] Implement PrivacyMaskService in app/services/privacy_mask_service.rb
- [ ] T045 [P] [US1] Create EventList component in app/frontend/components/admin/EventList.jsx
- [ ] T046 [P] [US1] Create EventForm component in app/frontend/components/admin/EventForm.jsx
- [ ] T047 [P] [US1] Create PrizeManager component in app/frontend/components/admin/PrizeManager.jsx
- [ ] T048 [P] [US1] Create PrizeForm component in app/frontend/components/admin/PrizeForm.jsx
- [ ] T049 [P] [US1] Create ParticipantList component in app/frontend/components/admin/ParticipantList.jsx
- [ ] T050 [US1] Create ParticipantImport component in app/frontend/components/admin/ParticipantImport.jsx
- [ ] T051 [US1] Create PrivacyPreview component in app/frontend/components/admin/PrivacyPreview.jsx
- [ ] T052 [US1] Setup admin routing in app/frontend/entrypoints/admin.jsx

**Checkpoint**: Event and prize management complete - can create full lottery events

---

## Phase 5: User Story 2 - 後台管理者執行開獎 (Priority: P1)

**Goal**: 管理者可以選擇手動開獎或依照預設時間表自動開獎

**Independent Test**: 建立一個有參與者的活動，執行開獎後驗證中獎結果正確產生

### Tests for User Story 2

- [ ] T053 [P] [US2] Create Winner model spec in spec/models/winner_spec.rb
- [ ] T054 [P] [US2] Create DrawService spec in spec/services/draw_service_spec.rb
- [ ] T055 [P] [US2] Create draws controller request spec in spec/requests/api/v1/admin/draws_spec.rb
- [ ] T056 [P] [US2] Create ScheduledDrawJob spec in spec/jobs/scheduled_draw_job_spec.rb

### Implementation for User Story 2

- [ ] T057 [US2] Implement DrawService with SecureRandom in app/services/draw_service.rb
- [ ] T058 [US2] Implement DrawsController (execute draw) in app/controllers/api/v1/admin/draws_controller.rb
- [ ] T059 [US2] Implement ScheduledDrawJob in app/jobs/scheduled_draw_job.rb
- [ ] T060 [US2] Add scheduled_at callback to Prize model in app/models/prize.rb
- [ ] T061 [P] [US2] Create DrawControl component in app/frontend/components/admin/DrawControl.jsx
- [ ] T062 [US2] Create DrawConfirmDialog component in app/frontend/components/admin/DrawConfirmDialog.jsx
- [ ] T063 [US2] Create DrawResultDisplay component in app/frontend/components/admin/DrawResultDisplay.jsx

**Checkpoint**: Manual and scheduled drawing complete - lottery functionality operational

---

## Phase 6: User Story 3 - 前台即時顯示開獎結果 (Priority: P1)

**Goal**: 前台畫面即時顯示當前開獎狀態與中獎結果

**Independent Test**: 開啟前台頁面，當後台執行開獎時，驗證前台即時更新顯示結果

### Tests for User Story 3

- [ ] T064 [P] [US3] Create DrawChannel spec in spec/channels/draw_channel_spec.rb
- [ ] T065 [P] [US3] Create public events controller request spec in spec/requests/api/v1/public/events_spec.rb
- [ ] T066 [P] [US3] Create public winners controller request spec in spec/requests/api/v1/public/winners_spec.rb

### Implementation for User Story 3

- [ ] T067 [US3] Implement DrawChannel for WebSocket in app/channels/draw_channel.rb
- [ ] T068 [US3] Add ActionCable broadcasts to DrawService in app/services/draw_service.rb
- [ ] T069 [US3] Implement Public::EventsController in app/controllers/api/v1/public/events_controller.rb
- [ ] T070 [US3] Implement Public::WinnersController in app/controllers/api/v1/public/winners_controller.rb
- [ ] T071 [US3] Create useDrawChannel hook in app/frontend/lib/useDrawChannel.js
- [ ] T072 [US3] Create DrawContext provider in app/frontend/components/public/DrawContext.jsx
- [ ] T073 [P] [US3] Create EventPage component (Neo-Brutalism) in app/frontend/components/public/EventPage.jsx
- [ ] T074 [P] [US3] Create PrizeCard component in app/frontend/components/public/PrizeCard.jsx
- [ ] T075 [P] [US3] Create WinnerDisplay component in app/frontend/components/public/WinnerDisplay.jsx
- [ ] T076 [US3] Create DrawAnimation component in app/frontend/components/public/DrawAnimation.jsx
- [ ] T077 [US3] Create WinnerReveal animation component in app/frontend/components/public/WinnerReveal.jsx
- [ ] T078 [US3] Setup public routing in app/frontend/entrypoints/application.jsx

**Checkpoint**: Real-time display complete - MVP ready for demo

---

## Phase 7: User Story 4 - 員工查詢個人中獎結果 (Priority: P2)

**Goal**: 員工可選擇性登入前台查看自己是否中獎

**Independent Test**: 以員工身份登入，驗證可以看到個人專屬的中獎狀態

### Tests for User Story 4

- [ ] T079 [P] [US4] Create public sessions controller request spec in spec/requests/api/v1/public/sessions_spec.rb

### Implementation for User Story 4

- [ ] T080 [US4] Implement Public::SessionsController (participant login) in app/controllers/api/v1/public/sessions_controller.rb
- [ ] T081 [P] [US4] Create ParticipantLogin component in app/frontend/components/public/ParticipantLogin.jsx
- [ ] T082 [US4] Create ParticipantContext provider in app/frontend/components/public/ParticipantContext.jsx
- [ ] T083 [US4] Create PersonalResult component in app/frontend/components/public/PersonalResult.jsx
- [ ] T084 [US4] Integrate participant login with EventPage in app/frontend/components/public/EventPage.jsx

**Checkpoint**: Participant query complete - employees can check personal results

---

## Phase 8: User Story 5 - 後台管理獎項發放狀態 (Priority: P2)

**Goal**: 管理者可在後台查看所有中獎記錄，勾選標記獎項是否已發放

**Independent Test**: 開獎後，在後台將一個獎項標記為已發放，驗證狀態正確更新

### Tests for User Story 5

- [ ] T085 [P] [US5] Create winners controller request spec in spec/requests/api/v1/admin/winners_spec.rb

### Implementation for User Story 5

- [ ] T086 [US5] Implement WinnersController (list + update) in app/controllers/api/v1/admin/winners_controller.rb
- [ ] T087 [P] [US5] Create WinnerManagement component in app/frontend/components/admin/WinnerManagement.jsx
- [ ] T088 [US5] Create WinnerTable component with MUI DataGrid in app/frontend/components/admin/WinnerTable.jsx
- [ ] T089 [US5] Create DistributionToggle component in app/frontend/components/admin/DistributionToggle.jsx
- [ ] T090 [US5] Create NotificationButton component (placeholder) in app/frontend/components/admin/NotificationButton.jsx

**Checkpoint**: Distribution tracking complete - full admin functionality available

---

## Phase 9: User Story 7 - 前台活動密碼驗證 (Priority: P3)

**Goal**: 前台可設定活動密碼，訪客需輸入正確密碼才能進入

**Independent Test**: 設定活動密碼後，驗證需要輸入正確密碼才能進入前台

### Tests for User Story 7

- [ ] T091 [P] [US7] Create event password verification request spec in spec/requests/api/v1/public/events_verify_spec.rb

### Implementation for User Story 7

- [ ] T092 [US7] Add verify action to Public::EventsController in app/controllers/api/v1/public/events_controller.rb
- [ ] T093 [P] [US7] Create PasswordGate component in app/frontend/components/public/PasswordGate.jsx
- [ ] T094 [US7] Integrate password verification with EventPage in app/frontend/components/public/EventPage.jsx
- [ ] T095 [US7] Add password token storage in app/frontend/lib/sessionStorage.js

**Checkpoint**: Password protection complete - all user stories implemented

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T096 [P] Update seeds with comprehensive test data in db/seeds.rb
- [ ] T097 [P] Add request logging middleware in app/middleware/request_logger.rb
- [ ] T098 [P] Create API error handling concern in app/controllers/concerns/error_handler.rb
- [ ] T099 Code cleanup and remove unused imports
- [ ] T100 Run RuboCop and fix any violations
- [ ] T101 Run ESLint and fix any violations
- [ ] T102 Run full test suite and verify all specs pass
- [ ] T103 Run quickstart.md validation scenarios
- [ ] T104 Performance test: Verify 500 concurrent WebSocket connections

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 6 (Phase 3)**: Depends on Foundational - Authentication prerequisite for admin features
- **User Story 1 (Phase 4)**: Depends on US6 - Event management needs auth
- **User Story 2 (Phase 5)**: Depends on US1 - Drawing needs events and participants
- **User Story 3 (Phase 6)**: Depends on US2 - Display needs drawing functionality
- **User Story 4 (Phase 7)**: Depends on US3 - Personal query needs public display
- **User Story 5 (Phase 8)**: Depends on US2 - Distribution needs winners
- **User Story 7 (Phase 9)**: Depends on US3 - Password gate needs public display
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies Graph

```
              ┌─────────────────────────────────────────┐
              │         Phase 1: Setup                  │
              └────────────────┬────────────────────────┘
                               │
              ┌────────────────▼────────────────────────┐
              │      Phase 2: Foundational              │
              └────────────────┬────────────────────────┘
                               │
              ┌────────────────▼────────────────────────┐
              │    Phase 3: US6 (Admin Login)           │
              └────────────────┬────────────────────────┘
                               │
              ┌────────────────▼────────────────────────┐
              │    Phase 4: US1 (Event Management)      │
              │                🎯 MVP Start              │
              └────────────────┬────────────────────────┘
                               │
              ┌────────────────▼────────────────────────┐
              │    Phase 5: US2 (Execute Draw)          │
              └───────┬────────────────────┬────────────┘
                      │                    │
       ┌──────────────▼──────┐    ┌────────▼─────────────┐
       │ Phase 6: US3        │    │ Phase 8: US5         │
       │ (Real-time Display) │    │ (Distribution)       │
       └──────┬──────────────┘    └──────────────────────┘
              │
       ┌──────▼──────────────┐
       │ Phase 7: US4        │
       │ (Personal Query)    │
       └──────┬──────────────┘
              │
       ┌──────▼──────────────┐
       │ Phase 9: US7        │
       │ (Password Gate)     │
       └─────────────────────┘
```

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models before services
- Services before controllers
- Backend before frontend
- Core implementation before integration

### Parallel Opportunities

- **Phase 1**: T002, T003, T004, T005, T006, T007 can run in parallel
- **Phase 2**: T016-T020 (models) can run in parallel; T022-T024 can run in parallel
- **Phase 3**: T026, T027 (tests) in parallel; T030 (frontend) parallel with backend
- **Phase 4**: All tests (T032-T039) in parallel; Frontend components (T045-T051) in parallel
- **Phase 5**: All tests (T053-T056) in parallel; T061 parallel with backend
- **Phase 6**: All tests (T064-T066) in parallel; T073-T075 in parallel
- **Phase 7**: T081 parallel with backend
- **Phase 8**: T087 parallel with backend
- **Phase 9**: T093 parallel with backend

---

## Parallel Example: User Story 1 (Phase 4)

```bash
# Launch all tests for User Story 1 together:
Task: "Create Event model spec in spec/models/event_spec.rb"
Task: "Create Prize model spec in spec/models/prize_spec.rb"
Task: "Create Participant model spec in spec/models/participant_spec.rb"
Task: "Create events controller request spec in spec/requests/api/v1/admin/events_spec.rb"
Task: "Create prizes controller request spec in spec/requests/api/v1/admin/prizes_spec.rb"
Task: "Create participants controller request spec in spec/requests/api/v1/admin/participants_spec.rb"
Task: "Create ParticipantImportService spec in spec/services/participant_import_service_spec.rb"
Task: "Create PrivacyMaskService spec in spec/services/privacy_mask_service_spec.rb"

# After tests written, launch frontend components in parallel:
Task: "Create EventList component in app/frontend/components/admin/EventList.jsx"
Task: "Create EventForm component in app/frontend/components/admin/EventForm.jsx"
Task: "Create PrizeManager component in app/frontend/components/admin/PrizeManager.jsx"
Task: "Create PrizeForm component in app/frontend/components/admin/PrizeForm.jsx"
Task: "Create ParticipantList component in app/frontend/components/admin/ParticipantList.jsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 + US6)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 6 (Admin Login)
4. Complete Phase 4: User Story 1 (Event Management)
5. Complete Phase 5: User Story 2 (Execute Draw)
6. Complete Phase 6: User Story 3 (Real-time Display)
7. **STOP and VALIDATE**: Test MVP independently with quickstart.md
8. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational + US6 → Admin authentication ready
2. Add US1 → Event management ready → Demo admin CRUD
3. Add US2 → Drawing functionality ready → Demo lottery execution
4. Add US3 → Real-time display ready → **Full MVP Demo!**
5. Add US4 → Personal query ready → Enhanced participant experience
6. Add US5 → Distribution tracking ready → Full admin functionality
7. Add US7 → Password protection ready → Enterprise-ready

### Suggested MVP Scope

**Minimum Viable Product includes:**
- Phase 1: Setup
- Phase 2: Foundational
- Phase 3: US6 (Admin Login)
- Phase 4: US1 (Event Management)
- Phase 5: US2 (Execute Draw)
- Phase 6: US3 (Real-time Display)

**Total MVP Tasks**: 78 tasks (T001 - T078)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD per constitution)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Frontend uses Shadcn-ui + Neo-Brutalism for public, MUI for admin (per design.md)
