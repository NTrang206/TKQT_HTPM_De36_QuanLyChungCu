import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Search, SlidersHorizontal, Sparkles, BedDouble, 
  Maximize2, MapPin, Calendar, CheckCircle2, 
  Phone, Mail, ArrowRight, X, Heart, Bookmark, ChevronDown, 
  Camera, ShieldCheck, Flame, Tag, Clock, Share2, PlusCircle,
  Headphones, Send, Globe, QrCode, LogOut, LayoutGrid, List
} from 'lucide-react';
import { useGetBuildingsQuery, useGetApartmentsQuery } from '../modules/buildings/services/buildingApi';
import { useCreateBookingMutation } from '../modules/bookings/services/bookingApi';
import { formatCurrency } from '../utils/formatters';
import { IApartment, IBuilding } from '../types/entities';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { DwellLogo } from '../components/common/DwellLogo';
import { FooterInfoModal, FooterModalKey } from '../components/common/FooterInfoModal';
import { Pagination } from '../components/common/Pagination';

export const PublicExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useToast();
  const { isAuthenticated, isTenant, isAdmin, isStaff, switchRole, user, logout } = useAuth();
  
  const { data: buildings = [] } = useGetBuildingsQuery();
  const { data: apartments = [] } = useGetApartmentsQuery({});
  const [createBooking, { isLoading: isBookingLoading }] = useCreateBookingMutation();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('ALL');
  const [selectedBedrooms, setSelectedBedrooms] = useState<string>('ALL');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'DEFAULT' | 'PRICE_ASC' | 'PRICE_DESC' | 'AREA_DESC'>('DEFAULT');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isSavedSearch, setIsSavedSearch] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [footerModalKey, setFooterModalKey] = useState<FooterModalKey | null>(null);

  const handleSubscribeNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    showSuccessToast(`Cảm ơn bạn! Đã đăng ký nhận tin căn hộ mới nhất qua email ${newsletterEmail}.`);
    setNewsletterEmail('');
  };

  // Booking Modal State
  const [bookingModalApartment, setBookingModalApartment] = useState<IApartment | null>(null);
  const [bookingForm, setBookingForm] = useState({
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    viewingDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    viewingTime: '10:00',
    notes: 'Tôi muốn xem thực tế căn hộ này vào thời gian trên.'
  });

  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const isFav = prev.includes(id);
      if (!isFav) {
        showSuccessToast('Đã lưu căn hộ vào danh sách yêu thích!');
      }
      return isFav ? prev.filter(item => item !== id) : [...prev, id];
    });
  };

  const handleSaveSearch = () => {
    setIsSavedSearch(!isSavedSearch);
    if (!isSavedSearch) {
      showSuccessToast('Đã lưu tiêu chí tìm kiếm! Hệ thống sẽ thông báo khi có căn mới.');
    } else {
      showSuccessToast('Đã hủy lưu tìm kiếm.');
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingModalApartment) return;

    if (!bookingForm.guestName.trim() || !bookingForm.guestPhone.trim()) {
      showErrorToast('Vui lòng điền họ tên và số điện thoại liên hệ!');
      return;
    }

    try {
      await createBooking({
        apartmentId: bookingModalApartment.id,
        customerName: bookingForm.guestName,
        customerPhone: bookingForm.guestPhone,
        customerEmail: bookingForm.guestEmail,
        roomNumber: bookingModalApartment.roomNumber,
        buildingName: bookingModalApartment.buildingName,
        monthlyPrice: bookingModalApartment.price,
        depositAmount: bookingModalApartment.depositDefault,
        checkInDate: bookingForm.viewingDate,
        notes: `[Khung giờ xem: ${bookingForm.viewingTime}] ${bookingForm.notes}`
      }).unwrap();

      showSuccessToast(`Đã gửi yêu cầu đặt lịch xem căn ${bookingModalApartment.roomNumber} thành công! Nhân viên tư vấn Dwell sẽ liên hệ trong 15 phút.`);
      setBookingModalApartment(null);
      setBookingForm({
        guestName: '',
        guestPhone: '',
        guestEmail: '',
        viewingDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        viewingTime: '10:00',
        notes: 'Tôi muốn xem thực tế căn hộ này vào thời gian trên.'
      });
    } catch {
      showErrorToast('Gửi yêu cầu thất bại. Vui lòng thử lại!');
    }
  };

  // Filter logic
  const filteredApartments = useMemo(() => {
    return apartments.filter(apt => {
      const matchesSearch = apt.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            apt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            apt.buildingName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBuilding = selectedBuildingId === 'ALL' || apt.buildingId.toString() === selectedBuildingId;
      const matchesBedrooms = selectedBedrooms === 'ALL' || apt.bedrooms.toString() === selectedBedrooms;
      
      let matchesPrice = true;
      if (selectedPriceRange === 'UNDER_10M') matchesPrice = apt.price < 10000000;
      else if (selectedPriceRange === '10M_15M') matchesPrice = apt.price >= 10000000 && apt.price <= 15000000;
      else if (selectedPriceRange === '15M_20M') matchesPrice = apt.price > 15000000 && apt.price <= 20000000;
      else if (selectedPriceRange === 'OVER_20M') matchesPrice = apt.price > 20000000;

      return matchesSearch && matchesBuilding && matchesBedrooms && matchesPrice;
    });
  }, [apartments, searchTerm, selectedBuildingId, selectedBedrooms, selectedPriceRange]);

  // Sort logic
  const sortedApartments = useMemo(() => {
    const list = [...filteredApartments];
    if (sortBy === 'PRICE_ASC') return list.sort((a, b) => a.price - b.price);
    if (sortBy === 'PRICE_DESC') return list.sort((a, b) => b.price - a.price);
    if (sortBy === 'AREA_DESC') return list.sort((a, b) => b.areaSqm - a.areaSqm);
    return list.sort((a, b) => b.id - a.id);
  }, [filteredApartments, sortBy]);

  const totalPages = Math.ceil(sortedApartments.length / pageSize) || 1;
  const paginatedApartments = sortedApartments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getBuildingName = (buildingId: number) => {
    const b = buildings.find(item => item.id === buildingId);
    return b ? b.name : 'Dwell Tower';
  };

  const getBuildingAddress = (buildingId: number) => {
    const b = buildings.find(item => item.id === buildingId);
    return b ? b.address : 'Quận Cầu Giấy, Hà Nội';
  };

  const formatPriceVND = (price: number) => {
    if (price >= 1000000) {
      const millions = price / 1000000;
      return `${millions % 1 === 0 ? millions : millions.toFixed(1)} triệu/tháng`;
    }
    return `${price.toLocaleString('vi-VN')} đ/tháng`;
  };

  return (
    <div className="min-h-screen bg-[#f7f8f9] text-slate-800 font-sans">
      {/* 1. Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="cursor-pointer" onClick={() => navigate('/')}>
              <DwellLogo badge="Hệ Thống Thuê Căn Hộ" badgeVariant="sky" size="sm" />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2.5">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2.5">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900 leading-tight">{user.fullName}</span>
                  <span className="text-[10px] text-brand-600 font-semibold">
                    {user.roleCode === 'TENANT'
                      ? 'Cư dân căn hộ'
                      : user.roleCode === 'ADMIN'
                      ? 'Quản trị viên'
                      : user.roleCode === 'ACCOUNTANT'
                      ? 'Kế toán trưởng'
                      : 'Ban quản lý'}
                  </span>
                </div>
                {user.roleCode === 'TENANT' ? (
                  <button
                    onClick={() => navigate('/tenant-portal')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                  >
                    <span>Vào Cổng Cư Dân</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(user.roleCode === 'ACCOUNTANT' ? '/admin/finance' : '/admin/dashboard')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                  >
                    <span>Vào Quản Trị</span>
                  </button>
                )}
                <button
                  onClick={() => navigate('/login')}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
                  title="Đăng nhập tài khoản hoặc quyền khác"
                >
                  Đổi quyền
                </button>
                <button
                  onClick={logout}
                  title="Đăng xuất"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center justify-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                >
                  <span>Đăng Nhập</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Body Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-3.5 space-y-3.5">
        {/* Compact Breadcrumb & Page Title in One Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-1 border-b border-slate-200/60">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Hệ Thống Căn Hộ Cho Thuê</span>
              <span className="text-xs font-normal text-slate-500 hidden sm:inline">
                • {apartments.length} phòng đầy đủ tiện nghi, nhận phòng ngay
              </span>
            </h1>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
            <span className="hover:text-slate-700 cursor-pointer" onClick={() => navigate('/')}>Dwell</span>
            <span>/</span>
            <span className="hover:text-slate-700 cursor-pointer" onClick={() => setSelectedBuildingId('ALL')}>Cho thuê</span>
            <span>/</span>
            <span className="text-slate-700 font-semibold truncate max-w-[200px]">
              {selectedBuildingId !== 'ALL' ? getBuildingName(Number(selectedBuildingId)) : 'Tất cả tòa nhà'}
            </span>
          </div>
        </div>

        {/* 2-Column Responsive Layout: Filter on Left (280px) + Listings on Right (flex-1) */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch">
          
          {/* ================= LEFT TAB: BỘ LỌC TÌM KIẾM ================= */}
          <aside className="w-full lg:w-72 shrink-0 flex flex-col">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex-1 flex flex-col justify-between">
              <div className="space-y-3.5">
                {/* Filter Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <SlidersHorizontal className="w-4 h-4 text-brand-600" />
                    <span>Bộ Lọc Tìm Kiếm</span>
                  </div>
                {(searchTerm || selectedBuildingId !== 'ALL' || selectedBedrooms !== 'ALL' || selectedPriceRange !== 'ALL') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedBuildingId('ALL');
                      setSelectedBedrooms('ALL');
                      setSelectedPriceRange('ALL');
                      setCurrentPage(1);
                    }}
                    className="text-xs text-brand-600 hover:text-brand-700 font-semibold"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              {/* 1. Keyword search */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Từ khóa tìm kiếm
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Số phòng (P.101), tên tòa nhà..."
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-8 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setCurrentPage(1);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Building / Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Khu vực & Tòa nhà
                </label>
                <div className="relative">
                  <select
                    value={selectedBuildingId}
                    onChange={(e) => {
                      setSelectedBuildingId(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2.5 font-medium text-slate-700 appearance-none focus:outline-none focus:border-brand-500 focus:bg-white cursor-pointer transition-all"
                  >
                    <option value="ALL">Tất cả khu vực / Tòa nhà</option>
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id.toString()}>{b.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* 3. Bedrooms */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Cấu trúc phòng ngủ
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'ALL', label: 'Tất cả' },
                    { id: '1', label: '1 PN (Studio)' },
                    { id: '2', label: '2 Phòng ngủ' },
                    { id: '3', label: '3 PN (Gia đình)' },
                  ].map((item) => {
                    const isSelected = selectedBedrooms === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedBedrooms(item.id);
                          setCurrentPage(1);
                        }}
                        className={`py-2 px-2.5 text-xs font-semibold rounded-xl border transition-all text-center ${
                          isSelected
                            ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Price range */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Khoảng giá thuê
                </label>
                <div className="space-y-1">
                  {[
                    { id: 'ALL', label: 'Tất cả mức giá' },
                    { id: 'UNDER_10M', label: 'Dưới 10 triệu / tháng' },
                    { id: '10M_15M', label: 'Từ 10 - 15 triệu / tháng' },
                    { id: '15M_20M', label: 'Từ 15 - 20 triệu / tháng' },
                    { id: 'OVER_20M', label: 'Trên 20 triệu / tháng' },
                  ].map((p) => {
                    const isSelected = selectedPriceRange === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPriceRange(p.id);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left py-2 px-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-brand-50 text-brand-700 border-brand-300 font-bold'
                            : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <span>{p.label}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

              {/* Bottom: Featured Buildings & Quality Trust Badge */}
              <div className="pt-3 mt-3 border-t border-slate-100 space-y-2.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-brand-600" />
                  <span>Tòa nhà nổi bật</span>
                </div>
                <div className="space-y-1.5">
                  {buildings.slice(0, 3).map((b) => {
                    const count = apartments.filter(a => a.buildingId === b.id).length;
                    const isSelected = selectedBuildingId === b.id.toString();
                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          setSelectedBuildingId(isSelected ? 'ALL' : b.id.toString());
                          setCurrentPage(1);
                        }}
                        className={`p-2 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50/80 text-brand-700 font-bold'
                            : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="font-semibold truncate">{b.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{b.address}</div>
                        </div>
                        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium shrink-0">
                          {count} căn
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% căn hộ thực tế, xem phòng trực tiếp miễn phí.</span>
                </div>
              </div>
            </div>
          </aside>

          {/* ================= RIGHT COLUMN: DANH SÁCH CĂN HỘ ================= */}
          <div className="flex-1 min-w-0 space-y-3.5 flex flex-col justify-between">
            
            {/* Results Counter & Sort & View Mode Bar */}
            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
              <div className="text-slate-600 font-medium">
                {sortedApartments.length > 0 ? (
                  <>
                    Hiển thị <strong>{Math.min((currentPage - 1) * pageSize + 1, sortedApartments.length)} - {Math.min(currentPage * pageSize, sortedApartments.length)}</strong> / <strong>{sortedApartments.length}</strong> căn hộ
                  </>
                ) : (
                  <span>Không tìm thấy căn hộ phù hợp tiêu chí</span>
                )}
              </div>

              <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
                {/* View Mode Toggle: Grid vs Compact List */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/70">
                  <button
                    type="button"
                    onClick={() => setViewMode('GRID')}
                    className={`p-1 rounded-md transition-colors ${
                      viewMode === 'GRID' 
                        ? 'bg-white text-brand-600 shadow-2xs' 
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title="Hiển thị dạng lưới (Xem được nhiều căn/màn hình)"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('LIST')}
                    className={`p-1 rounded-md transition-colors ${
                      viewMode === 'LIST' 
                        ? 'bg-white text-brand-600 shadow-2xs' 
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title="Hiển thị danh sách siêu gọn"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-400 text-[11px] hidden sm:inline">Sắp xếp:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-semibold focus:outline-none focus:border-brand-500 cursor-pointer"
                  >
                    <option value="DEFAULT">Mới nhất</option>
                    <option value="PRICE_ASC">Giá: Thấp đến cao</option>
                    <option value="PRICE_DESC">Giá: Cao đến thấp</option>
                    <option value="AREA_DESC">Diện tích: Lớn nhất</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Apartment Cards */}
            {sortedApartments.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-800">Không tìm thấy căn hộ phù hợp</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Vui lòng điều chỉnh lại mức giá hoặc chọn cấu trúc phòng ngủ khác ở bộ lọc bên trái.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedBuildingId('ALL');
                    setSelectedBedrooms('ALL');
                    setSelectedPriceRange('ALL');
                    setCurrentPage(1);
                  }}
                  className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            ) : (
              <>
                {viewMode === 'GRID' ? (
                  /* ================= MODE 1: GRID 3 CỘT GỌN GÀNG ================= */
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {paginatedApartments.map((apt) => {
                  const buildingName = apt.buildingName || getBuildingName(apt.buildingId);
                  const address = getBuildingAddress(apt.buildingId);
                  const isAvailable = apt.status === 'AVAILABLE';

                  return (
                    <div
                      key={apt.id}
                      onClick={() => navigate(`/apartments/${apt.id}`)}
                      className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden hover:shadow-soft hover:border-brand-400 transition-all flex flex-col group cursor-pointer"
                    >
                      {/* Image Thumbnail */}
                      <div className="w-full h-36 relative bg-slate-100 overflow-hidden shrink-0">
                        <img
                          src={apt.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80';
                          }}
                          alt={apt.roomNumber}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />

                        {/* Top Status Badge */}
                        <div className="absolute top-2 left-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shadow-2xs ${
                            isAvailable 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-amber-600 text-white'
                          }`}>
                            {isAvailable ? 'Sẵn sàng dọn vào' : 'Đang thuê'}
                          </span>
                        </div>

                        {/* Bottom Photo Count Badge */}
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1 backdrop-blur-xs">
                          <Camera className="w-3 h-3" />
                          <span>{6 + (apt.id % 4)}</span>
                        </div>
                      </div>

                      {/* Content Details Area */}
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          {/* Title */}
                          <h2 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1 leading-snug">
                            Căn hộ P.{apt.roomNumber} - {buildingName}
                          </h2>

                          {/* Location */}
                          <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-1 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{address}</span>
                          </div>

                          {/* Specs Row */}
                          <div className="flex items-center gap-2 text-[11px] text-slate-600 font-semibold mt-2 py-1 px-2 bg-slate-50 rounded-lg">
                            <span>{apt.areaSqm} m²</span>
                            <span className="text-slate-300">•</span>
                            <span>{apt.bedrooms} PN</span>
                            <span className="text-slate-300">•</span>
                            <span>{apt.bathrooms} WC</span>
                            <span className="text-slate-300">•</span>
                            <span>Tầng {apt.floor}</span>
                          </div>
                        </div>

                        {/* Bottom Row: Price & Actions */}
                        <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <div className="text-sm sm:text-base font-extrabold text-brand-700 leading-tight">
                              {formatPriceVND(apt.price)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Cọc: {formatCurrency(apt.depositDefault)}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBookingModalApartment(apt);
                            }}
                            className="px-2.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors shrink-0"
                          >
                            Đặt lịch
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ================= MODE 2: DANH SÁCH SIÊU GỌN ================= */
              <div className="space-y-2">
                {paginatedApartments.map((apt) => {
                  const buildingName = apt.buildingName || getBuildingName(apt.buildingId);
                  const address = getBuildingAddress(apt.buildingId);
                  const isAvailable = apt.status === 'AVAILABLE';

                  return (
                    <div
                      key={apt.id}
                      onClick={() => navigate(`/apartments/${apt.id}`)}
                      className="bg-white border border-slate-200/90 rounded-xl p-2.5 hover:shadow-soft hover:border-brand-300 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                    >
                      {/* Left: Image thumbnail */}
                      <div className="w-24 sm:w-28 h-20 shrink-0 relative rounded-lg overflow-hidden bg-slate-100">
                        <img
                          src={apt.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80';
                          }}
                          alt={apt.roomNumber}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute top-1 left-1">
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            isAvailable ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                          }`}>
                            {isAvailable ? 'Trống' : 'Thuê'}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Details */}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors truncate">
                          P.{apt.roomNumber} - {buildingName}
                        </h2>
                        <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium mt-1">
                          <span>{apt.areaSqm} m²</span>
                          <span>•</span>
                          <span>{apt.bedrooms} PN</span>
                          <span>•</span>
                          <span>{apt.bathrooms} WC</span>
                          <span>•</span>
                          <span>Tầng {apt.floor}</span>
                        </div>
                      </div>

                      {/* Right: Price & Button */}
                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <div>
                          <div className="text-xs sm:text-sm font-extrabold text-brand-700">
                            {formatPriceVND(apt.price)}
                          </div>
                          <div className="text-[10px] text-slate-400 hidden sm:block">
                            Cọc: {formatCurrency(apt.depositDefault)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBookingModalApartment(apt);
                          }}
                          className="px-2.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
                        >
                          Đặt lịch
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={sortedApartments.length}
                  pageSize={pageSize}
                  itemLabel="căn hộ"
                />
              </>
            )}
          </div>
        </div>
        {/* ================= PHẦN HỖ TRỢ CHO CUỐI TRANG ================= */}
      </main>

      {/* 4. Comprehensive Real-Estate Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16 text-slate-700">
        {/* Top Contact Strip */}
        <div className="border-b border-slate-200/80 bg-slate-50/70">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Brand Logo */}
              <div className="md:col-span-4 flex items-center">
                <DwellLogo badge="Living 4.0" badgeVariant="sky" size="md" />
              </div>

              {/* Contact Pill 1: Hotline */}
              <div className="md:col-span-3 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center shrink-0 shadow-xs">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider">Hotline tư vấn</div>
                  <a href="tel:19008899" className="text-sm font-bold text-slate-900 hover:text-brand-600 transition-colors">
                    1900 8899 - 0912 345 678
                  </a>
                </div>
              </div>

              {/* Contact Pill 2: Resident Support */}
              <div className="md:col-span-3 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0 shadow-xs">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider">Hỗ trợ khách hàng</div>
                  <a href="mailto:trogiup@dwell.vn" className="text-sm font-bold text-slate-900 hover:text-brand-600 transition-colors">
                    trogiup@dwell.vn
                  </a>
                </div>
              </div>

              {/* Contact Pill 3: Partnerships */}
              <div className="md:col-span-2 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider">Chăm sóc khách hàng</div>
                  <a href="mailto:hotro@dwell.vn" className="text-sm font-bold text-slate-900 hover:text-[#00a680] transition-colors">
                    hotro@dwell.vn
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer Links & Info Grid */}
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 text-xs">
            {/* Column 1: Company Profile (4 cols) */}
            <div className="lg:col-span-4 space-y-3.5">
              <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider">
                CÔNG TY CỔ PHẦN CÔNG NGHỆ BẤT ĐỘNG SẢN DWELL VIỆT NAM
              </h4>

              <div className="flex items-start space-x-2 text-slate-600 leading-relaxed">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Tầng 12, Tòa nhà Sunshine Center, Số 16 Phạm Hùng, Phường Mỹ Đình 2, Quận Nam Từ Liêm, TP. Hà Nội, Việt Nam
                </span>
              </div>

              <div className="flex items-center space-x-2 text-slate-600">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>(024) 3562 5939 - (028) 7300 8899</span>
              </div>

              {/* QR Code & App Download Badges */}
              <div className="pt-2 flex items-center space-x-4">
                <div className="w-20 h-20 p-1.5 bg-white border border-slate-300 rounded-lg shadow-2xs flex flex-col items-center justify-center shrink-0 text-center">
                  <QrCode className="w-12 h-12 text-slate-800" />
                  <span className="text-[9px] text-slate-500 font-medium mt-0.5 leading-none">Quét tải App</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg cursor-pointer hover:bg-slate-800 transition-colors shadow-2xs">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M3.609 1.814L13.792 12 3.61 22.186c-.198-.182-.317-.442-.317-.745V2.559c0-.303.119-.563.316-.745zm11.235 11.235l2.052-2.052-2.052-2.052 1.341-1.341 3.393 3.393-3.393 3.393-1.341-1.341zM5.023.4l10.187 10.187-2.052 2.052L4.01 3.491c.217-.37.6-.669 1.013-.691v.001l-.001-.001-.001-.001-.001-.001-.001-.001.014-.399zm8.135 13.588l2.052 2.052L5.023 23.6c-.413-.022-.796-.321-1.013-.691l9.148-9.148v.227z"/></svg>
                    <div>
                      <div className="text-[8px] text-slate-400 uppercase leading-none">Tải về trên</div>
                      <div className="text-[11px] font-bold leading-none mt-0.5">Google Play</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg cursor-pointer hover:bg-slate-800 transition-colors shadow-2xs">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.64 1.35-.58.66-1.08 1.73-.95 2.76 1.01.08 2.03-.51 2.66-1.26z"/></svg>
                    <div>
                      <div className="text-[8px] text-slate-400 uppercase leading-none">Tải về trên</div>
                      <div className="text-[11px] font-bold leading-none mt-0.5">App Store</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Guide & Services (3 cols) */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider">
                HƯỚNG DẪN & DỊCH VỤ
              </h4>
              <ul className="space-y-2 text-slate-600">
                <li><span className="hover:text-[#00c5a0] transition-colors cursor-pointer" onClick={() => setFooterModalKey('ABOUT_US')}>Về chúng tôi (Dwell Living)</span></li>
                <li><span className="hover:text-[#00c5a0] transition-colors cursor-pointer" onClick={() => setFooterModalKey('PRICING_FEES')}>Báo giá thuê phòng & chi phí dịch vụ</span></li>
                <li><span className="hover:text-[#00c5a0] transition-colors cursor-pointer" onClick={() => setFooterModalKey('AI_CONTRACT_PROCESS')}>Quy trình ký hợp đồng điện tử AI</span></li>
                <li><span className="hover:text-[#00c5a0] transition-colors cursor-pointer" onClick={() => setFooterModalKey('VIETQR_PAYMENT_GUIDE')}>Hướng dẫn thanh toán VietQR Napas247</span></li>
                <li><span className="hover:text-[#00c5a0] transition-colors cursor-pointer" onClick={() => setFooterModalKey('FAQ_RESIDENTS')}>Câu hỏi thường gặp (FAQ cư dân)</span></li>
                <li><span className="hover:text-[#00c5a0] transition-colors cursor-pointer" onClick={() => setFooterModalKey('FEEDBACK_REPORT')}>Góp ý & báo lỗi kỹ thuật</span></li>
                <li><span className="hover:text-[#00c5a0] transition-colors cursor-pointer" onClick={() => setFooterModalKey('FLOOR_PLANS')}>Sơ đồ mặt bằng các tòa nhà</span></li>
              </ul>
            </div>

            {/* Column 3: Regulations & Legal (2 cols) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider">
                QUY ĐỊNH & PHÁP LÝ
              </h4>
              <ul className="space-y-2 text-slate-600">
                <li><span className="hover:text-[#00c5a0] transition-colors cursor-pointer" onClick={() => setFooterModalKey('BUILDING_RULES')}>Nội quy quản lý tòa nhà</span></li>
                <li><span className="hover:text-[#00c5a0] transition-colors cursor-pointer" onClick={() => setFooterModalKey('RESIDENCE_REGISTRATION')}>Quy định đăng ký tạm trú số</span></li>
                <li><span className="hover:text-[#00c5a0] transition-colors cursor-pointer" onClick={() => setFooterModalKey('LEASE_TERMS')}>Điều khoản thỏa thuận thuê</span></li>
                <li><span className="hover:text-[#00c5a0] transition-colors cursor-pointer" onClick={() => setFooterModalKey('PRIVACY_POLICY')}>Chính sách bảo mật thông tin</span></li>
                <li><span className="hover:text-[#00c5a0] transition-colors cursor-pointer" onClick={() => setFooterModalKey('DISPUTE_RESOLUTION')}>Giải quyết khiếu nại cư dân</span></li>
                <li><span className="hover:text-[#00c5a0] transition-colors cursor-pointer" onClick={() => setFooterModalKey('LEGAL_COMPLIANCE')}>Pháp lý ký số hợp đồng AI</span></li>
              </ul>
            </div>

            {/* Column 4: Newsletter & Language (3 cols) */}
            <div className="lg:col-span-3 space-y-3.5">
              <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider">
                ĐĂNG KÝ NHẬN TIN ƯU ĐÃI
              </h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Nhận thông báo tự động khi có căn hộ mới trống hoặc chính sách giảm giá thuê đặc biệt.
              </p>

              <form onSubmit={handleSubscribeNewsletter} className="flex items-center">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Nhập email của bạn"
                  className="flex-1 bg-slate-50 border border-slate-300 border-r-0 rounded-l-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00c5a0]"
                />
                <button
                  type="submit"
                  title="Gửi đăng ký nhận tin"
                  className="bg-rose-500 hover:bg-rose-600 text-white px-3.5 py-2 rounded-r-lg transition-colors flex items-center justify-center shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              <div className="pt-2">
                <label className="font-bold text-slate-900 uppercase text-[11px] tracking-wider block mb-1.5">
                  QUỐC GIA & NGÔN NGỮ
                </label>
                <div className="relative">
                  <select className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 appearance-none focus:outline-none focus:border-brand-500">
                    <option value="vi">Việt Nam (Tiếng Việt)</option>
                    <option value="en">English (US)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* Bottom Copyright & Tech Stack */}
        <div className="border-t border-slate-200 bg-slate-100/60 py-4 text-center text-xs text-slate-500">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              © 2026 Dwell Living. Bản quyền thuộc về <strong className="text-slate-700 font-semibold">Đề tài 12 – Hệ Thống Quản Lý Căn Hộ Cho Thuê Thông Minh & Hợp Đồng Điện Tử AI</strong>.
            </div>
            <div className="flex items-center space-x-3 text-[11px] text-slate-400">
              <span>Hỗ trợ RAG AI Copilot</span>
              <span>•</span>
              <span>Thanh toán VietQR Napas247</span>
              <span>•</span>
              <span>Giám sát IoT</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 4. Booking Appointment Modal (UC011) */}
      {bookingModalApartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-teal-600 to-sky-700 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>Đặt Lịch Xem Căn {bookingModalApartment.roomNumber}</span>
                </h3>
                <p className="text-xs text-teal-100 mt-0.5">
                  {bookingModalApartment.buildingName} • Giá: {formatPriceVND(bookingModalApartment.price)}
                </p>
              </div>
              <button
                onClick={() => setBookingModalApartment(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên quý khách <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={bookingForm.guestName}
                  onChange={(e) => setBookingForm({ ...bookingForm, guestName: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c5a0]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số điện thoại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={bookingForm.guestPhone}
                    onChange={(e) => setBookingForm({ ...bookingForm, guestPhone: e.target.value })}
                    placeholder="0912 345 678"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c5a0]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email nhận xác nhận
                  </label>
                  <input
                    type="email"
                    value={bookingForm.guestEmail}
                    onChange={(e) => setBookingForm({ ...bookingForm, guestEmail: e.target.value })}
                    placeholder="name@gmail.com"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c5a0]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày muốn xem phòng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingForm.viewingDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, viewingDate: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c5a0]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Khung giờ
                  </label>
                  <select
                    value={bookingForm.viewingTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, viewingTime: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                  >
                    <option value="09:00">09:00 Sáng</option>
                    <option value="10:00">10:00 Sáng</option>
                    <option value="14:00">14:00 Chiều</option>
                    <option value="16:00">16:00 Chiều</option>
                    <option value="18:00">18:00 Tối</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú hoặc yêu cầu riêng
                </label>
                <textarea
                  rows={2}
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setBookingModalApartment(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isBookingLoading}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
                >
                  {isBookingLoading ? 'Đang gửi...' : 'Xác Nhận Đặt Lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Information Modal */}
      <FooterInfoModal
        modalKey={footerModalKey}
        onClose={() => setFooterModalKey(null)}
        onOpenAIChat={() => window.dispatchEvent(new CustomEvent('open-rag-chatbot'))}
      />
    </div>
  );
};
