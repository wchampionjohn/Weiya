# Claude AI Guidelines

## Communication

- 使用繁體中文回答

## Research & Documentation

- 搜尋文件或查找資料時，使用 Context7 或 @agent-documentation-researcher
- 確保資訊來源準確且最新

## Tech Stack

**Backend:**
- Rails 8.0.2.1 (Ruby 3.4.1)
- PostgreSQL
- Puma

**Frontend:**
- React 19.x
- Vite 5.x (via vite_rails)
- Tailwind CSS 3.x
- Node.js 18.20.0

## Project Structure

```
app/
├── frontend/           # Frontend code (Vite)
│   ├── entrypoints/    # Vite entry points
│   └── components/     # React components
├── controllers/        # Rails controllers
├── models/             # Rails models
└── views/              # Rails views
```

## Code Style

- 不要過度設計
- 保持簡單直接
- 優先使用簡單解決方案
- 避免過早優化

## Comments

- 使用英文註解
- 不要寫過度解釋的註解
- 只在必要時註解
- 解釋「為什麼」而非「做什麼」

## Active Technologies
- Ruby 3.4.1 / Rails 8.0.2.1 (Backend), TypeScript / React 19.x (Frontend) + Rails (API mode), React 19, Vite 5, Tailwind CSS 3, ActionCable (WebSocket) (001-lottery-event)
- SQLite 3 (001-lottery-event)
- PostgreSQL (production), SQLite (development/test) (001-lottery-event)
- SQLite 3 (development/production) (001-lottery-event)

## Recent Changes
- 001-lottery-event: Added Ruby 3.4.1 / Rails 8.0.2.1 (Backend), TypeScript / React 19.x (Frontend) + Rails (API mode), React 19, Vite 5, Tailwind CSS 3, ActionCable (WebSocket)
