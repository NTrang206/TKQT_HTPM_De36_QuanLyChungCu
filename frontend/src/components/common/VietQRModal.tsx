import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { QrCode, CheckCircle2, Copy, Check, Building2, ShieldCheck, Download } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { generateVietQRUrl, DEFAULT_BUILDING_BANK_ACCOUNT } from '../../utils/vietqr';
import { formatCurrency } from '../../utils/formatters';
import { useRecordPaymentMutation } from '../../modules/finance/services/financeApi';
import { useToast } from '../../hooks/useToast';

interface VietQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  receivableId: number;
  amount: number;
  roomNumber: string;
  tenantName: string;
  billMonth: number;
  billYear: number;
  customDescription?: string;
  onPaymentSuccess?: () => void;
}

export const VietQRModal: React.FC<VietQRModalProps> = ({
  isOpen,
  onClose,
  receivableId,
  amount,
  roomNumber,
  tenantName,
  billMonth,
  billYear,
  customDescription,
  onPaymentSuccess,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [recordPayment, { isLoading }] = useRecordPaymentMutation();
  const toast = useToast();
  const description = customDescription || `HD2026${roomNumber.replace(/[^a-zA-Z0-9]/g, '')} T${billMonth}`;
  const qrUrl = generateVietQRUrl({
    bankId: 'MB',
    accountNo: DEFAULT_BUILDING_BANK_ACCOUNT.accountNo,
    accountName: DEFAULT_BUILDING_BANK_ACCOUNT.accountName,
    amount,
    description,
    template: 'compact2',
  });

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmTransfer = async () => {
    try {
      await recordPayment({
        receivableId,
        amount,
        paymentMethod: 'BANK_TRANSFER',
        note: `Thanh toán VietQR Napas247 cước phí tháng ${billMonth}/${billYear}`,
      }).unwrap();

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast.success('Thanh toán thành công', `Hệ thống đã khớp lệnh VietQR cho căn ${roomNumber}!`);
      if (onPaymentSuccess) onPaymentSuccess();
      onClose();
    } catch (err) {
      toast.error('Lỗi giao dịch', 'Không thể ghi nhận thanh toán lúc này');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-2 text-brand-700">
          <QrCode className="w-5 h-5 text-brand-600" />
          <span>Thanh Toán VietQR Napas247 Khớp Lệnh Tức Thì</span>
        </div>
      }
      subtitle={`Hóa đơn tiền phòng & dịch vụ T${billMonth}/${billYear} • Căn ${roomNumber}`}
      footer={
        <div className="w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Đối soát tự động qua OpenBanking</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Đóng
            </Button>
            <Button
              variant="success"
              size="sm"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              isLoading={isLoading}
              onClick={handleConfirmTransfer}
            >
              Xác Nhận Đã Chuyển Khoản
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* QR Display Card */}
        <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-b from-sky-50 to-slate-50 rounded-2xl border border-sky-100">
          <div className="bg-white p-3 rounded-xl shadow-soft border border-slate-100 flex flex-col items-center max-w-[240px]">
            <img
              src={qrUrl}
              alt="Mã VietQR"
              className="w-full h-auto object-contain rounded-lg"
            />
            <div className="mt-2 text-center">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Quét bằng App Ngân Hàng hoặc MoMo
              </span>
            </div>
          </div>
          <div className="mt-3 text-center">
            <span className="text-xs text-slate-500 font-medium">Số tiền thanh toán</span>
            <div className="text-2xl font-black text-brand-700">{formatCurrency(amount)}</div>
          </div>
        </div>

        {/* Bank transfer info details */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-brand-600" />
              {DEFAULT_BUILDING_BANK_ACCOUNT.bankName}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Số tài khoản:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-900 text-sm">
                {DEFAULT_BUILDING_BANK_ACCOUNT.accountNo}
              </span>
              <button
                onClick={() => copyToClipboard(DEFAULT_BUILDING_BANK_ACCOUNT.accountNo, 'acc')}
                className="text-brand-600 hover:text-brand-700 p-1"
                title="Sao chép STK"
              >
                {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Chủ tài khoản:</span>
            <span className="font-bold text-slate-800 uppercase">
              {DEFAULT_BUILDING_BANK_ACCOUNT.accountName}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500">Nội dung chuyển khoản (bắt buộc):</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                {description}
              </span>
              <button
                onClick={() => copyToClipboard(description, 'desc')}
                className="text-brand-600 hover:text-brand-700 p-1"
                title="Sao chép nội dung"
              >
                {copiedField === 'desc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
