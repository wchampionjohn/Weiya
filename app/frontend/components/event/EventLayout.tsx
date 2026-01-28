import React from 'react';
import { NavLink, useParams } from 'react-router-dom';

interface Event {
  id: number;
  name: string;
  event_date: string;
  status: string;
}

interface EventLayoutProps {
  event: Event;
  children: React.ReactNode;
}

export default function EventLayout({ event, children }: EventLayoutProps) {
  const { id } = useParams();
  const basePath = `/events/${id}`;

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 font-bold border-4 border-[#2C3E50] transition-all ${
      isActive
        ? 'bg-[#2C3E50] text-white shadow-none translate-x-1 translate-y-1'
        : 'bg-white text-[#2C3E50] shadow-[4px_4px_0px_0px_#2C3E50] hover:shadow-[2px_2px_0px_0px_#2C3E50] hover:translate-x-0.5 hover:translate-y-0.5'
    }`;

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <header className="bg-[#FF6B6B] border-b-4 border-[#2C3E50] p-6">
        <h1 className="text-3xl font-bold text-center text-[#2C3E50]">{event.name}</h1>
        <p className="text-center text-[#2C3E50] mt-2">
          {new Date(event.event_date).toISOString().slice(0, 10)}
        </p>

        <nav className="flex justify-center gap-4 mt-6">
          <NavLink to={`${basePath}/draw`} className={navLinkClass}>
            開獎頁
          </NavLink>
          <NavLink to={`${basePath}/results`} className={navLinkClass}>
            中獎紀錄
          </NavLink>
          <NavLink to={`${basePath}/login`} className={navLinkClass}>
            查詢我的結果
          </NavLink>
        </nav>
      </header>

      <main className="container mx-auto p-6">
        {children}
      </main>

      <footer className="border-t-4 border-[#2C3E50] p-4 text-center text-[#2C3E50]">
        <p className="font-bold">尾牙抽獎系統</p>
      </footer>
    </div>
  );
}
