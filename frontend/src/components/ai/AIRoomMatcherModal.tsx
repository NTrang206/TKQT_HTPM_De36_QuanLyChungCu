import React, { useState } from 'react';
import { Sparkles, Check, Home, DollarSign, Compass, ArrowRight } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { AIBotLogo } from '../common/AIBotLogo';
import { IApartment } from '../../types';
import { matchApartmentsWithAI } from '../../utils/aiEngines';
import { formatCurrency } from '../../utils/formatters';

interface AIRoomMatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartments: IApartment[];
  onSelectApartment: (apt: IApartment) => void;
}

export const AIRoomMatcherModal: React.FC<AIRoomMatcherModalProps> = ({
  isOpen,
  onClose,
  apartments,
  onSelectApartment,
}) => {
  const [budgetMax, setBudgetMax] = useState<number>(20000000);
  const [bedrooms, setBedrooms] = useState<number>(2);
  const [view, setView] = useState<string>('Đông Nam');

  const matchedResults = matchApartmentsWithAI(apartments, {
    budgetMax,
    bedrooms,
    view,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <div className="flex items-center gap-2.5">
          <AIBotLogo size="lg" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Trợ Lý AI Room Matcher</h3>
            <p className="text-xs text-slate-500">
              Phân tích sở thích & ngân sách để gợi ý căn hộ hoàn hảo nhất cho bạn
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Preference Filters */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-brand-600" />
              <span>Ngân sách tối đa/tháng</span>
            </label>
            <select
              value={budgetMax}
              onChange={(e) => setBudgetMax(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-brand-500"
            >
              <option value={8000000}>Dưới 8.000.000 ₫</option>
              <option value={10000000}>Dưới 10.000.000 ₫</option>
              <option value={15000000}>Dưới 15.000.000 ₫</option>
              <option value={20000000}>Dưới 20.000.000 ₫</option>
              <option value={30000000}>Dưới 30.000.000 ₫ (Cao cấp)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-brand-600" />
              <span>Số phòng ngủ</span>
            </label>
            <select
              value={bedrooms}
              onChange={(e) => setBedrooms(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-brand-500"
            >
              <option value={1}>Studio / 1 Phòng ngủ</option>
              <option value={2}>2 Phòng ngủ</option>
              <option value={3}>3 Phòng ngủ</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-brand-600" />
              <span>Hướng ban công ưu tiên</span>
            </label>
            <select
              value={view}
              onChange={(e) => setView(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-brand-500"
            >
              <option value="Đông Nam">Hướng Đông Nam (Mát mẻ)</option>
              <option value="Công Viên">View Công Viên / Cây Xanh</option>
              <option value="Nội Khu">View Nội Khu Vườn Hoa</option>
              <option value="Đông Bắc">Hướng Đông Bắc</option>
            </select>
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Kết quả AI Match ({matchedResults.length} căn hộ sẵn sàng)
          </div>

          {matchedResults.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Không có căn hộ nào hoàn toàn khớp với tiêu chí trên. Bạn thử nới lỏng ngân sách xem sao nhé!
            </div>
          ) : (
            matchedResults.map(({ apartment: apt, matchScore, aiHighlight }) => (
              <div
                key={apt.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 hover:border-brand-400 shadow-soft transition-all duration-200 flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <img
                    src={apt.imageUrl}
                    alt={apt.roomNumber}
                    className="w-20 h-20 rounded-xl object-cover shadow-xs shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900">{apt.roomNumber}</span>
                      <span className="text-xs text-slate-500">• {apt.buildingName}</span>
                      <Badge status="AVAILABLE" size="sm" />
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {apt.areaSqm}m² • {apt.bedrooms} PN • {apt.bathrooms} WC • Hướng {apt.viewDirection}
                    </div>
                    <div className="text-[11px] text-brand-700 font-medium bg-brand-50 px-2 py-0.5 rounded mt-1.5 inline-block">
                      ★ {aiHighlight}
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                  <div className="text-base font-black text-brand-700">
                    {formatCurrency(apt.price)}
                    <span className="text-xs font-normal text-slate-400">/tháng</span>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    onClick={() => {
                      onSelectApartment(apt);
                      onClose();
                    }}
                  >
                    Đặt Phòng Ngay
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
