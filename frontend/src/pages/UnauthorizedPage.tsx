import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Home, LogIn } from 'lucide-react';


export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-6 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">403</h1>
        <h2 className="text-lg font-bold text-slate-800 mb-3">Không Đủ Quyền Truy Cập</h2>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          Tài khoản hiện tại của bạn không có quyền hạn để truy cập vào phân hệ này. Vui lòng chuyển vai trò phù hợp hoặc đăng nhập lại.
        </p>



        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/login')}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>Đăng Nhập</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/30 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Trang Chủ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
