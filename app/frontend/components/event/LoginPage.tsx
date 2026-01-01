import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEvent } from './EventApp';
import { publicApi } from '../../lib/api';

interface PersonalWin {
  id: number;
  prize_name: string;
  prize_value: number;
  drawn_at: string;
}

export default function LoginPage() {
  const { id } = useParams();
  const { event } = useEvent();
  const [formData, setFormData] = useState({
    employee_id: '',
    phone: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PersonalWin[] | null>(null);
  const [checked, setChecked] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // This would need a backend endpoint to search by participant info
      // For now, we'll show the UI structure
      const response = await publicApi.checkMyResults(event!.id, formData);
      setResults(response.data.wins || []);
      setChecked(true);
    } catch (err: any) {
      setError(err.response?.data?.error || '查詢失敗，請檢查輸入資料');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setChecked(false);
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <header className="bg-[#FF6B6B] border-b-4 border-[#2C3E50] p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link
            to={`/events/${id}/overview`}
            className="neo-button bg-white text-[#2C3E50] py-1 px-3 text-sm"
          >
            ← 活動總覽
          </Link>
          <h1 className="text-xl font-bold text-[#2C3E50]">{event?.name}</h1>
          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="max-w-md mx-auto">
          <div className="neo-card">
            <h2 className="text-2xl font-bold text-[#2C3E50] mb-6">🔍 查詢我的中獎結果</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-[#2C3E50] mb-1">員工編號</label>
                <input
                  type="text"
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleChange}
                  className="w-full p-3 border-4 border-[#2C3E50] bg-white font-bold focus:outline-none focus:ring-2 focus:ring-[#3498DB]"
                  placeholder="輸入員工編號"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2C3E50] mb-1">手機號碼（選填）</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-3 border-4 border-[#2C3E50] bg-white font-bold focus:outline-none focus:ring-2 focus:ring-[#3498DB]"
                  placeholder="輸入手機號碼"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2C3E50] mb-1">Email（選填）</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 border-4 border-[#2C3E50] bg-white font-bold focus:outline-none focus:ring-2 focus:ring-[#3498DB]"
                  placeholder="輸入 Email"
                />
              </div>

              {error && (
                <div className="bg-[#E74C3C] text-white p-3 border-4 border-[#2C3E50] font-bold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full neo-button bg-[#3498DB] text-white py-3"
              >
                {loading ? '查詢中...' : '查詢'}
              </button>
            </form>

            {checked && results !== null && (
              <div className="mt-6 pt-6 border-t-4 border-[#2C3E50]">
                {results.length > 0 ? (
                  <div>
                    <h3 className="text-xl font-bold text-[#27AE60] mb-4">
                      🎉 恭喜！您有 {results.length} 個中獎紀錄
                    </h3>
                    <div className="space-y-3">
                      {results.map(win => (
                        <div key={win.id} className="bg-[#2ECC71] border-4 border-[#2C3E50] p-4">
                          <div className="font-bold text-white text-lg">{win.prize_name}</div>
                          <div className="text-white">
                            獎值：NT$ {win.prize_value.toLocaleString()}
                          </div>
                          <div className="text-sm text-white opacity-80 mt-1">
                            中獎時間：{new Date(win.drawn_at).toLocaleString('zh-TW')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="text-4xl mb-4">😔</div>
                    <p className="text-xl font-bold text-[#2C3E50]">
                      目前尚無中獎紀錄
                    </p>
                    <p className="text-[#7F8C8D] mt-2">
                      請持續關注開獎活動！
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <Link
              to={`/events/${id}/live`}
              className="neo-card p-4 text-center hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              <div className="text-2xl mb-1">🎯</div>
              <div className="font-bold text-[#2C3E50]">開獎直播</div>
            </Link>
            <Link
              to={`/events/${id}/results`}
              className="neo-card p-4 text-center hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              <div className="text-2xl mb-1">🏆</div>
              <div className="font-bold text-[#2C3E50]">中獎名單</div>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-[#2C3E50] p-4 text-center text-[#2C3E50] mt-8">
        <p className="font-bold">尾牙抽獎系統</p>
      </footer>
    </div>
  );
}
