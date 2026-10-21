import React, { useState } from 'react';
import {
  CalendarCheck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  User,
  Phone,
  Mail,
  Home,
  FileSignature,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Pagination } from '../components/common/Pagination';
import {
  useGetBookingsQuery,
  useUpdateBookingStatusMutation,
  useCreateBookingMutation,
} from '../modules/bookings/services/bookingApi';
import { useGetApartmentsQuery } from '../modules/buildings/services/buildingApi';
import { IBooking, BookingStatus } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useToast } from '../hooks/useToast';
import { useNavigate } from 'react-router-dom';

export const BookingsPage: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New booking form
  const [aptId, setAptId] = useState(3);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [checkIn, setCheckIn] = useState(new Date().toISOString().split('T')[0]);
  const [deposit, setDeposit] = useState(1000000);
  const [notes, setNotes] = useState('');

  const { data: bookings = [], isLoading } = useGetBookingsQuery({ status: selectedStatus });
  const { data: apartments = [] } = useGetApartmentsQuery({});

  const [updateBookingStatus] = useUpdateBookingStatusMutation();
  const [createBooking, { isLoading: isCreating }] = useCreateBookingMutation();
  const toast = useToast();
  const navigate = useNavigate();

  const handleStatusChange = async (id: number, status: BookingStatus) => {
    try {
      await updateBookingStatus({ id, status }).unwrap();
      toast.success('Cập nhật thành công', `Đã chuyển trạng thái booking sang ${status}`);
    } catch {
      toast.error('Lỗi', 'Không thể đổi trạng thái booking');
    }
  };

  const handleConvertToContract = (booking: IBooking) => {
    navigate(
      `/admin/contracts?action=create&aptId=${booking.apartmentId}&customerName=${encodeURIComponent(
        booking.customerName
      )}&customerPhone=${booking.customerPhone}&customerEmail=${encodeURIComponent(
        booking.customerEmail || ''
      )}`
    );
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const apt = apartments.find((a) => a.id === Number(aptId));
    try {
      await createBooking({
        apartmentId: Number(aptId),
        roomNumber: apt?.roomNumber || 'P.---',
        buildingName: apt?.buildingName || 'Sunshine Tower A',
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        checkInDate: checkIn,
        depositAmount: Number(deposit),
        notes,
      }).unwrap();

      toast.success('Thành công', 'Đã tiếp nhận yêu cầu đặt phòng và chuyển căn hộ sang RESERVED!');
      setIsCreateModalOpen(false);
      setName('');
      setPhone('');
    } catch {
      toast.error('Lỗi', 'Không thể tạo booking');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.bookingCode.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.roomNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredBookings.length / pageSize) || 1;
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="text-xs font-semibold text-brand-600 mb-0.5">
            Khách hàng & đặt phòng
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Quản Lý Đặt Phòng Online
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tiếp nhận yêu cầu đặt phòng, giữ chỗ căn hộ và chuyển đổi sang hợp đồng.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Tạo Đặt Phòng Mới
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: undefined, label: 'Tất cả' },
            { id: 'PENDING', label: 'Chờ xác nhận' },
            { id: 'CONFIRMED', label: 'Đã xác nhận giữ chỗ' },
            { id: 'CONVERTED', label: 'Đã lên hợp đồng' },
          ].map((st) => (
            <button
              key={st.label}
              onClick={() => {
                setSelectedStatus(st.id as any);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedStatus === st.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo mã Booking, tên khách..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
              <tr>
                <th className="px-5 py-3.5">Mã Booking</th>
                <th className="px-5 py-3.5">Khách Hàng Đặt Chỗ</th>
                <th className="px-5 py-3.5">Căn Hộ Giữ Chỗ</th>
                <th className="px-5 py-3.5">Ngày Dự Kiến Dọn Vào</th>
                <th className="px-5 py-3.5">Cọc Giữ Chỗ</th>
                <th className="px-5 py-3.5">Trạng Thái</th>
                <th className="px-5 py-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedBookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-brand-700">
                    {b.bookingCode}
                    <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                      Tạo ngày: {formatDate(b.createdAt)}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900 text-sm">{b.customerName}</div>
                    <div className="text-[11px] text-slate-500">{b.customerPhone}</div>
                    <div className="text-[10px] text-slate-400">{b.customerEmail}</div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900">{b.roomNumber}</div>
                    <div className="text-[11px] text-slate-500">{b.buildingName}</div>
                    <div className="text-[11px] font-semibold text-brand-700">{formatCurrency(b.monthlyPrice)}/th</div>
                  </td>

                  <td className="px-5 py-4 font-semibold text-slate-800">
                    {formatDate(b.checkInDate)}
                  </td>

                  <td className="px-5 py-4 font-bold text-emerald-600">
                    {formatCurrency(b.depositAmount)}
                  </td>

                  <td className="px-5 py-4">
                    <Badge status={b.status} />
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {b.status === 'PENDING' && (
                        <button
                          onClick={() => handleStatusChange(b.id, 'CONFIRMED')}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                        >
                          Xác Nhận Giữ Chỗ
                        </button>
                      )}

                      {b.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleConvertToContract(b)}
                          className="flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs"
                        >
                          <FileSignature className="w-3.5 h-3.5" />
                          <span>Lập Hợp Đồng</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredBookings.length}
          pageSize={pageSize}
          itemLabel="đặt phòng"
          className="px-5 py-3 border-t border-slate-200"
        />
      </div>

      {/* Create Booking Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tạo Mới Yêu Cầu Đặt Phòng & Giữ Chỗ"
        subtitle="Hệ thống tự động chuyển căn hộ sang RESERVED"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isCreating}
              onClick={handleCreateBooking}
            >
              Tạo Booking Giữ Chỗ
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateBooking} className="space-y-4">
          <Select
            label="Chọn Căn hộ trống (AVAILABLE)"
            value={aptId}
            onChange={(e) => setAptId(Number(e.target.value))}
            options={apartments
              .filter((a) => a.status === 'AVAILABLE')
              .map((a) => ({
                label: `${a.roomNumber} - ${a.buildingName} (${formatCurrency(a.price)}/th)`,
                value: a.id,
              }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Họ tên khách hàng"
              required
              placeholder="VD: Hoàng Thùy Linh"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Số điện thoại liên hệ"
              required
              placeholder="0903.***.***"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ngày dự kiến dọn vào"
              type="date"
              required
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
            <Input
              label="Tiền cọc giữ chỗ (VNĐ)"
              type="number"
              required
              value={deposit}
              onChange={(e) => setDeposit(Number(e.target.value))}
            />
          </div>

          <Input
            label="Ghi chú nhu cầu đặc biệt"
            placeholder="VD: Cần chuyển đồ vào cuối tuần..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
};
