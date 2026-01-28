# WebSocket Contract: ActionCable DrawChannel

## Channel Name

`DrawChannel`

## Subscription

### Parameters

```json
{
  "channel": "DrawChannel",
  "event_id": 123
}
```

### Authentication

- 無需認證即可訂閱（公開觀看）
- 若活動有密碼，需在訂閱前通過 `/api/v1/public/events/{id}/verify` 驗證

## Server → Client Messages

### 1. draw_started

開獎開始時廣播。

```json
{
  "type": "draw_started",
  "data": {
    "prize_id": 1,
    "prize_name": "頭獎 iPhone 15",
    "prize_type": "gift",
    "value": 35900,
    "quantity": 1,
    "timestamp": "2025-12-31T19:30:00Z"
  }
}
```

### 2. winner_announced

每位中獎者產生時廣播。

```json
{
  "type": "winner_announced",
  "data": {
    "prize_id": 1,
    "winner": {
      "id": 42,
      "display": {
        "name": "陳○銘",
        "phone": "0912-XXX-678"
      },
      "drawn_at": "2025-12-31T19:30:05Z"
    },
    "remaining": 0
  }
}
```

**Notes:**
- `display` 欄位已依獎項的保密設定進行遮罩處理
- `remaining` 表示該獎項剩餘未開出的名額

### 3. draw_completed

單一獎項開獎完成時廣播。

```json
{
  "type": "draw_completed",
  "data": {
    "prize_id": 1,
    "prize_name": "頭獎 iPhone 15",
    "winners_count": 1,
    "timestamp": "2025-12-31T19:30:10Z"
  }
}
```

### 4. event_completed

所有獎項開獎完成時廣播。

```json
{
  "type": "event_completed",
  "data": {
    "event_id": 123,
    "total_prizes": 10,
    "total_winners": 25,
    "timestamp": "2025-12-31T20:00:00Z"
  }
}
```

### 5. prize_added

活動進行中新增獎項時廣播（加碼獎）。

```json
{
  "type": "prize_added",
  "data": {
    "prize_id": 11,
    "prize_name": "加碼獎 禮券 $1000",
    "prize_type": "gift",
    "value": 1000,
    "quantity": 5,
    "position": 11,
    "timestamp": "2025-12-31T19:45:00Z"
  }
}
```

## Client → Server Messages

### 1. ping

保持連線活躍。

```json
{
  "command": "message",
  "identifier": "{\"channel\":\"DrawChannel\",\"event_id\":123}",
  "data": "{\"action\":\"ping\"}"
}
```

## Error Handling

### Connection Errors

| Error | Description | Client Action |
|-------|-------------|---------------|
| `event_not_found` | 活動不存在 | 顯示錯誤訊息 |
| `event_not_active` | 活動未發布 | 顯示等待訊息 |
| `unauthorized` | 需要密碼驗證 | 導向密碼輸入頁 |

### Reconnection Strategy

1. 斷線後自動重連（指數退避：1s, 2s, 4s, 8s, max 30s）
2. 重連成功後請求 `/api/v1/public/events/{id}` 同步最新狀態
3. 比對 `last_updated` 時間戳補齊遺漏的更新

## Implementation Example (Frontend)

```javascript
// React Hook
function useDrawChannel(eventId) {
  const [state, dispatch] = useReducer(drawReducer, initialState);

  useEffect(() => {
    const subscription = consumer.subscriptions.create(
      { channel: 'DrawChannel', event_id: eventId },
      {
        received(data) {
          switch (data.type) {
            case 'draw_started':
              dispatch({ type: 'DRAW_STARTED', payload: data.data });
              break;
            case 'winner_announced':
              dispatch({ type: 'WINNER_ANNOUNCED', payload: data.data });
              break;
            case 'draw_completed':
              dispatch({ type: 'DRAW_COMPLETED', payload: data.data });
              break;
            case 'event_completed':
              dispatch({ type: 'EVENT_COMPLETED', payload: data.data });
              break;
            case 'prize_added':
              dispatch({ type: 'PRIZE_ADDED', payload: data.data });
              break;
          }
        },
        disconnected() {
          dispatch({ type: 'DISCONNECTED' });
        },
        connected() {
          dispatch({ type: 'CONNECTED' });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [eventId]);

  return state;
}
```

## Implementation Example (Backend)

```ruby
# app/channels/draw_channel.rb
class DrawChannel < ApplicationCable::Channel
  def subscribed
    @event = Event.find(params[:event_id])

    if @event.active? || @event.completed?
      stream_from "draw_#{@event.id}"
    else
      reject
    end
  rescue ActiveRecord::RecordNotFound
    reject
  end

  def unsubscribed
    stop_all_streams
  end
end

# Broadcasting from DrawService
class DrawService
  def execute
    broadcast_draw_started
    winners = select_winners
    winners.each { |w| broadcast_winner_announced(w) }
    broadcast_draw_completed
    check_event_completion
  end

  private

  def broadcast_draw_started
    ActionCable.server.broadcast(
      "draw_#{@prize.event_id}",
      {
        type: 'draw_started',
        data: {
          prize_id: @prize.id,
          prize_name: @prize.name,
          prize_type: @prize.prize_type,
          value: @prize.value,
          quantity: @prize.quantity,
          timestamp: Time.current.iso8601
        }
      }
    )
  end
end
```
