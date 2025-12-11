import React, { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="max-w-4xl mx-auto p-10">
      <h1 className="text-4xl font-bold text-indigo-500">
        Rails + Vite + React + Tailwind
      </h1>

      <div className="mt-8 p-6 bg-gray-100 rounded-lg">
        <h2 className="text-2xl font-semibold mb-2">歡迎來到你的開發環境！</h2>
        <p className="text-gray-700">這是一個使用 Vite、React 和 Tailwind CSS 的 Rails 應用程式。</p>

        <div className="mt-6">
          <button
            onClick={() => setCount(count + 1)}
            className="px-6 py-3 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
          >
            點擊次數: {count}
          </button>
        </div>

        <div className="mt-8 text-sm text-gray-600 space-y-1">
          <p>✅ Vite HMR (熱模組替換) 已啟用</p>
          <p>✅ React Fast Refresh 已啟用</p>
          <p>✅ Tailwind CSS 已設定完成</p>
          <p>✅ 修改這個檔案試試看，頁面會即時更新！</p>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">專案結構：</h3>
        <pre className="bg-gray-900 text-gray-300 p-4 rounded overflow-auto text-sm">
{`app/
├── frontend/              # Vite frontend code
│   ├── entrypoints/      # Entry points
│   │   ├── application.jsx
│   │   └── application.css
│   └── components/       # React components
│       └── App.jsx
└── views/                # Rails views
    └── home/
        └── index.html.erb`}
        </pre>
      </div>
    </div>
  );
}

export default App;
