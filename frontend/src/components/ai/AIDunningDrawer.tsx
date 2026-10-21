import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  CheckCircle2,
  Copy,
  RefreshCw,
  QrCode,
  Shield,
  MessageSquare,
  Mail,
  Smartphone,
  Bell,
  Clock,
} from 'lucide-react';
import { Button } from '../common/Button';
import { ISystemAlert } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import {
  useRegenerateAIDraftMutation,
  useDispatchAlertChannelsMutation,
} from '../../modules/alerts_ai/services/alertApi';
import { useToast } from '../../hooks/useToast';

interface AIDunningDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alert: ISystemAlert;
}

export const AIDunningDrawer: React.FC<AIDunningDrawerProps> = ({
  isOpen,
  onClose,
  alert,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<
    'FRIENDLY_REMINDER' | 'OVERDUE_WITH_PENALTY' | 'CONTRACT_RENEWAL' | 'SERVICE_SUSPENSION_WARNING'
  >(alert.aiDraftContent.scenario || 'OVERDUE_WITH_PENALTY');

  const [selectedTone, setSelectedTone] = useState<'EMPATHETIC' | 'STRICT' | 'CONCISE_SMS'>(
    alert.aiDraftContent.tone || 'EMPATHETIC'
  );

  const [selectedChannels, setSelectedChannels] = useState<('ZALO' | 'SMS' | 'EMAIL' | 'APP_PUSH')[]>([
    'ZALO',
    'APP_PUSH',
  ]);

  const [editableBody, setEditableBody] = useState(alert.aiDraftContent.body);

  const [regenerateAIDraft, { isLoading: isRegenerating }] = useRegenerateAIDraftMutation();
  const [dispatchAlertChannels, { isLoading: isDispatching }] = useDispatchAlertChannelsMutation();
  const toast = useToast();

  if (!isOpen) return null;

  const handleToneChange = async (newTone: 'EMPATHETIC' | 'STRICT' | 'CONCISE_SMS') => {
    setSelectedTone(newTone);
    try {
      const res = await regenerateAIDraft({
        alertId: alert.id,
        promptOptions: {
          customerName: alert.targetName,
          roomNumber: alert.roomNumber,
          buildingName: alert.buildingName,
          amountDue: alert.amountDue,
          daysOverdue: alert.daysOverdue,
          daysUntilExpiry: alert.daysUntilExpiry,
          scenario: selectedScenario,
          tone: newTone,
        },
      }).unwrap();
      setEditableBody(res.aiDraftContent.body);
      toast.info('AI đã cập nhật', `Đã chuyển đổi văn phong: ${newTone === 'STRICT' ? 'Nghiêm nghị' : newTone === 'CONCISE_SMS' ? 'SMS Ngắn gọn' : 'Nhẹ nhàng & Chia sẻ'}`);
    } catch {
      toast.error('Lỗi', 'Không thể sinh lại nội dung lúc này');
    }
  };

  const handleScenarioChange = async (
    newScenario: 'FRIENDLY_REMINDER' | 'OVERDUE_WITH_PENALTY' | 'CONTRACT_RENEWAL' | 'SERVICE_SUSPENSION_WARNING'
  ) => {
    setSelectedScenario(newScenario);
    try {
      const res = await regenerateAIDraft({
        alertId: alert.id,
        promptOptions: {
          customerName: alert.targetName,
          roomNumber: alert.roomNumber,
          buildingName: alert.buildingName,
          amountDue: alert.amountDue,
          daysOverdue: alert.daysOverdue,
          daysUntilExpiry: alert.daysUntilExpiry,
          scenario: newScenario,
          tone: selectedTone,
        },
      }).unwrap();
      setEditableBody(res.aiDraftContent.body);
    } catch {
      toast.error('Lỗi', 'Không thể đổi kịch bản lúc này');
    }
  };

  const toggleChannel = (channel: 'ZALO' | 'SMS' | 'EMAIL' | 'APP_PUSH') => {
    if (selectedChannels.includes(channel)) {
      if (selectedChannels.length > 1) {
        setSelectedChannels(selectedChannels.filter((c) => c !== channel));
      }
    } else {
      setSelectedChannels([...selectedChannels, channel]);
    }
  };

  const handleDispatch = async () => {
    try {
      await dispatchAlertChannels({
        alertId: alert.id,
        channels: selectedChannels,
        editedBody: editableBody,
      }).unwrap();
      toast.success(
        'Phát lệnh thành công',
        `Thông báo đôn đốc đã được gửi tới ${alert.targetName} qua ${selectedChannels.join(', ')}!`
      );
      onClose();
    } catch {
      toast.error('Thất bại', 'Không thể gửi thông báo lúc này');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl z-10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-500 flex items-center justify-center text-white shadow-soft">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">AI Smart Notification Assistant</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                  UC005 Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Mô hình fine-tuned CRM-LLM chuyên biệt cho thu hồi công nợ & CSKH
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-slate-50/50">
          {/* Tenant Context Banner */}
          <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-3.5 flex items-start gap-3">
            <Shield className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 leading-relaxed">
              <strong>Phân tích hồ sơ cư dân {alert.roomNumber}:</strong> Khách{' '}
              <strong className="text-brand-900">{alert.targetName}</strong> ({alert.targetPhone}).
              {alert.amountDue && (
                <> Dư nợ: <strong className="text-rose-700">{formatCurrency(alert.amountDue)}</strong>.</>
              )}{' '}
              Hệ thống đề xuất áp dụng tone giọng <em>Lịch thiệp & Thấu cảm (Empathetic Professional)</em> để giữ trải nghiệm khách hàng cao cấp nhưng vẫn đảm bảo thu nợ đúng hạn.
            </div>
          </div>

          {/* 1. Scenario Templates */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Lựa chọn kịch bản đôn đốc (Scenario Template)
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'FRIENDLY_REMINDER', label: 'Nhắc phí kỳ 1 (Thân thiện)', badge: '0 ngày' },
                { id: 'OVERDUE_WITH_PENALTY', label: 'Quá hạn đợt 2 (Kèm chế tài)', badge: '+5 ngày' },
                { id: 'CONTRACT_RENEWAL', label: 'Đề xuất gia hạn HĐ ưu đãi (SQ03)', badge: '30 ngày' },
                { id: 'SERVICE_SUSPENSION_WARNING', label: 'Cảnh báo tạm ngưng dịch vụ', badge: '+10 ngày' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleScenarioChange(item.id as any)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs text-left transition-all ${
                    selectedScenario === item.id
                      ? 'bg-brand-50 border-brand-500 text-brand-900 font-semibold shadow-xs ring-1 ring-brand-500'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="line-clamp-1">{item.label}</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 rounded text-slate-600">
                    {item.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Omnichannel Routing */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              2. Kênh phát hành đa kênh (Omnichannel Routing)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'ZALO', label: 'Zalo ZNS', sub: 'Official OA', icon: <MessageSquare className="w-4 h-4 text-blue-600" /> },
                { id: 'SMS', label: 'SMS Brand', sub: 'DWELL_VN', icon: <Smartphone className="w-4 h-4 text-emerald-600" /> },
                { id: 'EMAIL', label: 'Email Billing', sub: 'PDF đính kèm', icon: <Mail className="w-4 h-4 text-purple-600" /> },
                { id: 'APP_PUSH', label: 'App Resident', sub: 'Push Alert', icon: <Bell className="w-4 h-4 text-amber-600" /> },
              ].map((channel) => {
                const isSelected = selectedChannels.includes(channel.id as any);
                return (
                  <button
                    key={channel.id}
                    onClick={() => toggleChannel(channel.id as any)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-brand-50 border-brand-500 ring-1 ring-brand-500'
                        : 'bg-white border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {channel.icon}
                    <span className="text-xs font-bold text-slate-800 mt-1">{channel.label}</span>
                    <span className="text-[10px] text-slate-400">{channel.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. AI Generated Content Preview */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span>Nội dung AI cá nhân hóa theo ngữ cảnh</span>
              </label>

              {/* Tone switcher */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                {[
                  { id: 'EMPATHETIC', label: 'Thấu cảm' },
                  { id: 'STRICT', label: 'Nghiêm nghị' },
                  { id: 'CONCISE_SMS', label: 'SMS 160 ký tự' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleToneChange(t.id as any)}
                    className={`px-2 py-1 text-[11px] rounded-md font-medium transition-all ${
                      selectedTone === t.id
                        ? 'bg-white text-brand-700 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700">
                Tiêu đề: <span className="font-normal text-slate-900">{alert.aiDraftContent.subject}</span>
              </div>
              <textarea
                rows={6}
                value={editableBody}
                onChange={(e) => setEditableBody(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs leading-relaxed text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white font-sans"
              />
            </div>

            {/* Embedded VietQR snapshot info */}
            {alert.amountDue && alert.amountDue > 0 && (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-brand-600" />
                  <div>
                    <div className="font-bold text-slate-900">VietQR Động Khớp Lệnh Tự Động</div>
                    <div className="text-[11px] text-slate-500">STK: 09128889999 • MBBank</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-brand-700">{formatCurrency(alert.amountDue)}</div>
                  <div className="text-[10px] text-emerald-600 font-semibold">Napas247</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Hạn chế tối đa 2 lần nhắc/tuần trong khung giờ 08:00 - 19:30.
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Hủy
            </Button>
            <Button
              variant="ai"
              size="sm"
              leftIcon={<Send className="w-4 h-4" />}
              isLoading={isDispatching}
              onClick={handleDispatch}
            >
              Phát Lệnh Gửi Đa Kênh Ngay
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
