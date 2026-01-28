# Research: 尾牙抽獎活動系統

**Date**: 2025-12-31
**Feature**: 001-lottery-event

## 1. 即時同步方案

### Decision: ActionCable (Rails 內建 WebSocket)

### Rationale
- Rails 8 內建，無需額外依賴
- 與 Rails 生態整合良好（認證、session）
- 適合 500 併發連線的規模
- 開發團隊熟悉度高

### Alternatives Considered
| 方案 | 優點 | 缺點 | 決定 |
|------|------|------|------|
| ActionCable | 內建、整合好 | 大規模需調優 | ✅ 採用 |
| Hotwire/Turbo Streams | 更簡單、少 JS | 動畫控制受限 | ❌ 前台需複雜動畫 |
| Socket.io | 生態豐富 | 需額外服務 | ❌ 增加複雜度 |
| Server-Sent Events | 簡單單向 | 無法雙向 | ❌ 需雙向互動 |

### Implementation Notes
- 使用 `DrawChannel` 廣播開獎結果
- 前台訂閱特定活動的 channel: `draw_${event_id}`
- 後台觸發開獎後透過 `ActionCable.server.broadcast` 推送

---

## 2. 公平隨機抽選演算法

### Decision: SecureRandom + Fisher-Yates Shuffle

### Rationale
- `SecureRandom` 提供密碼學安全的隨機數
- Fisher-Yates 確保公平的無偏差洗牌
- Ruby 標準庫，無需外部依賴

### Implementation Pattern
```ruby
# DrawService
def select_winners(eligible_participants, count)
  # 使用 SecureRandom 確保公平性
  shuffled = eligible_participants.shuffle(random: SecureRandom)
  shuffled.first(count)
end
```

### Alternatives Considered
| 方案 | 優點 | 缺點 | 決定 |
|------|------|------|------|
| SecureRandom + shuffle | 安全、簡單 | 無 | ✅ 採用 |
| Random.new | 可重現 | 非密碼學安全 | ❌ 抽獎需公平 |
| 外部抽獎 API | 可驗證 | 增加依賴 | ❌ 過度設計 |

---

## 3. 保密遮罩實作策略

### Decision: Server-side masking via Service Object

### Rationale
- 保密邏輯統一在後端處理，避免前端洩漏
- 使用 Service Object 符合憲章「Rails 慣例」
- 可針對不同欄位套用不同遮罩規則

### Implementation Pattern
```ruby
# PrivacyMaskService
class PrivacyMaskService
  def mask_name(name, enabled:)
    return name unless enabled
    return name if name.length < 2
    "#{name[0]}○#{name[-1]}"  # 陳家銘 → 陳○銘
  end

  def mask_phone(phone, enabled:)
    return phone unless enabled
    "#{phone[0..3]}-XXX-#{phone[-3..]}"  # 0912345678 → 0912-XXX-678
  end

  def mask_email(email, enabled:)
    return email unless enabled
    local, domain = email.split('@')
    "#{local[0..1]}***@#{domain}"  # test@example.com → te***@example.com
  end
end
```

---

## 4. 前後台架構分離策略

### Decision: 單一 Rails 應用 + API namespace + React SPA

### Rationale
- 符合現有專案結構 (`app/frontend/`)
- 後台 API 透過 `/api/v1/admin/*` namespace
- 前台 API 透過 `/api/v1/public/*` namespace
- 認證分離：後台用 session-based、前台用 simple token

### Route Structure
```ruby
namespace :api do
  namespace :v1 do
    # 後台 (需 admin 認證)
    namespace :admin do
      resources :events
      resources :prizes
      resources :participants
      post 'draws/:prize_id/execute', to: 'draws#execute'
      resources :winners, only: [:index, :update]
    end

    # 前台 (活動密碼或無認證)
    namespace :public do
      get 'events/:id', to: 'events#show'
      get 'events/:id/winners', to: 'winners#index'
      post 'events/:id/login', to: 'sessions#create'  # 參與者登入
    end
  end
end
```

---

## 5. 排程自動開獎

### Decision: Solid Queue (Rails 8 內建) + Recurring Jobs

### Rationale
- Rails 8 預設的背景任務系統
- 無需 Redis 依賴（使用 SQLite）
- 支援排程任務

### Implementation Pattern
```ruby
# ScheduledDrawJob
class ScheduledDrawJob < ApplicationJob
  queue_as :default

  def perform(prize_id)
    prize = Prize.find(prize_id)
    return if prize.drawn?

    DrawService.new(prize).execute
  end
end

# 設定排程 (在 Prize 儲存時)
prize.after_save do
  if scheduled_at_changed? && scheduled_at.present?
    ScheduledDrawJob.set(wait_until: scheduled_at).perform_later(id)
  end
end
```

### Alternatives Considered
| 方案 | 優點 | 缺點 | 決定 |
|------|------|------|------|
| Solid Queue | Rails 8 內建 | 較新 | ✅ 採用 |
| Sidekiq | 成熟穩定 | 需 Redis | ❌ 增加依賴 |
| Whenever (cron) | 簡單 | 不適合動態排程 | ❌ 需動態時間 |

---

## 6. 前台狀態管理

### Decision: React Context + useReducer

### Rationale
- 專案規模不需要 Redux
- 符合憲章「簡單優先」原則
- React 19 內建，無需額外依賴

### Implementation Pattern
```jsx
// DrawContext.jsx
const DrawContext = createContext();

function drawReducer(state, action) {
  switch (action.type) {
    case 'DRAW_STARTED':
      return { ...state, status: 'drawing', currentPrize: action.prize };
    case 'WINNER_ANNOUNCED':
      return {
        ...state,
        status: 'announced',
        winners: [...state.winners, action.winner]
      };
    default:
      return state;
  }
}

export function DrawProvider({ children, eventId }) {
  const [state, dispatch] = useReducer(drawReducer, initialState);

  // ActionCable subscription
  useEffect(() => {
    const subscription = consumer.subscriptions.create(
      { channel: 'DrawChannel', event_id: eventId },
      { received: (data) => dispatch(data) }
    );
    return () => subscription.unsubscribe();
  }, [eventId]);

  return (
    <DrawContext.Provider value={{ state, dispatch }}>
      {children}
    </DrawContext.Provider>
  );
}
```

---

## 7. 後台認證方案

### Decision: Rails has_secure_password + Session

### Rationale
- Rails 內建，簡單安全
- 符合憲章「簡單優先」原則
- 30 分鐘閒置自動登出透過 session timeout

### Implementation Pattern
```ruby
# Admin model
class Admin < ApplicationRecord
  has_secure_password
end

# SessionsController
class Api::V1::Admin::SessionsController < ApplicationController
  def create
    admin = Admin.find_by(email: params[:email])
    if admin&.authenticate(params[:password])
      session[:admin_id] = admin.id
      session[:last_activity] = Time.current
      render json: { admin: admin.as_json(only: [:id, :email]) }
    else
      render json: { error: 'Invalid credentials' }, status: :unauthorized
    end
  end
end

# ApplicationController (timeout check)
before_action :check_session_timeout

def check_session_timeout
  return unless session[:last_activity]
  if session[:last_activity] < 30.minutes.ago
    reset_session
    render json: { error: 'Session expired' }, status: :unauthorized
  else
    session[:last_activity] = Time.current
  end
end
```

---

## 8. 參與者匯入格式

### Decision: CSV with flexible column mapping

### Rationale
- CSV 是最通用的格式，管理者容易準備
- 支援彈性欄位對應，適應不同活動需求
- 使用 Ruby CSV 標準庫

### Implementation Pattern
```ruby
# ParticipantImportService
class ParticipantImportService
  def initialize(event, file)
    @event = event
    @file = file
    @required_fields = event.required_participant_fields
  end

  def import
    CSV.foreach(@file, headers: true) do |row|
      participant_attrs = {}
      @required_fields.each do |field|
        participant_attrs[field] = row[field] || row[field.to_s.titleize]
      end

      @event.participants.find_or_create_by!(
        unique_key_for(participant_attrs)
      ) do |p|
        p.assign_attributes(participant_attrs)
      end
    end
  end

  private

  def unique_key_for(attrs)
    @required_fields.to_h { |f| [f, attrs[f]] }
  end
end
```

---

## Summary (Phase 1)

所有技術決策皆符合專案憲章的三大原則：

1. **簡單優先**: 使用 Rails 內建功能（ActionCable、Solid Queue、has_secure_password）
2. **測試驅動**: 所有 Service Object 可獨立測試
3. **程式碼品質**: 遵循 Rails 慣例、使用 Service Object 分離邏輯

---

# Phase 2 Research

**Date**: 2026-01-02
**Feature**: 001-lottery-event (Phase 2)

## 9. 加碼獎項排序策略

### Decision: 插入式排序（最新開獎進度後）

### Rationale
- 加碼獎項自然接續開獎流程，符合活動進行邏輯
- 使用 `position` 欄位動態計算插入位置
- 前台即時更新透過 ActionCable 廣播新獎項

### Implementation Pattern
```ruby
# Prize model
def insert_after_latest_drawn
  latest_drawn = event.prizes.drawn.order(drawn_at: :desc).first
  if latest_drawn
    self.position = latest_drawn.position + 1
    # Shift subsequent undrawn prizes
    event.prizes.undrawn.where('position >= ?', self.position).update_all('position = position + 1')
  else
    self.position = event.prizes.maximum(:position).to_i + 1
  end
end
```

---

## 10. 年資計算機制

### Decision: 以活動日期為基準計算

### Rationale
- 同一場活動的年資判斷標準一致
- 避免開獎時間差異導致資格變動
- 儲存 `hire_date`，計算屬性 `seniority_years`

### Implementation Pattern
```ruby
# Participant model
def seniority_years_for(event)
  return nil unless hire_date
  ((event.event_date.to_date - hire_date) / 365.25).floor
end

# Prize eligibility_rules JSON
{
  "min_seniority_years": 3,
  "departments": ["Engineering", "Sales"]
}
```

---

## 11. 指定中獎人機制

### Decision: Prize 層級設定，DrawService 優先處理

### Rationale
- 指定中獎人是獎項屬性，設定在 Prize model
- DrawService 執行時優先檢查是否有指定中獎人
- Winner 記錄標記 `is_designated` 但對外不顯示

### Implementation Pattern
```ruby
# DrawService
def execute
  if prize.designated_participant_id.present?
    event_participant = EventParticipant.find_by!(
      event: prize.event,
      participant_id: prize.designated_participant_id
    )
    create_winner(event_participant, is_designated: true)
  else
    random_draw
  end
end
```

---

## 12. 批次發放機制

### Decision: Bulk update with individual timestamps

### Rationale
- 使用 ActiveRecord `update_all` 效能較好
- 但每筆記錄需要獨立的發放時間
- 使用 Transaction 確保資料一致性

### Implementation Pattern
```ruby
# WinnerBatchDistributeService
def distribute(winner_ids, admin)
  Winner.transaction do
    winners = Winner.where(id: winner_ids, distributed: false)
    winners.find_each do |winner|
      winner.update!(
        distributed: true,
        distributed_at: Time.current,
        distributed_by: admin.id
      )
    end
  end
end
```

---

## 13. 活動複製機制

### Decision: Deep copy with selective associations

### Rationale
- 複製活動設定、獎項設定（不含開獎記錄）
- 可選擇是否複製參與者關聯
- 新活動為草稿狀態

### Implementation Pattern
```ruby
# EventCopyService
def copy(source_event, options = {})
  new_event = source_event.dup
  new_event.name = "#{source_event.name} (複製)"
  new_event.status = :draft
  new_event.event_date = options[:event_date] || Date.tomorrow

  Event.transaction do
    new_event.save!

    # Copy prizes (without draw status)
    source_event.prizes.each do |prize|
      new_prize = prize.dup
      new_prize.event = new_event
      new_prize.drawn = false
      new_prize.drawn_at = nil
      new_prize.drawn_by = nil
      new_prize.save!
    end

    # Optionally copy participants
    if options[:copy_participants]
      source_event.event_participants.each do |ep|
        EventParticipant.create!(
          event: new_event,
          participant_id: ep.participant_id
        )
      end
    end
  end

  new_event
end
```

---

## 14. 通知模板變數替換

### Decision: Simple string interpolation with predefined variables

### Rationale
- 支援 `{name}`, `{prize}`, `{value}` 等變數
- 使用 Ruby 字串 gsub 替換
- 不使用複雜模板引擎（符合簡單優先原則）

### Implementation Pattern
```ruby
# NotificationTemplateService
ALLOWED_VARIABLES = %w[name prize value event_name].freeze

def render(template, winner)
  result = template.dup
  {
    'name' => winner.participant.name,
    'prize' => winner.prize.name,
    'value' => winner.prize.value.to_s,
    'event_name' => winner.prize.event.name
  }.each do |var, value|
    result.gsub!("{#{var}}", value)
  end
  result
end

def preview(template, sample_data = {})
  result = template.dup
  ALLOWED_VARIABLES.each do |var|
    result.gsub!("{#{var}}", sample_data[var] || "[#{var}]")
  end
  result
end
```

---

## 15. 資格條件篩選機制

### Decision: Composable scope chain

### Rationale
- 使用 Rails scope 組合篩選條件
- eligibility_rules JSON 儲存在 Prize
- DrawService 動態組合 scope

### Implementation Pattern
```ruby
# EventParticipant model
scope :with_min_seniority, ->(event, years) {
  joins(:participant)
    .where('participants.hire_date <= ?', event.event_date - years.years)
}

scope :in_departments, ->(departments) {
  joins(:participant)
    .where(participants: { department: departments })
}

scope :eligible_for, ->(prize) {
  scope = all
  rules = prize.eligibility_rules || {}

  if rules['min_seniority_years'].present?
    scope = scope.with_min_seniority(prize.event, rules['min_seniority_years'])
  end

  if rules['departments'].present?
    scope = scope.in_departments(rules['departments'])
  end

  scope
}
```

---

## Summary (Phase 2)

Phase 2 技術決策延續 Phase 1 原則：

1. **簡單優先**: 使用簡單字串替換（模板）、ActiveRecord scopes（篩選）
2. **測試驅動**: 新服務（EventCopyService、NotificationTemplateService）可獨立測試
3. **程式碼品質**: 遵循 Rails 慣例、Service Object 模式

所有 Phase 2 功能可基於現有架構實作，無需引入新依賴。
