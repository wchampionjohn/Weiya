# Data Model: 尾牙抽獎活動系統

**Date**: 2025-12-31
**Feature**: 001-lottery-event

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────────┐
│   Admin     │       │    Event    │       │   Participant   │
├─────────────┤       ├─────────────┤       ├─────────────────┤
│ id          │       │ id          │◄──────│ event_id (FK)   │
│ email       │       │ name        │       │ id              │
│ password_   │       │ event_date  │       │ name            │
│   digest    │       │ password    │       │ employee_id     │
│ created_at  │       │ status      │       │ phone           │
│ updated_at  │       │ allow_      │       │ email           │
└─────────────┘       │   repeat_   │       │ created_at      │
                      │   win       │       │ updated_at      │
                      │ required_   │       └────────┬────────┘
                      │   fields    │                │
                      │ created_at  │                │
                      │ updated_at  │                │
                      └──────┬──────┘                │
                             │                       │
                             │ 1:N                   │
                             ▼                       │
                      ┌─────────────┐                │
                      │    Prize    │                │
                      ├─────────────┤                │
                      │ id          │                │
                      │ event_id    │◄───────────────┤
                      │   (FK)      │                │
                      │ name        │                │
                      │ prize_type  │                │
                      │ value       │                │
                      │ quantity    │                │
                      │ taxable     │     ┌──────────┴──────────┐
                      │ display_    │     │                     │
                      │   fields    │     │        Winner       │
                      │ privacy_    │     ├─────────────────────┤
                      │   settings  │     │ id                  │
                      │ allow_      │◄────│ prize_id (FK)       │
                      │   repeat_   │     │ participant_id (FK) │
                      │   win_      │     │ drawn_at            │
                      │   override  │     │ distributed         │
                      │ scheduled_  │     │ distributed_at      │
                      │   at        │     │ distributed_by      │
                      │ drawn       │     │ notification_       │
                      │ drawn_at    │     │   requested         │
                      │ drawn_by    │     │ created_at          │
                      │ position    │     │ updated_at          │
                      │ created_at  │     └─────────────────────┘
                      │ updated_at  │
                      └─────────────┘
```

## Entities

### 1. Admin (管理者)

後台系統操作者。

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK, auto | 主鍵 |
| email | string | NOT NULL, UNIQUE, INDEX | 登入帳號 |
| password_digest | string | NOT NULL | bcrypt 加密密碼 |
| created_at | datetime | NOT NULL | 建立時間 |
| updated_at | datetime | NOT NULL | 更新時間 |

**Validations:**
- email: presence, uniqueness, format (email)
- password: presence (on create), length >= 8

---

### 2. Event (活動)

代表一場抽獎活動。

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK, auto | 主鍵 |
| name | string | NOT NULL | 活動名稱 |
| event_date | datetime | NOT NULL | 活動日期時間 |
| password | string | NULL | 前台密碼（選填） |
| status | integer | NOT NULL, DEFAULT: 0 | 狀態 enum |
| allow_repeat_win | boolean | NOT NULL, DEFAULT: false | 是否允許重複中獎 |
| required_fields | json | NOT NULL, DEFAULT: [] | 參與者必填欄位 |
| created_at | datetime | NOT NULL | 建立時間 |
| updated_at | datetime | NOT NULL | 更新時間 |

**Enums:**
```ruby
enum status: { draft: 0, active: 1, completed: 2 }
```

**Validations:**
- name: presence
- event_date: presence
- required_fields: 至少一個欄位

**Associations:**
- has_many :prizes, dependent: :destroy
- has_many :participants, dependent: :destroy
- has_many :winners, through: :prizes

---

### 3. Prize (獎項)

活動中的獎項。

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK, auto | 主鍵 |
| event_id | bigint | FK, NOT NULL, INDEX | 所屬活動 |
| name | string | NOT NULL | 獎項名稱 |
| prize_type | integer | NOT NULL | 類型 enum |
| value | decimal(10,2) | NOT NULL | 價值 |
| quantity | integer | NOT NULL, DEFAULT: 1 | 中獎名額 |
| taxable | boolean | NOT NULL, DEFAULT: false | 是否需課稅 |
| display_fields | json | NOT NULL, DEFAULT: ["name"] | 顯示欄位 |
| privacy_settings | json | NOT NULL, DEFAULT: {} | 保密設定 |
| allow_repeat_win_override | boolean | NULL | 覆蓋活動重複中獎設定 |
| scheduled_at | datetime | NULL | 排程開獎時間 |
| drawn | boolean | NOT NULL, DEFAULT: false | 是否已開獎 |
| drawn_at | datetime | NULL | 開獎時間 |
| drawn_by | bigint | FK, NULL | 開獎管理者 |
| position | integer | NOT NULL | 顯示順序 |
| created_at | datetime | NOT NULL | 建立時間 |
| updated_at | datetime | NOT NULL | 更新時間 |

**Enums:**
```ruby
enum prize_type: { cash: 0, gift: 1 }
```

**JSONB Structures:**
```ruby
# display_fields: 要顯示的欄位
["name", "phone"]  # 或 ["name", "email"]

# privacy_settings: 各欄位的保密設定
{
  "name": true,    # 陳○銘
  "phone": true,   # 0912-XXX-678
  "email": false   # 完整顯示
}
```

**Validations:**
- name: presence
- value: presence, numericality >= 0
- quantity: presence, numericality > 0
- prize_type: presence

**Callbacks:**
- before_save: 若 prize_type == cash，自動設定 taxable = true

**Associations:**
- belongs_to :event
- belongs_to :drawer, class_name: 'Admin', optional: true
- has_many :winners, dependent: :destroy

**Scopes:**
- `undrawn` - where(drawn: false)
- `drawn` - where(drawn: true)
- `ordered` - order(:position)

---

### 4. Participant (參與者)

可參加抽獎的人員。

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK, auto | 主鍵 |
| event_id | bigint | FK, NOT NULL, INDEX | 所屬活動 |
| name | string | NULL | 姓名 |
| employee_id | string | NULL | 員工編號 |
| phone | string | NULL | 手機 |
| email | string | NULL | Email |
| created_at | datetime | NOT NULL | 建立時間 |
| updated_at | datetime | NOT NULL | 更新時間 |

**Indexes:**
- `(event_id, employee_id)` - UNIQUE (when employee_id is required)
- `(event_id, phone)` - UNIQUE (when phone is required)
- `(event_id, email)` - UNIQUE (when email is required)

**Note:** 唯一性約束依據 Event 的 required_fields 動態決定，在 model 層驗證。

**Validations:**
- 動態驗證必填欄位（依 event.required_fields）
- 動態驗證唯一性（依 event.required_fields 組合）

**Associations:**
- belongs_to :event
- has_many :winners, dependent: :destroy

**Scopes:**
- `eligible_for(prize)` - 根據獎項設定過濾可抽選的參與者

---

### 5. Winner (中獎記錄)

連結獎項與參與者的中獎記錄。

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK, auto | 主鍵 |
| prize_id | bigint | FK, NOT NULL, INDEX | 所屬獎項 |
| participant_id | bigint | FK, NOT NULL, INDEX | 中獎者 |
| drawn_at | datetime | NOT NULL | 中獎時間 |
| distributed | boolean | NOT NULL, DEFAULT: false | 是否已發放 |
| distributed_at | datetime | NULL | 發放時間 |
| distributed_by | bigint | FK, NULL | 發放管理者 |
| notification_requested | boolean | NOT NULL, DEFAULT: false | 是否已請求通知 |
| created_at | datetime | NOT NULL | 建立時間 |
| updated_at | datetime | NOT NULL | 更新時間 |

**Indexes:**
- `(prize_id, participant_id)` - UNIQUE

**Validations:**
- prize_id: presence
- participant_id: presence
- uniqueness: { scope: [:prize_id, :participant_id] }

**Associations:**
- belongs_to :prize
- belongs_to :participant
- belongs_to :distributor, class_name: 'Admin', optional: true

**Scopes:**
- `distributed` - where(distributed: true)
- `pending` - where(distributed: false)

---

## State Transitions

### Event Status

```
┌─────────┐    publish()    ┌─────────┐   all prizes drawn   ┌───────────┐
│  draft  │ ───────────────►│ active  │ ────────────────────►│ completed │
└─────────┘                 └─────────┘                      └───────────┘
     │                           │
     │ editable: all             │ editable: add prize,
     │                           │ modify undrawn prizes
     │                           │
     ▼                           ▼
  全部欄位可編輯              部分欄位可編輯
```

### Prize Draw Status

```
┌──────────┐    execute_draw()    ┌─────────┐
│ undrawn  │ ────────────────────►│  drawn  │
│ drawn=F  │                      │ drawn=T │
└──────────┘                      └─────────┘
     │                                 │
     │ editable: yes                   │ editable: no
     ▼                                 ▼
  可修改/刪除                      不可修改/刪除
```

---

## Migration Order

1. `create_admins` - 管理者表
2. `create_events` - 活動表
3. `create_prizes` - 獎項表 (depends on events, admins)
4. `create_participants` - 參與者表 (depends on events)
5. `create_winners` - 中獎記錄表 (depends on prizes, participants, admins)

---

## Indexes Summary

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| admins | email | UNIQUE | 登入查詢 |
| events | status | INDEX | 狀態過濾 |
| prizes | event_id | INDEX | 活動獎項查詢 |
| prizes | (event_id, drawn) | INDEX | 未開獎項查詢 |
| participants | event_id | INDEX | 活動參與者查詢 |
| participants | (event_id, employee_id) | INDEX | 員工登入查詢 |
| participants | (event_id, phone) | INDEX | 手機登入查詢 |
| participants | (event_id, email) | INDEX | Email 登入查詢 |
| winners | prize_id | INDEX | 獎項中獎者查詢 |
| winners | participant_id | INDEX | 參與者中獎查詢 |
| winners | (prize_id, participant_id) | UNIQUE | 防止重複中獎記錄 |
