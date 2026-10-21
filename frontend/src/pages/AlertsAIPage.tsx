import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Bell,
  AlertTriangle,
  Clock,
  Send,
  MessageSquare,
  Smartphone,
  Mail,
  CheckCircle2,
  Filter,
  Download,
  Shield,
  Settings,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { AIDunningDrawer } from '../components/ai/AIDunningDrawer';
import {
  useGetSystemAlertsQuery,
  useTriggerSystemScanMutation,
} from '../modules/alerts_ai/services/alertApi';
import { ISystemAlert } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useToast } from '../hooks/useToast';

export const AlertsAIPage: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'OVERDUE' | 'EXPIRING'>('ALL');
  const [activeAlertDrawer, setActiveAlertDrawer] = useState<ISystemAlert | null>(null);

  const { data: alerts = [], isLoading } = useGetSystemAlertsQuery({});
  const [triggerScan, { isLoading: isScanning }] = useTriggerSystemScanMutation();
  const toast = useToast();

  const handleScan = async () => {
    try {
      const res = await triggerScan().unwrap();
      toast.success(
        'Đã quét toàn diện hệ thống',
        `Hoàn tất quét ${res.scannedItemsCount} hồ sơ hợp đồng & công nợ. Phát hiện ${res.newAlertsCount} cảnh báo mới!`
      );
    } catch {
      toast.error('Lỗi', 'Không thể kích hoạt quét tự động');
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (selectedFilter === 'OVERDUE') return a.alertType === 'OVERDUE_DEBT';
    if (selectedFilter === 'EXPIRING') return a.alertType === 'EXPIRED_CONTRACT';
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="text-xs font-semibold text-brand-600 mb-0.5">
            Phân tích rủi ro & cảnh báo
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Cảnh Báo Rủi Ro & Đôn Đốc Nợ
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Hệ thống AI tự động quét rủi ro hợp đồng sắp hết hạn và sinh mẫu đôn đốc công nợ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={() => toast.info('Xuất báo cáo', 'Đang kết xuất danh sách công nợ đôn đốc PDF...')}
          >
            Xuất Báo Cáo
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Zap className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />}
            isLoading={isScanning}
            onClick={handleScan}
          >
            Kích Hoạt Quét
          </Button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Cảnh báo cần xử lý</div>
            <div className="text-xl sm:text-2xl font-bold text-rose-600 mt-1">
              12 <span className="text-xs font-normal text-slate-400">cảnh báo</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="text-rose-600 font-semibold">4 Khẩn cấp</span>
              <span>•</span>
              <span className="text-amber-600 font-medium">5 Vừa</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Nợ đọng quá hạn</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">48.25 Tr</div>
            <div className="text-[11px] text-amber-600 font-medium mt-1">
              5 căn hộ quá hạn &gt; 5 ngày
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Sắp hết hạn (≤ 30 ngày)</div>
            <div className="text-xl sm:text-2xl font-bold text-purple-600 mt-1">
              04 <span className="text-xs font-normal text-slate-400">hợp đồng</span>
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-1">
              Kích hoạt quy trình SQ03
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Phản hồi sau đôn đốc</div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">89.4%</div>
            <div className="text-[11px] text-slate-400 mt-1">
              95% nộp tiền trong 24h
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSelectedFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedFilter === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Tất cả ({alerts.length})
        </button>
        <button
          onClick={() => setSelectedFilter('OVERDUE')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedFilter === 'OVERDUE'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Quá hạn tiền thuê (SQ05)
        </button>
        <button
          onClick={() => setSelectedFilter('EXPIRING')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedFilter === 'EXPIRING'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Sắp hết hạn HĐ (SQ03)
        </button>
      </div>

      {/* Alerts Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover:shadow-soft-lg transition-all duration-200 space-y-4"
          >
            {/* Header info */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-slate-900">Căn {alert.roomNumber}</span>
                  <span className="text-xs text-slate-500">• {alert.buildingName}</span>
                </div>
                <div className="text-xs font-semibold text-slate-700 mt-0.5">
                  Khách thuê: <strong>{alert.targetName}</strong> ({alert.targetPhone})
                </div>
              </div>

              <div className="text-right">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-full">
                  Mức độ: {alert.priority === 'HIGH' ? 'Cao (Khẩn)' : 'Vừa'}
                </span>
                <div className="text-[10px] font-mono text-slate-400 mt-1">#{alert.alertCode}</div>
              </div>
            </div>

            {/* Alert Specific Content Box */}
            {alert.alertType === 'OVERDUE_DEBT' && (
              <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-3 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-rose-900">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>NỢ PHÍ QUÁ HẠN {alert.daysOverdue} NGÀY (SQ05)</span>
                  </span>
                  <span className="text-sm font-black text-rose-700">{formatCurrency(alert.amountDue)}</span>
                </div>
                <div className="text-slate-600 text-[11px]">
                  Phạt chậm 0.05%/ngày • Kèm mã VietQR Napas đối soát tự động
                </div>
              </div>
            )}

            {alert.alertType === 'EXPIRED_CONTRACT' && (
              <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-3 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-purple-900">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span>HỢP ĐỒNG SẮP HẾT HẠN (SQ03)</span>
                  </span>
                  <span className="text-xs font-bold text-purple-700">Còn {alert.daysUntilExpiry} ngày</span>
                </div>
                <div className="text-slate-600 text-[11px]">
                  Cần kích hoạt đôn đốc phương án tái ký hoặc hẹn lịch nghiệm thu bàn giao.
                </div>
              </div>
            )}

            {alert.alertType === 'MAINTENANCE_ANOMALY' && (
              <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-amber-900">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span>CẢNH BÁO TIÊU THỤ NƯỚC TĂNG ĐỘT BIẾN +300%</span>
                  </span>
                </div>
                <div className="text-slate-600 text-[11px]">
                  IoT Sensor ghi nhận 28.4 m³ (kỳ trước 7.1 m³). Nghi rò rỉ van cấp nước bồn cầu.
                </div>
              </div>
            )}

            {/* AI Draft Snippet */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 text-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="font-bold flex items-center gap-1 text-slate-700">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  <span>Dự thảo tin nhắn AI (Tone: {alert.aiDraftContent.tone})</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">99.2% Chuẩn ngữ nghĩa</span>
              </div>
              <p className="text-slate-600 line-clamp-2 italic text-[11px] leading-relaxed">
                "{alert.aiDraftContent.body}"
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                {alert.isSent ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã phát lệnh ({alert.sentChannels.join(', ')})
                  </span>
                ) : (
                  <span>Chưa gửi thông báo</span>
                )}
              </div>

              <Button
                variant="ai"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => setActiveAlertDrawer(alert)}
              >
                Mở AI Dunning Studio
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600" />
            <span>Nhật Ký Quét & Đôn Đốc Đa Kênh Tự Động (Gần Đây)</span>
          </h4>
          <span className="text-xs text-emerald-600 font-semibold">Real-time telemetry</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-2.5">Thời Gian</th>
                <th className="px-4 py-2.5">Mã Căn / Cư Dân</th>
                <th className="px-4 py-2.5">Loại Cảnh Báo</th>
                <th className="px-4 py-2.5">Kênh Gửi</th>
                <th className="px-4 py-2.5">Trạng Thái</th>
                <th className="px-4 py-2.5 text-right">Phản Hồi / Đã Thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/80">
                <td className="px-4 py-3 text-slate-500">Hôm nay 09:14</td>
                <td className="px-4 py-3 font-bold text-slate-900">Căn P.508 – Trần Thảo Linh</td>
                <td className="px-4 py-3">
                  <span className="text-rose-600 font-semibold">Nợ phí quá hạn (SQ05)</span>
                </td>
                <td className="px-4 py-3 text-slate-600">Zalo ZNS + App Push</td>
                <td className="px-4 py-3">
                  <span className="text-emerald-600 font-bold">✓ Đã đọc & Quét QR</span>
                </td>
                <td className="px-4 py-3 text-right font-black text-emerald-600">
                  Đã thu: 8.200.000 ₫
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="px-4 py-3 text-slate-500">Hôm nay 08:02</td>
                <td className="px-4 py-3 font-bold text-slate-900">Căn P.201 – Nguyễn Hải Đăng</td>
                <td className="px-4 py-3">
                  <span className="text-purple-600 font-semibold">Hết hạn HĐ trong 20 ngày (SQ03)</span>
                </td>
                <td className="px-4 py-3 text-slate-600">Email + SMS Brand</td>
                <td className="px-4 py-3">
                  <span className="text-blue-600 font-semibold">✉ Đã mở Email</span>
                </td>
                <td className="px-4 py-3 text-right text-slate-500">Đã đặt lịch hẹn tư vấn</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Dunning Drawer Studio */}
      {activeAlertDrawer && (
        <AIDunningDrawer
          isOpen={!!activeAlertDrawer}
          onClose={() => setActiveAlertDrawer(null)}
          alert={activeAlertDrawer}
        />
      )}
    </div>
  );
};
