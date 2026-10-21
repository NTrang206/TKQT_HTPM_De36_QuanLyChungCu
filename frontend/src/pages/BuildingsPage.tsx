import React, { useState } from 'react';
import {
  Building,
  Plus,
  Search,
  Filter,
  Layers,
  Home,
  CheckCircle2,
  Clock,
  Wrench,
  Ban,
  ArrowUpDown,
  MoreVertical,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Pagination } from '../components/common/Pagination';
import {
  useGetBuildingsQuery,
  useGetApartmentsQuery,
  useUpdateApartmentStatusMutation,
  useCreateApartmentMutation,
} from '../modules/buildings/services/buildingApi';
import { ApartmentStatus, IApartment } from '../types';
import { formatCurrency, formatCompactCurrency } from '../utils/formatters';
import { useToast } from '../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { parseApiError } from '../utils/errorHandler';

export const BuildingsPage: React.FC = () => {
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<ApartmentStatus | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form error state
  const [aptErrors, setAptErrors] = useState<Record<string, string>>({});

  // New Apartment Form state
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newFloor, setNewFloor] = useState(3);
  const [newArea, setNewArea] = useState(65);
  const [newPrice, setNewPrice] = useState(8500000);
  const [newBedrooms, setNewBedrooms] = useState(2);
  const [newBathrooms, setNewBathrooms] = useState(2);
  const [newViewDirection, setNewViewDirection] = useState('Đông Nam');
  const [newBuildingId, setNewBuildingId] = useState(1);

  const { data: buildings = [] } = useGetBuildingsQuery();
  const { data: apartments = [], isLoading } = useGetApartmentsQuery({
    buildingId: selectedBuildingId,
    status: selectedStatus,
  });

  const [updateApartmentStatus] = useUpdateApartmentStatusMutation();
  const [createApartment, { isLoading: isCreating }] = useCreateApartmentMutation();
  const toast = useToast();
  const navigate = useNavigate();

  const filteredApartments = apartments.filter((a) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.roomNumber.toLowerCase().includes(q) ||
        a.buildingName.toLowerCase().includes(q) ||
        a.viewDirection.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredApartments.length / pageSize) || 1;
  const paginatedApartments = filteredApartments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleStatusChange = async (aptId: number, newStatus: ApartmentStatus) => {
    try {
      await updateApartmentStatus({ id: aptId, status: newStatus }).unwrap();
      toast.success('Cập nhật thành công', `Đã chuyển trạng thái phòng sang ${newStatus}`);
    } catch {
      toast.error('Lỗi', 'Không thể đổi trạng thái căn hộ');
    }
  };

  const handleCreateApartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!newRoomNumber.trim()) {
      errors.newRoomNumber = 'Vui lòng nhập số phòng (VD: P.508)';
    }
    if (Number(newFloor) <= 0) {
      errors.newFloor = 'Tầng phải lớn hơn 0';
    }
    if (Number(newArea) <= 0) {
      errors.newArea = 'Diện tích phải lớn hơn 0 m²';
    }
    if (Number(newPrice) <= 0) {
      errors.newPrice = 'Giá thuê phải lớn hơn 0 VNĐ';
    }

    if (Object.keys(errors).length > 0) {
      setAptErrors(errors);
      toast.error('Lỗi nhập liệu', 'Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      return;
    }

    setAptErrors({});
    try {
      const selectedB = buildings.find((b) => b.id === Number(newBuildingId));
      await createApartment({
        roomNumber: newRoomNumber.trim(),
        buildingId: Number(newBuildingId),
        buildingName: selectedB?.name || 'Sunshine Tower A',
        floor: Number(newFloor),
        areaSqm: Number(newArea),
        price: Number(newPrice),
        bedrooms: Number(newBedrooms),
        bathrooms: Number(newBathrooms),
        viewDirection: newViewDirection,
        status: 'AVAILABLE',
        description: `Căn hộ cao cấp tầng ${newFloor}, view ${newViewDirection}`,
      }).unwrap();

      toast.success('Thành công', `Đã khởi tạo căn hộ ${newRoomNumber} sẵn sàng cho thuê!`);
      setIsAddModalOpen(false);
      setNewRoomNumber('');
      setAptErrors({});
    } catch (err: any) {
      const parsed = parseApiError(err, 'Không thể tạo mới căn hộ');
      setAptErrors({ general: parsed.message, ...parsed.fieldErrors });
      toast.error('Tạo căn hộ thất bại', parsed.message);
    }
  };

  const handleOpenAddModal = () => {
    setNewRoomNumber('');
    setNewFloor(1);
    setNewArea(50);
    setNewPrice(8500000);
    setAptErrors({});
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setAptErrors({});
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="text-xs font-semibold text-brand-600 mb-0.5">
            Quản lý vận hành
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Quản Lý Tòa Nhà & Căn Hộ
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kiểm tra trạng thái phòng, diện tích và quản lý danh mục tài sản căn hộ.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={handleOpenAddModal}
        >
          Thêm Căn Hộ Mới
        </Button>
      </div>

      {/* Buildings Overview Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {buildings.map((b) => {
          const isSelected = selectedBuildingId === b.id;
          return (
            <div
              key={b.id}
              onClick={() => {
                setSelectedBuildingId(isSelected ? undefined : b.id);
                setCurrentPage(1);
              }}
              className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-brand-50/60 border-brand-500 shadow-xs ring-1 ring-brand-500'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900">{b.name}</span>
                <Badge
                  status="AVAILABLE"
                  label={`${b.availableCount} trống`}
                  size="sm"
                />
              </div>
              <div className="text-xs text-slate-500 truncate">{b.address}</div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">{b.totalFloors} Tầng • {b.totalApartments} Căn</span>
                <span className="font-semibold text-brand-700">{formatCompactCurrency(b.monthlyRevenueEstimate)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {/* Status filters */}
          {[
            { id: undefined, label: 'Tất cả' },
            { id: 'AVAILABLE', label: 'Còn trống' },
            { id: 'RESERVED', label: 'Đã giữ chỗ' },
            { id: 'OCCUPIED', label: 'Đang thuê' },
            { id: 'MAINTENANCE', label: 'Đang bảo trì' },
          ].map((st) => (
            <button
              key={st.label}
              onClick={() => {
                setSelectedStatus(st.id as any);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedStatus === st.id
                  ? 'bg-slate-900 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm số phòng (P101, P201)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Apartment Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {paginatedApartments.map((apt) => (
          <div
            key={apt.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all duration-200 flex flex-col justify-between"
          >
            {/* Image & Badges */}
            <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 group">
              <img
                src={apt.imageUrl}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop&q=80';
                }}
                alt={apt.roomNumber}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute top-2.5 left-2.5">
                <Badge status={apt.status} size="sm" />
              </div>
              <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-slate-900/80 backdrop-blur rounded text-white font-bold text-xs">
                {formatCurrency(apt.price)}/th
              </div>
            </div>

            {/* Info details */}
            <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">{apt.roomNumber}</h3>
                  <span className="text-xs text-slate-500 font-medium truncate">{apt.buildingName}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{apt.description}</p>

                <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2.5 border-t border-slate-100 text-center text-xs">
                  <div className="bg-slate-50 p-1 rounded">
                    <span className="text-slate-400 text-[10px] block">Diện tích</span>
                    <strong className="text-slate-800 text-[11px]">{apt.areaSqm}m²</strong>
                  </div>
                  <div className="bg-slate-50 p-1 rounded">
                    <span className="text-slate-400 text-[10px] block">Phòng ngủ</span>
                    <strong className="text-slate-800 text-[11px]">{apt.bedrooms} PN</strong>
                  </div>
                  <div className="bg-slate-50 p-1 rounded">
                    <span className="text-slate-400 text-[10px] block">Tầng</span>
                    <strong className="text-slate-800 text-[11px]">Tầng {apt.floor}</strong>
                  </div>
                </div>
              </div>

              {/* Status Action Switcher */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <select
                  value={apt.status}
                  onChange={(e) => handleStatusChange(apt.id, e.target.value as ApartmentStatus)}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-[11px] font-semibold px-2 py-1.5 text-slate-800 outline-none cursor-pointer"
                >
                  <option value="AVAILABLE">Trống (AVAILABLE)</option>
                  <option value="RESERVED">Giữ chỗ (RESERVED)</option>
                  <option value="OCCUPIED">Đang thuê (OCCUPIED)</option>
                  <option value="MAINTENANCE">Bảo trì (MAINTENANCE)</option>
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/admin/contracts?action=create&aptId=${apt.id}`)}
                >
                  Lập HĐ
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredApartments.length}
        pageSize={pageSize}
        itemLabel="căn hộ"
      />

      {/* Modal Add New Apartment */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        title="Thêm Mới Căn Hộ Vào Khối Nhà"
        subtitle="Khởi tạo số phòng, diện tích, giá niêm yết và hướng ban công"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleCloseAddModal}>
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isCreating}
              onClick={handleCreateApartment}
            >
              Lưu & Phát Hành Phòng
            </Button>
          </div>
        }
      >
        {aptErrors.general && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1 font-medium">{aptErrors.general}</div>
          </div>
        )}

        <form onSubmit={handleCreateApartment} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Số phòng hiển thị (Mã căn)"
              required
              placeholder="VD: P.508"
              value={newRoomNumber}
              error={aptErrors.newRoomNumber}
              onChange={(e) => {
                setNewRoomNumber(e.target.value);
                if (aptErrors.newRoomNumber) setAptErrors({ ...aptErrors, newRoomNumber: '' });
              }}
            />

            <Select
              label="Thuộc Tòa nhà"
              value={newBuildingId}
              onChange={(e) => setNewBuildingId(Number(e.target.value))}
              options={buildings.map((b) => ({ label: b.name, value: b.id }))}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Tầng"
              type="number"
              required
              value={newFloor}
              error={aptErrors.newFloor}
              onChange={(e) => {
                setNewFloor(Number(e.target.value));
                if (aptErrors.newFloor) setAptErrors({ ...aptErrors, newFloor: '' });
              }}
            />
            <Input
              label="Diện tích (m²)"
              type="number"
              required
              value={newArea}
              error={aptErrors.newArea}
              onChange={(e) => {
                setNewArea(Number(e.target.value));
                if (aptErrors.newArea) setAptErrors({ ...aptErrors, newArea: '' });
              }}
            />
            <Input
              label="Giá thuê/tháng (VNĐ)"
              type="number"
              required
              value={newPrice}
              error={aptErrors.newPrice}
              onChange={(e) => {
                setNewPrice(Number(e.target.value));
                if (aptErrors.newPrice) setAptErrors({ ...aptErrors, newPrice: '' });
              }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Số phòng ngủ"
              value={newBedrooms}
              onChange={(e) => setNewBedrooms(Number(e.target.value))}
              options={[
                { label: 'Studio', value: 1 },
                { label: '1 Phòng ngủ', value: 1 },
                { label: '2 Phòng ngủ', value: 2 },
                { label: '3 Phòng ngủ', value: 3 },
              ]}
            />
            <Select
              label="Số phòng vệ sinh (WC)"
              value={newBathrooms}
              onChange={(e) => setNewBathrooms(Number(e.target.value))}
              options={[
                { label: '1 WC', value: 1 },
                { label: '2 WC', value: 2 },
                { label: '3 WC', value: 3 },
              ]}
            />
            <Select
              label="Hướng ban công"
              value={newViewDirection}
              onChange={(e) => setNewViewDirection(e.target.value)}
              options={[
                { label: 'Đông Nam', value: 'Đông Nam' },
                { label: 'Đông Bắc', value: 'Đông Bắc' },
                { label: 'Tây Nam', value: 'Tây Nam' },
                { label: 'Tây Bắc', value: 'Tây Bắc' },
                { label: 'Công Viên Cây Xanh', value: 'Công Viên Cây Xanh' },
              ]}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
