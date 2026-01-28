# 尾牙抽獎系統 (Weiya)

公司尾牙、年會活動的抽獎系統，支援多種抽獎情境與彈性設定。

## 畫面截圖

<!-- 後續補上截圖 -->

| 後台管理介面 | 開獎直播畫面 |
|:---:|:---:|
| ![後台管理介面](screenshots/admin-dashboard.png) | ![開獎直播畫面](screenshots/live-draw.png) |

| 中獎結果顯示 | 參與者登入 |
|:---:|:---:|
| ![中獎結果顯示](screenshots/winner-display.png) | ![參與者登入](screenshots/participant-login.png) |

## 專案簡介

這是一個 Side Project，用於解決尾牙抽獎活動中的各種實際需求。

### 主要功能

- **多種抽獎邏輯** - 隨機抽獎、指定中獎人、資格條件篩選（年資、部門）
- **年資條件** - 依入職日期計算年資，可設定「滿 N 年才可參與」
- **部門條件** - 針對特定部門設定專屬獎項
- **即時開獎** - 透過 WebSocket 同步開獎結果至所有觀眾
- **通知功能** - 支援通知模板設定，預留簡訊與 Email 通知介面
- **快速建立** - 從過去活動複製設定、批次匯入參與者

### 適用情境

- 公司尾牙抽獎
- 年會摸彩活動
- 部門聚餐抽獎
- 春酒活動

## 功能說明

### 獎項管理

- 一場活動可設定多個獎項，各自獨立開獎
- 支援現金獎（自動標記需課稅）與禮品獎
- 每個獎項可設定多位中獎者
- 活動進行中可新增加碼獎項
- 可設定每個獎項的預計開獎時間，前台顯示時程表

### 參與者管理

- 支援 CSV 批次匯入參與者名單
- 參與者可被加入多個活動，無需重複建立
- 姓名、員工編號、手機、Email 可依活動需求設定必填項
- 輸入入職日期，系統自動計算年資
- 記錄參與者所屬部門，供資格條件篩選

### 抽獎機制

- 隨機抽選中獎者
- 可預先指定中獎人（外觀與隨機抽選無異）
- 可設定年資門檻或部門限制
- 活動層級設定是否允許重複中獎，個別獎項可覆蓋
- 已開獎的獎項無法再次開獎

### 隱私保護

中獎者資訊顯示支援遮罩設定：

| 欄位 | 遮罩效果 |
|------|----------|
| 姓名 | 陳○銘 |
| 電話 | 0912-XXX-456 |
| Email | ab***@company.com |

每個欄位可獨立設定是否啟用遮罩。

### 前台展示

- 開獎結果透過 WebSocket 即時推送
- 可設定進入密碼，限制觀看人員
- 參與者可登入查看個人中獎狀態
- 顯示各獎項預計開獎時間

### 發放管理

- 記錄每個獎項的發放狀態
- 支援批次標記已發放
- 記錄發放時間與操作人員

## 技術架構

### 後端

| 技術 | 版本 | 說明 |
|------|------|------|
| Ruby | 3.4.1 | 程式語言 |
| Rails | 8.0.2.1 | Web 框架 |
| PostgreSQL | - | 資料庫（正式環境） |
| SQLite | 3 | 資料庫（開發環境） |
| ActionCable | - | WebSocket 即時通訊 |
| Puma | 5.0+ | Web 伺服器 |

### 前端

| 技術 | 版本 | 說明 |
|------|------|------|
| React | 19.x | UI 框架 |
| TypeScript | - | 型別系統 |
| Vite | 5.x | 建置工具 |
| Tailwind CSS | 3.x | CSS 框架 |
| vite_rails | 3.0.19 | Rails + Vite 整合 |

## 快速開始

### 環境需求

- Ruby 3.4.0+
- Node.js 18.0+
- PostgreSQL 12+（正式環境）
- Bundler 2.0+

### 安裝步驟

```bash
# 1. 複製專案
git clone <repository-url>
cd Weiya

# 2. 安裝依賴
bundle install
npm install

# 3. 設定資料庫
rails db:create
rails db:migrate
rails db:seed  # 建立預設管理者帳號

# 4. 啟動開發伺服器
./bin/dev
```

開啟瀏覽器訪問 http://localhost:3000

### 預設帳號

| 角色 | 帳號 | 密碼 |
|------|------|------|
| 管理者 | admin | password |

## 專案結構

```
Weiya/
├── app/
│   ├── frontend/              # 前端程式碼 (Vite)
│   │   ├── entrypoints/       # Vite 進入點
│   │   └── components/        # React 元件
│   │       ├── admin/         # 後台管理元件
│   │       ├── event/         # 前台活動元件
│   │       └── public/        # 公開頁面元件
│   ├── controllers/           # Rails 控制器
│   │   └── api/v1/            # API 端點
│   ├── models/                # Rails 模型
│   ├── services/              # 服務物件
│   ├── channels/              # ActionCable 頻道
│   └── views/                 # Rails 視圖 (Jbuilder)
├── config/
│   ├── routes.rb              # 路由設定
│   └── vite.json              # Vite 設定
├── db/
│   ├── migrate/               # 資料庫遷移
│   └── schema.rb              # 資料庫結構
└── specs/                     # 功能規格文件
```

## 常用指令

```bash
# 啟動開發伺服器（Rails + Vite）
./bin/dev

# 執行測試
bundle exec rspec

# Rails 控制台
rails console

# 查看路由
rails routes

# 資料庫操作
rails db:migrate        # 執行遷移
rails db:rollback       # 回滾遷移
rails db:reset          # 重設資料庫
```

## 路由結構

### 後台 (Admin)

```
/admin                    → 後台首頁（活動列表）
/admin/events/:id         → 活動詳情
/admin/events/:id/prizes  → 獎項管理
/admin/events/:id/draw    → 開獎控制台
```

### 前台 (Public)

```
/events/:id               → 活動首頁
/events/:id/live          → 開獎直播頁
/events/:id/login         → 參與者登入
/events/:id/results       → 中獎記錄
```

