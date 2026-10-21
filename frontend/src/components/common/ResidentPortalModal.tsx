import React from 'react';
import { 
  Home, FileText, QrCode, Wrench, Users, ShieldCheck, 
  ArrowRight, X, LogIn, Sparkles, CheckCircle2 
} from 'lucide-react';

interface ResidentPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterPortalAsTenant: () => void;
  onGoToLogin: () => void;
}

export const ResidentPortalModal: React.FC<ResidentPortalModalProps> = ({
  isOpen,
  onClose,
  onEnterPortalAsTenant,
  onGoToLogin,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-brand-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-brand-300">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold">Cổng Dịch Vụ Cư Dân</h3>
                <span className="px-2 py-0.5 bg-brand-500/20 text-brand-200 border border-brand-400/30 text-[10px] font-bold rounded-full">
                  Resident Portal
                </span>
              </div>
              <p className="text-xs text-brand-200/80 mt-0.5">
                Khu vực chuyên biệt dành riêng cho cư dân đang sinh sống tại Dwell Living
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="bg-brand-50/70 border border-brand-200/80 rounded-xl p-3.5 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div className="text-xs text-brand-950">
              <div className="font-bold">Trải nghiệm số hóa toàn diện cho cư dân:</div>
              <div className="text-brand-800 mt-0.5 leading-relaxed">
                Tất cả thủ tục từ hợp đồng, hóa đơn điện nước, báo sự cố kỹ thuật đến thông tin tạm trú đều được xử lý 100% trực tuyến.
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Các tính năng nổi bật:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Hợp Đồng & Ký Số AI</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Tra cứu điều khoản, gia hạn hợp đồng trực tuyến</div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Thanh Toán VietQR</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Tự động gạch nợ hóa đơn dịch vụ sau 3 giây</div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Báo Hỏng & Sửa Chữa</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Tiếp nhận sự cố 24/7, kỹ thuật có mặt trong 24h</div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Người Ở Cùng & Tạm Trú</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Khai báo thành viên, hỗ trợ đăng ký VNeID</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 shrink-0">
          <button
            onClick={() => {
              onClose();
              onGoToLogin();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5 text-slate-500" />
            <span>Đăng nhập tài khoản</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onEnterPortalAsTenant();
            }}
            className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <span>Trải Nghiệm Cổng Cư Dân Ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
