# Data Model: 尾牙抽獎活動系統

**Date**: 2026-01-01
**Feature**: 001-lottery-event
**Updated**: 2026-01-01 (重構參與者模型支援跨活動使用)

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌───────────────────┐
│   Admin     │       │    Event    │       │   Participant     │
├─────────────┤       ├─────────────┤       ├───────────────────┤
│ id          │       │ id          │       │ id                │
│ email       │       │ name        │       │ name              │
│ password_   │       │ event_date  │       │ employee_id (UQ)  │
│   digest    │       │ password    │       │ phone (UQ)        │
│ created_at  │       │ status      │       │ email (UQ)        │
│ updated_at  │       │ allow_      │       │ created_at        │
└─────────────┘       │   repeat_   │       │ updated_at        │
                      │   win       │       └────────┬──────────┘
                      │ required_   │                │
                      │   fields    │                │
                      │ created_at  │                │
                      │ updated_at  │                │
                      └──────┬──────┘                │
                             │                       │
                             │ 1:N                   │
                             ▼                       │
                      ┌─────────────┐                │
                      │    Prize    │     ┌──────────┴──────────┐
                      ├─────────────┤     │  EventParticipant   │
                      │ id          │     ├─────────────────────┤
                      │ event_id    │     │ id                  │
                      │   (FK)      │     │ event_id (FK)       │
                      │ name        │     │ participant_id (FK) │
                      │ prize_type  │     │ created_at          │
                      │ value       │     │ updated_at          │
                      │ quantity    │     └──────────┬──────────┘
                      │ taxable     │                │
                      │ display_    │                │
                      │   fields    │                │
                      │ privacy_    │     ┌──────────┴──────────┐
                      │   settings  │     │        Winner       │
                      │ allow_      │     ├─────────────────────┤
                      │   repeat_   │     │ id                  │
                      │   win_      │◄────│ prize_id (FK)       │
                      │   override  │     │ event_participant_  │
                      │ scheduled_  │     │   id (FK)           │
                      │   at        │     │ drawn_at            │
                      │ drawn       │     │ distributed         │
                      │ drawn_at    │     │ distributed_at      │
                      │ drawn_by    │     │ distributed_by      │
                      │ position    │     │ notification_       │
                      │ created_at  │     │   requested         │
                      │ updated_at  │     │ created_at          │
                      └─────────────┘     │ updated_at          │
                                          └─────────────────────┘
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
- has_many :event_participants, dependent: :destroy
- has_many :participants, through: :event_participants
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
| privacy_settings | json | NOT NULL, DEFAULT: {} | 各欄位保密設定 |
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

# privacy_settings: 各欄位的保密設定（各欄位可獨立設定）
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

### 4. Participant (參與者) - 全域人員池

可參加抽獎的人員。**獨立於活動存在，可被加入多個活動。**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK, auto | 主鍵 |
| name | string | NOT NULL | 姓名 |
| employee_id | string | NULL, UNIQUE | 員工編號 |
| phone | string | NULL, UNIQUE | 手機 |
| email | string | NULL, UNIQUE | Email |
| created_at | datetime | NOT NULL | 建立時間 |
| updated_at | datetime | NOT NULL | 更新時間 |

**Indexes:**
- `employee_id` - UNIQUE (當不為 NULL 時)
- `phone` - UNIQUE (當不為 NULL 時)
- `email` - UNIQUE (當不為 NULL 時)

**Validations:**
- name: presence
- employee_id: uniqueness (allow_nil)
- phone: uniqueness (allow_nil), format
- email: uniqueness (allow_nil), format (email)

**Associations:**
- has_many :event_participants, dependent: :destroy
- has_many :events, through: :event_participants
- has_many :winners, through: :event_participants

**Note:** 參與者是全域資源，同一個人可以被加入多個不同活動。

---

### 5. EventParticipant (活動參與者關聯)

連結活動與參與者的關聯表。

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK, auto | 主鍵 |
| event_id | bigint | FK, NOT NULL, INDEX | 所屬活動 |
| participant_id | bigint | FK, NOT NULL, INDEX | 參與者 |
| created_at | datetime | NOT NULL | 建立時間 |
| updated_at | datetime | NOT NULL | 更新時間 |

**Indexes:**
- `(event_id, participant_id)` - UNIQUE

**Validations:**
- event_id: presence
- participant_id: presence
- uniqueness: { scope: [:event_id, :participant_id] }

**Associations:**
- belongs_to :event
- belongs_to :participant
- has_many :winners, dependent: :destroy

**Scopes:**
- `eligible_for(prize)` - 根據獎項設定過濾可抽選的參與者
- `not_won_in_event` - 尚未在該活動中獎的參與者

---

### 6. Winner (中獎記錄)

連結獎項與活動參與者的中獎記錄。

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK, auto | 主鍵 |
| prize_id | bigint | FK, NOT NULL, INDEX | 所屬獎項 |
| event_participant_id | bigint | FK, NOT NULL, INDEX | 活動參與者 |
| drawn_at | datetime | NOT NULL | 中獎時間 |
| distributed | boolean | NOT NULL, DEFAULT: false | 是否已發放 |
| distributed_at | datetime | NULL | 發放時間 |
| distributed_by | bigint | FK, NULL | 發放管理者 |
| notification_requested | boolean | NOT NULL, DEFAULT: false | 是否已請求通知 |
| created_at | datetime | NOT NULL | 建立時間 |
| updated_at | datetime | NOT NULL | 更新時間 |

**Indexes:**
- `(prize_id, event_participant_id)` - UNIQUE

**Validations:**
- prize_id: presence
- event_participant_id: presence
- uniqueness: { scope: [:prize_id, :event_participant_id] }

**Associations:**
- belongs_to :prize
- belongs_to :event_participant
- has_one :participant, through: :event_participant
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

  前台：顯示 404             前台：可正常存取
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
3. `create_participants` - 參與者表（全域，不依賴 events）
4. `create_event_participants` - 活動參與者關聯表 (depends on events, participants)
5. `create_prizes` - 獎項表 (depends on events, admins)
6. `create_winners` - 中獎記錄表 (depends on prizes, event_participants, admins)

---

## Indexes Summary

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| admins | email | UNIQUE | 登入查詢 |
| events | status | INDEX | 狀態過濾 |
| participants | employee_id | UNIQUE | 全域唯一識別 |
| participants | phone | UNIQUE | 全域唯一識別 |
| participants | email | UNIQUE | 全域唯一識別 |
| event_participants | event_id | INDEX | 活動參與者查詢 |
| event_participants | participant_id | INDEX | 參與者活動查詢 |
| event_participants | (event_id, participant_id) | UNIQUE | 防止重複加入 |
| prizes | event_id | INDEX | 活動獎項查詢 |
| prizes | (event_id, drawn) | INDEX | 未開獎項查詢 |
| winners | prize_id | INDEX | 獎項中獎者查詢 |
| winners | event_participant_id | INDEX | 參與者中獎查詢 |
| winners | (prize_id, event_participant_id) | UNIQUE | 防止重複中獎記錄 |

---

## Privacy Settings Detail

獎項的 `privacy_settings` 欄位支援各欄位獨立設定遮罩：

```ruby
# 範例：完整設定
{
  "name": true,     # 王傳華 → 王○華
  "phone": true,    # 0912345678 → 0912-XXX-678
  "email": true     # test@example.com → te***@example.com
}

# 範例：只遮罩姓名
{
  "name": true,
  "phone": false,
  "email": false
}

# 範例：無遮罩（完整顯示）
{}
```

遮罩規則：
- **姓名**: `姓 + ○ + 名最後一字`（如：陳○銘）
- **電話**: `前4碼 + -XXX- + 後3碼`（如：0912-XXX-678）
- **Email**: `前2字元 + *** + @domain`（如：te***@example.com）
