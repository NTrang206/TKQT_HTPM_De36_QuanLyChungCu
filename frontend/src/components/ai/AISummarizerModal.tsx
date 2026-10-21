import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  Copy,
  Check,
  Send,
  Download,
  AlertTriangle,
  Clock,
  DollarSign,
  Receipt,
  Scale,
  LogOut,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { AIBotLogo } from '../common/AIBotLogo';
import { IContract } from '../../types';
import { useToast } from '../../hooks/useToast';

interface AISummarizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: IContract;
}

export const AISummarizerModal: React.FC<AISummarizerModalProps> = ({
  isOpen,
  onClose,
  contract,
}) => {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const { aiSummary } = contract;

  const terms = [
    {
      num: '01',
      title: 'Thời Hạn Hợp Đồng & Quy Định Gia Hạn',
      clauseRef: 'Điều 2 • Trang 2',
      icon: <Clock className="w-4 h-4 text-blue-600" />,
      content: aiSummary.term1_duration,
    },
    {
      num: '02',
      title: 'Giá Thuê & Tiền Cọc Bảo Đảm',
      clauseRef: 'Điều 3 • Trang 3',
      icon: <DollarSign className="w-4 h-4 text-emerald-600" />,
      content: aiSummary.term2_rentalPrice,
    },
    {
      num: '03',
      title: 'Nghĩa Vụ Thanh Toán & Phí Dịch Vụ Kèm Theo',
      clauseRef: 'Điều 4 & 5 • Trang 4',
      icon: <Receipt className="w-4 h-4 text-indigo-600" />,
      content: aiSummary.term3_paymentObligation,
    },
    {
      num: '04',
      title: 'Phạt Chậm Trả & Chế Tài Vi Phạm',
      clauseRef: 'Điều 8 • Trang 6',
      icon: <Scale className="w-4 h-4 text-rose-600" />,
      content: aiSummary.term4_penalties,
    },
    {
      num: '05',
      title: 'Điều Kiện Chấm Dứt HĐ & Bàn Giao Phòng',
      clauseRef: 'Điều 11 • Trang 8',
      icon: <LogOut className="w-4 h-4 text-amber-600" />,
      content: aiSummary.term5_termination,
    },
  ];

  const handleCopyAll = () => {
    const text = terms.map((t) => `${t.num}. ${t.title} (${t.clauseRef}):\n${t.content}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Đã sao chép', 'Toàn bộ 5 điều khoản cốt lõi đã được lưu vào clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendSummary = () => {
    toast.success('Đã gửi thông báo', `Bản tóm tắt hợp đồng ${contract.contractCode} đã được gửi tới khách thuê qua Zalo ZNS!`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <div className="flex items-center gap-2.5">
          <AIBotLogo size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900">AI Contract Summarizer Studio v2.4</span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                LEGAL-LLM
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Trích xuất 5 điều khoản pháp lý cốt lõi • Độ tin cậy: {aiSummary.confidenceScore}% (RAG Match)
            </p>
          </div>
        </div>
      }
      footer={
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Mã HĐ: <strong className="text-slate-800">{contract.contractCode}</strong> ({contract.roomNumber})</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              onClick={handleCopyAll}
            >
              {copied ? 'Đã Sao Chép' : 'Sao Chép 5 Điều Khoản'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Send className="w-4 h-4" />}
              onClick={handleSendSummary}
            >
              Gửi Tóm Tắt Zalo / Email
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Term Cards */}
        <div className="space-y-3">
          {terms.map((term) => (
            <div
              key={term.num}
              className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-xl p-4 transition-all duration-200 hover:border-brand-300"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-brand-700 font-bold text-xs flex items-center justify-center shadow-xs">
                    {term.num}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    {term.title}
                  </h4>
                </div>
                <span className="text-[11px] font-medium text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200/60">
                  {term.clauseRef}
                </span>
              </div>
              <p className="text-xs text-slate-700 pl-8 leading-relaxed font-normal">
                {term.content}
              </p>
            </div>
          ))}
        </div>

        {/* Legal Disclaimer Box */}
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <strong className="font-semibold text-amber-950">Lưu ý quan trọng từ Hệ thống:</strong> Trợ lý AI hỗ trợ tóm tắt điều khoản nhằm mục đích rà soát nhanh và giúp cư dân dễ nắm bắt. Nội dung này không thay thế giá trị pháp lý chính thức của hợp đồng văn bản có chữ ký số/chữ ký tươi của hai bên.
          </div>
        </div>
      </div>
    </Modal>
  );
};
