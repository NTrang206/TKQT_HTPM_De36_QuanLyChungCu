import React, { useState, useMemo } from 'react';
import { 
  Building2, MapPin, Phone, User, CheckCircle2, 
  Search, X, ExternalLink, ArrowRight, Layers, Home
} from 'lucide-react';
import { IBuilding } from '../../types/entities';

interface BuildingLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildings: IBuilding[];
  onSelectBuilding: (buildingId: number, buildingName: string) => void;
  onOpenFloorPlans: () => void;
}

export const BuildingLookupModal: React.FC<BuildingLookupModalProps> = ({
  isOpen,
  onClose,
  buildings,
  onSelectBuilding,
  onOpenFloorPlans
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState<'ALL' | 'HANOI' | 'HCM'>('ALL');

  const filteredBuildings = useMemo(() => {
    return buildings.filter(b => {
      const matchSearch = 
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.managerName.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (cityFilter === 'HANOI') {
        return b.address.toLowerCase().includes('hà nội') || b.address.toLowerCase().includes('ha noi');
      }
      if (cityFilter === 'HCM') {
        return b.address.toLowerCase().includes('hồ chí minh') || b.address.toLowerCase().includes('hcm') || b.address.toLowerCase().includes('bình thạnh');
      }
      return true;
    });
  }, [buildings, searchTerm, cityFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-brand-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center text-brand-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold">Hệ Thống Tòa Nhà & Khu Căn Hộ</h3>
                <span className="px-1.5 py-0.5 bg-rose-500 text-[10px] font-bold rounded text-white uppercase tracking-wider">
                  New
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Tra cứu vị trí, tiện ích, tình trạng phòng trống và ban quản lý tại Dwell Living
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên tòa nhà hoặc địa chỉ (vd: Sunshine Center, Cầu Giấy...)"
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1.5 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setCityFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                cityFilter === 'ALL'
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Tất cả ({buildings.length})
            </button>
            <button
              onClick={() => setCityFilter('HANOI')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                cityFilter === 'HANOI'
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Hà Nội
            </button>
            <button
              onClick={() => setCityFilter('HCM')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                cityFilter === 'HCM'
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              TP. HCM
            </button>
          </div>
        </div>

        {/* Building List (Scrollable) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {filteredBuildings.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Không tìm thấy tòa nhà phù hợp</p>
              <p className="text-xs text-slate-500 mt-1">Vui lòng thử tìm với từ khóa khác</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBuildings.map((b) => (
                <div 
                  key={b.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 hover:border-brand-300 hover:shadow-soft transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Title & Badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-bold text-slate-900 text-sm hover:text-brand-600 transition-colors">
                        {b.name}
                      </h4>
                      <span className="shrink-0 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full">
                        {b.availableCount > 0 ? `${b.availableCount} phòng trống` : 'Đã kín phòng'}
                      </span>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-1.5 text-xs text-slate-600 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                      <span>{b.address}</span>
                    </div>

                    {/* Stats pills */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-lg p-2.5 mb-3 text-center">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Quy mô</div>
                        <div className="text-xs font-bold text-slate-800">{b.totalFloors} Tầng</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Tổng căn hộ</div>
                        <div className="text-xs font-bold text-slate-800">{b.totalApartments} Căn</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Đã thuê</div>
                        <div className="text-xs font-bold text-slate-800">{b.occupiedCount} Căn</div>
                      </div>
                    </div>

                    {/* Contact & Manager */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-4 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>QL: {b.managerName}</span>
                      </div>
                      <div className="flex items-center gap-1 font-semibold text-brand-700">
                        <Phone className="w-3 h-3 text-brand-600" />
                        <span>{b.contactPhone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        onSelectBuilding(b.id, b.name);
                        onClose();
                      }}
                      className="flex-1 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Home className="w-3.5 h-3.5" />
                      <span>Xem phòng trống</span>
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenFloorPlans();
                      }}
                      title="Xem sơ đồ mặt bằng các tầng"
                      className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Mặt bằng</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5 text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Tất cả tòa nhà đều trang bị PCCC tự động và thẻ từ bảo mật thang máy</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors text-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
