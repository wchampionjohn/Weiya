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

## Summary

所有技術決策皆符合專案憲章的三大原則：

1. **簡單優先**: 使用 Rails 內建功能（ActionCable、Solid Queue、has_secure_password）
2. **測試驅動**: 所有 Service Object 可獨立測試
3. **程式碼品質**: 遵循 Rails 慣例、使用 Service Object 分離邏輯

無需進一步釐清，可進入 Phase 1 設計階段。
