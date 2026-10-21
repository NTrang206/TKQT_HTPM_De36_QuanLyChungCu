import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, BedDouble, Maximize2, MapPin, Calendar, CheckCircle2, 
  ArrowLeft, Sparkles, FileText, 
  Wrench, AlertCircle, Phone, X, Bath
} from 'lucide-react';
import { useGetApartmentByIdQuery, useGetBuildingsQuery } from '../modules/buildings/services/buildingApi';
import { useGetContractsQuery } from '../modules/contracts/services/contractApi';
import { useGetMaintenanceRequestsQuery } from '../modules/maintenance/services/maintenanceApi';
import { useCreateBookingMutation } from '../modules/bookings/services/bookingApi';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

export const ApartmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isStaff, isAdmin } = useAuth();
  const { showSuccessToast, showErrorToast } = useToast();

  const numId = id ? parseInt(id, 10) : 0;
  const { data: apartment, isLoading: isAptLoading } = useGetApartmentByIdQuery(numId);
  const { data: buildings = [] } = useGetBuildingsQuery();
  const { data: contracts = [] } = useGetContractsQuery({});
  const { data: maintenanceList = [] } = useGetMaintenanceRequestsQuery({});
  const [createBooking, { isLoading: isBookingLoading }] = useCreateBookingMutation();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    name: user?.fullName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '14:00',
    notes: 'Tôi muốn hẹn xem căn phòng này.'
  });

  const building = buildings.find(b => b.id === apartment?.buildingId);
  const activeContract = contracts.find(c => c.apartmentId === numId && c.status === 'ACTIVE');
  const aptMaintenance = maintenanceList.filter(m => m.apartmentId === numId);

  if (isAptLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Đang tải thông tin chi tiết căn hộ...</p>
        </div>
      </div>
    );
  }

  if (!apartment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Không tìm thấy căn hộ</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">Căn hộ không tồn tại hoặc đã bị xóa khỏi hệ thống Dwell Living.</p>
          <button
            onClick={() => navigate('/explore')}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const images = apartment.imageUrl 
    ? [apartment.imageUrl, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80']
    : ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'];

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBooking({
        apartmentId: apartment.id,
        customerName: bookingForm.name,
        customerPhone: bookingForm.phone,
        customerEmail: bookingForm.email,
        roomNumber: apartment.roomNumber,
        buildingName: apartment.buildingName,
        monthlyPrice: apartment.price,
        depositAmount: apartment.depositDefault,
        checkInDate: bookingForm.date,
        notes: `[Khung giờ: ${bookingForm.time}] ${bookingForm.notes}`
      }).unwrap();

      showSuccessToast('Đã đặt lịch xem phòng thành công! Đội ngũ tư vấn sẽ liên hệ sớm nhất.');
      setIsBookingModalOpen(false);
    } catch {
      showErrorToast('Không thể đặt lịch. Vui lòng thử lại!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">Mã căn:</span>
            <span className="text-sm font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">
              {apartment.roomNumber}
            </span>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-6">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 text-xs text-slate-500 mb-4">
          <span className="hover:text-sky-600 cursor-pointer" onClick={() => navigate('/explore')}>Trang chủ</span>
          <span>/</span>
          <span>{building?.name || apartment.buildingName}</span>
          <span>/</span>
          <span className="text-slate-800 font-medium">Căn hộ {apartment.roomNumber}</span>
        </div>

        {/* Gallery & Quick Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Gallery (2 Cols) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-slate-900">
              <img
                src={images[activeImageIndex]}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80';
                }}
                alt={`Căn hộ ${apartment.roomNumber}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-md backdrop-blur-md ${
                  apartment.status === 'AVAILABLE' 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-amber-500 text-white'
                }`}>
                  {apartment.status === 'AVAILABLE' ? '● Căn hộ đang trống' : '● Đang có người thuê'}
                </span>
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-20 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                      activeImageIndex === idx ? 'border-sky-600 scale-105 shadow' : 'border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=300&auto=format&fit=crop&q=80';
                      }}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Action Card (1 Col) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  {building?.name || apartment.buildingName}
                </span>
                <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-semibold">
                  Tầng {apartment.floor}
                </span>
              </div>

              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
                Căn hộ {apartment.roomNumber}
              </h1>
              <p className="text-xs text-slate-500 mb-6">
                {building?.address || 'Hệ thống căn hộ cao cấp Dwell Living'}
              </p>

              {/* Price block */}
              <div className="p-4 bg-sky-50 rounded-xl border border-sky-100 mb-6">
                <span className="text-xs text-sky-700 block font-medium">Giá thuê niêm yết</span>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span className="text-2xl font-extrabold text-sky-900">
                    {formatCurrency(apartment.price)}
                  </span>
                  <span className="text-xs text-sky-600 font-medium">/ tháng</span>
                </div>
                <div className="mt-2 pt-2 border-t border-sky-200/50 flex justify-between text-xs text-sky-800">
                  <span>Tiền đặt cọc:</span>
                  <strong className="font-semibold">{formatCurrency(apartment.depositDefault)}</strong>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-3 gap-2 text-center p-3 bg-slate-50 rounded-xl border border-slate-100 mb-6">
                <div>
                  <BedDouble className="w-4 h-4 text-sky-600 mx-auto mb-1" />
                  <span className="text-xs font-bold text-slate-800 block">{apartment.bedrooms} PN</span>
                  <span className="text-[10px] text-slate-400">Phòng ngủ</span>
                </div>
                <div>
                  <Bath className="w-4 h-4 text-sky-600 mx-auto mb-1" />
                  <span className="text-xs font-bold text-slate-800 block">{apartment.bathrooms} WC</span>
                  <span className="text-[10px] text-slate-400">Vệ sinh</span>
                </div>
                <div>
                  <Maximize2 className="w-4 h-4 text-sky-600 mx-auto mb-1" />
                  <span className="text-xs font-bold text-slate-800 block">{apartment.areaSqm} m²</span>
                  <span className="text-[10px] text-slate-400">Diện tích</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {apartment.status === 'AVAILABLE' ? (
                <button
                  onClick={() => setIsBookingModalOpen(true)}
                  className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center justify-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Đặt Lịch Xem Căn Hộ Này</span>
                </button>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs text-amber-800 font-medium">
                  Căn hộ hiện đang có hợp đồng thuê hoạt động
                </div>
              )}

              {(isAdmin || isStaff) && (
                <button
                  onClick={() => navigate('/admin/contracts')}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center space-x-2"
                >
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span>Quản Lý Hợp Đồng Căn Này</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description & Overview */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>Mô Tả Không Gian Sống</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {apartment.description || 'Căn hộ thuộc chuỗi không gian Dwell Living cao cấp, được thiết kế tối ưu hóa ánh sáng tự nhiên và công năng sử dụng. Đầy đủ tiện nghi nội thất cao cấp thông minh, khóa vân tay chống trộm, hệ thống điều hòa Inverter tiết kiệm điện năng và view panorama tuyệt đẹp.'}
              </p>
            </div>

            {/* Amenities & Features */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Tiện Nghi & Trang Thiết Bị Đi Kèm</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {apartment.amenities && apartment.amenities.length > 0 ? (
                  apartment.amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-sky-600 flex-shrink-0" />
                      <span className="font-medium">{amenity.name} ({amenity.brand})</span>
                    </div>
                  ))
                ) : (
                  ['Khóa cửa thông minh', 'Điều hòa Inverter', 'Tủ lạnh 2 cánh', 'Sofa cao cấp', 'Bếp từ đôi'].map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-sky-600 flex-shrink-0" />
                      <span className="font-medium">{item}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Active Contract Info (If Admin/Staff/Tenant) */}
            {activeContract && (isAdmin || isStaff || user?.id === activeContract.tenantId) && (
              <div className="bg-white rounded-2xl border border-sky-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-600" />
                    <span>Hợp Đồng Thuê Hiện Tại ({activeContract.contractCode})</span>
                  </h2>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                    Đang Hiệu Lực
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl">
                  <div>
                    <span className="text-slate-400 block">Thời hạn hợp đồng:</span>
                    <strong className="text-slate-800">{formatDate(activeContract.startDate)} → {formatDate(activeContract.endDate)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tiền thuê hàng tháng:</span>
                    <strong className="text-sky-700 font-bold">{formatCurrency(activeContract.rentalPrice)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Ngày thanh toán định kỳ:</span>
                    <strong className="text-slate-800">Ngày {activeContract.paymentDueDay} hàng tháng</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tiền cọc ký gửi:</span>
                    <strong className="text-slate-800">{formatCurrency(activeContract.depositAmount)}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Support & Maintenance Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100/90 flex items-center justify-center text-[#1d4ed8] shadow-xs shrink-0">
                  <Phone className="w-5 h-5 text-[#1d4ed8]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Hỗ Trợ Xem Phòng 24/7
                  </h3>
                  <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Quản lý tòa nhà trực tuyến
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Quản lý tòa nhà luôn sẵn sàng hỗ trợ bạn tham quan căn hộ trực tiếp hoặc xem qua video 360 độ.
              </p>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                <span className="text-[11px] text-slate-500 font-medium block">
                  Hotline Quản Lý Tòa Nhà:
                </span>
                <strong className="text-[#1d4ed8] text-lg font-extrabold tracking-tight">
                  0912.888.999
                </strong>
              </div>

              <button
                onClick={() => setIsBookingModalOpen(true)}
                className="w-full py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Gửi Yêu Cầu Hẹn Giờ</span>
              </button>
            </div>

            {/* Maintenance history (Staff/Admin) */}
            {(isAdmin || isStaff) && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-600" />
                  <span>Lịch Sử Bảo Trì Căn Hộ ({aptMaintenance.length})</span>
                </h3>
                {aptMaintenance.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Chưa có sự cố bảo trì nào ghi nhận.</p>
                ) : (
                  <div className="space-y-2">
                    {aptMaintenance.slice(0, 3).map(m => (
                      <div key={m.id} className="p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-100">
                        <div className="flex items-center justify-between font-medium">
                          <span className="text-slate-800 truncate">{m.ticketCode}</span>
                          <span className="text-[10px] text-slate-500">{formatDate(m.createdAt)}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{m.issueDescription}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Booking Schedule Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-sky-600 to-blue-700 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Hẹn Xem Căn {apartment.roomNumber}</h3>
                <p className="text-[11px] text-sky-100">{apartment.buildingName}</p>
              </div>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBooking} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Họ tên của bạn *</label>
                <input
                  type="text"
                  required
                  value={bookingForm.name}
                  onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    value={bookingForm.phone}
                    onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                    placeholder="0912..."
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày hẹn *</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú thêm</label>
                <textarea
                  rows={2}
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isBookingLoading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-sm shadow-sky-600/30"
                >
                  {isBookingLoading ? 'Đang gửi...' : 'Xác Nhận Hẹn Xem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
