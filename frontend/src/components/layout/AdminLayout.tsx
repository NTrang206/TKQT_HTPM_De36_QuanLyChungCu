import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { FloatingAIChatbot } from '../ai/FloatingAIChatbot';

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f0f4f8] flex">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1720px] mx-auto">
          <Outlet />
        </main>

        {/* Global Floating AI Chatbot */}
        <FloatingAIChatbot />
      </div>
    </div>
  );
};
