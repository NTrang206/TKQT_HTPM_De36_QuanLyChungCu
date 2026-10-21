import React, { useState } from 'react';
import { 
  X, FileText, CheckCircle2, ShieldCheck, MapPin, Phone, Mail, 
  Clock, DollarSign, HelpCircle, AlertTriangle, Send, Sparkles, 
  Building2, QrCode, Lock, Check, Layers, ChevronRight, Scale
} from 'lucide-react';
import { AIBotLogo } from './AIBotLogo';
import { useToast } from '../../hooks/useToast';

export type FooterModalKey = 
  | 'ABOUT_US'
  | 'PRICING_FEES'
  | 'AI_CONTRACT_PROCESS'
  | 'VIETQR_PAYMENT_GUIDE'
  | 'FAQ_RESIDENTS'
  | 'FEEDBACK_REPORT'
  | 'FLOOR_PLANS'
  | 'BUILDING_RULES'
  | 'RESIDENCE_REGISTRATION'
  | 'LEASE_TERMS'
  | 'PRIVACY_POLICY'
  | 'DISPUTE_RESOLUTION'
  | 'LEGAL_COMPLIANCE';

interface FooterInfoModalProps {
  modalKey: FooterModalKey | null;
  onClose: () => void;
  onOpenAIChat?: () => void;
}

export const FooterInfoModal: React.FC<FooterInfoModalProps> = ({
  modalKey,
  onClose,
  onOpenAIChat
}) => {
  const { showSuccessToast } = useToast();

  // State for Feedback Form
  const [feedbackForm, setFeedbackForm] = useState({
    senderName: '',
    senderPhone: '',
    roomCode: '',
    issueType: 'Kỹ thuật & Thiết bị',
    content: ''
  });

  if (!modalKey) return null;

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackForm.senderName.trim() || !feedbackForm.content.trim()) return;
    showSuccessToast(`Đã tiếp nhận yêu cầu phản hồi từ Quý khách (${feedbackForm.senderName}). Ban Quản Lý Dwell sẽ liên hệ xử lý trong vòng 30 phút!`);
    setFeedbackForm({
      senderName: '',
      senderPhone: '',
      roomCode: '',
      issueType: 'Kỹ thuật & Thiết bị',
      content: ''
    });
    onClose();
  };

  const renderModalContent = () => {
    switch (modalKey) {
      case 'ABOUT_US':
        return (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-brand-50 to-sky-50 p-4 rounded-xl border border-brand-100 flex items-start gap-3">
              <Building2 className="w-6 h-6 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Hệ Thống Quản Lý Căn Hộ Cho Thuê Dwell Living</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Dwell Living là nền tảng tiên phong ứng dụng công nghệ 4.0 trong lĩnh vực quản lý vận hành và cho thuê căn hộ thông minh tại Việt Nam. Chúng tôi kết hợp trí tuệ nhân tạo (AI RAG Copilot), thanh toán VietQR Napas247 tự động và hợp đồng điện tử bảo mật để mang lại trải nghiệm sống đẳng cấp, minh bạch nhất.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-xs">
                <div className="text-2xl font-black text-brand-600">500+</div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">Cư dân đang sinh sống</div>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-xs">
                <div className="text-2xl font-black text-sky-600">3 Tòa nhà</div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">Hà Nội & TP. Hồ Chí Minh</div>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-xs">
                <div className="text-2xl font-black text-amber-500">98.6%</div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">Mức độ hài lòng dịch vụ</div>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Hệ Sinh Thái Tiện Ích Số 4.0:</h5>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>AI Copilot & Trợ lý ảo RAG:</strong> Hỏi đáp tức thì nội quy tòa nhà, biểu phí và hỗ trợ cư dân 24/7.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>Hợp đồng pháp lý số:</strong> Rà soát điều khoản tự động, ký kết online không cần giấy tờ.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>Thanh toán VietQR Napas247:</strong> Gạch nợ hóa đơn điện nước, dịch vụ tức thì sau 3 giây.</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'PRICING_FEES':
        return (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Bảng biểu chi phí thuê phòng và dịch vụ tại hệ thống căn hộ Dwell Living được niêm yết công khai, minh bạch, không phát sinh phụ phí ẩn:
            </p>

            <div className="overflow-hidden border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Loại căn hộ / Dịch vụ</th>
                    <th className="py-2.5 px-3">Diện tích</th>
                    <th className="py-2.5 px-3 text-right">Đơn giá niêm yết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">Căn 1PN Studio Cao Cấp</td>
                    <td className="py-2.5 px-3">38 - 48 m²</td>
                    <td className="py-2.5 px-3 text-right font-bold text-brand-700">6.500.000 – 9.000.000 đ/tháng</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">Căn 2PN Chuẩn Gia Đình</td>
                    <td className="py-2.5 px-3">65 - 78 m²</td>
                    <td className="py-2.5 px-3 text-right font-bold text-brand-700">10.000.000 – 15.000.000 đ/tháng</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">Căn 3PN / Sky Panorama</td>
                    <td className="py-2.5 px-3">85 - 130 m²</td>
                    <td className="py-2.5 px-3 text-right font-bold text-brand-700">16.000.000 – 24.000.000 đ/tháng</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="py-2.5 px-3 font-medium">Phí quản lý vận hành</td>
                    <td className="py-2.5 px-3">Theo m²</td>
                    <td className="py-2.5 px-3 text-right font-semibold">12.000 đ/m²/tháng</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="py-2.5 px-3 font-medium">Điện sinh hoạt</td>
                    <td className="py-2.5 px-3">Theo công tơ riêng</td>
                    <td className="py-2.5 px-3 text-right font-semibold">Biểu giá EVN Nhà nước</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="py-2.5 px-3 font-medium">Nước sinh hoạt</td>
                    <td className="py-2.5 px-3">Theo đồng hồ đo</td>
                    <td className="py-2.5 px-3 text-right font-semibold">18.000 đ/m³</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="py-2.5 px-3 font-medium">Phí gửi xe máy / Ô tô</td>
                    <td className="py-2.5 px-3">Thẻ từ thông minh</td>
                    <td className="py-2.5 px-3 text-right font-semibold">100.000 đ / 1.200.000 đ/tháng</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Tiền đặt cọc bảo đảm là 01 tháng tiền phòng và được hoàn trả 100% khi thanh lý hợp đồng.</span>
            </div>
          </div>
        );

      case 'AI_CONTRACT_PROCESS':
        return (
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Chỉ mất chưa đầy 05 phút để hoàn tất quy trình thuê nhà trực tuyến chuẩn pháp lý với sự hỗ trợ của trí tuệ nhân tạo:
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                <div>
                  <h6 className="font-bold text-slate-900">Xem phòng & Khóa căn ưng ý</h6>
                  <p className="text-slate-500 mt-0.5">Đặt lịch xem phòng thực tế trực tiếp hoặc sử dụng tính năng xem phòng 3D ảo và AI Matcher để lựa chọn phòng phù hợp nhất.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                <div>
                  <h6 className="font-bold text-slate-900">AI tự động tạo hợp đồng chuẩn pháp lý</h6>
                  <p className="text-slate-500 mt-0.5">Hệ thống phân tích thông tin CCCD, mức giá, thời hạn thuê và sinh hợp đồng điện tử chuẩn mẫu Luật Nhà Ở Việt Nam.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
                <div>
                  <h6 className="font-bold text-slate-900">Ký số điện tử bảo mật (OTP / e-Sign)</h6>
                  <p className="text-slate-500 mt-0.5">Xác thực mã số OTP qua tin nhắn SMS/Email chính chủ. Hợp đồng được đính kèm chữ ký số và mã hóa bảo mật SHA-256.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">4</span>
                <div>
                  <h6 className="font-bold text-slate-900">Đặt cọc VietQR & Nhận bàn giao phòng</h6>
                  <p className="text-slate-500 mt-0.5">Quét mã VietQR chuyển tiền cọc tự động. Hệ thống kích hoạt thẻ cư dân số và bàn giao chìa khóa phòng ngay trong ngày.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'VIETQR_PAYMENT_GUIDE':
        return (
          <div className="space-y-4 text-xs text-slate-600">
            <p>
              Dwell Living hợp tác cùng Napas247 và mạng lưới 40+ ngân hàng Việt Nam hỗ trợ thanh toán tiền phòng, dịch vụ tự động chỉ bằng một chạm:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center mx-auto mb-2">1</div>
                <div className="font-bold text-slate-900">Mở Cổng Cư Dân</div>
                <div className="text-[11px] text-slate-500 mt-1">Truy cập mục Hóa đơn hoặc Thông báo đóng tiền phòng</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 font-bold flex items-center justify-center mx-auto mb-2">2</div>
                <div className="font-bold text-slate-900">Quét Mã VietQR</div>
                <div className="text-[11px] text-slate-500 mt-1">Mở App ngân hàng (VCB, TCB, MB...) quét mã QR chứa sẵn số tiền & nội dung</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center mx-auto mb-2">3</div>
                <div className="font-bold text-slate-900">Gạch Nợ Sau 3 Giây</div>
                <div className="text-[11px] text-slate-500 mt-1">Hệ thống nhận biến động số dư và cấp biên lai điện tử tức thì</div>
              </div>
            </div>

            <div className="bg-brand-50/70 p-3.5 rounded-xl border border-brand-200 text-brand-950">
              <div className="font-bold mb-1 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-brand-600" />
                <span>Không cần nhớ số tài khoản – Không lo gõ nhầm cú pháp</span>
              </div>
              <p className="text-[11px] text-brand-800 leading-relaxed">
                Mỗi hóa đơn đều gắn mã giao dịch định danh duy nhất (Virtual Account). Tiền được hạch toán ngay lập tức kể cả đêm muộn, ngày lễ hoặc cuối tuần.
              </p>
            </div>
          </div>
        );

      case 'FAQ_RESIDENTS':
        return (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <h6 className="font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Tòa nhà có cho phép nuôi thú cưng (chó, mèo) không?</span>
              </h6>
              <p className="text-slate-600 mt-1.5 pl-6 leading-relaxed">
                Có. Cư dân được phép nuôi chó/mèo dưới 10kg tại các tầng quy định, với điều kiện đã tiêm vắc-xin phòng dại đầy đủ và cam kết giữ vệ sinh khi sử dụng thang máy hàng.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <h6 className="font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Giờ giấc ra vào sảnh tòa nhà có bị giới hạn ban đêm không?</span>
              </h6>
              <p className="text-slate-600 mt-1.5 pl-6 leading-relaxed">
                Không giới hạn. Cổng sảnh và thang máy mở 24/7 với thẻ từ cư dân thông minh hoặc quét khuôn mặt FaceID. Đội ngũ an ninh túc trực 24/24.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <h6 className="font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Khung giờ được phép chuyển đồ hoặc khoan tường sửa chữa?</span>
              </h6>
              <p className="text-slate-600 mt-1.5 pl-6 leading-relaxed">
                Khung giờ chuyển đồ: 08:30 - 11:30 và 13:30 - 17:00 (Thứ 2 đến Thứ 7). Không gây tiếng ồn vào buổi trưa hoặc ngày Chủ nhật.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <h6 className="font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Tiền đặt cọc được hoàn trả như thế nào khi hết hạn hợp đồng?</span>
              </h6>
              <p className="text-slate-600 mt-1.5 pl-6 leading-relaxed">
                Ban Quản Lý sẽ hoàn trả 100% tiền cọc qua chuyển khoản ngân hàng trong vòng tối đa 03 ngày làm việc sau khi hai bên nghiệm thu bàn giao phòng.
              </p>
            </div>
          </div>
        );

      case 'FEEDBACK_REPORT':
        return (
          <form onSubmit={handleFeedbackSubmit} className="space-y-3.5 text-xs">
            <p className="text-slate-600">
              Ý kiến đóng góp và phản hồi từ Quý cư dân giúp Dwell Living không ngừng nâng cao chất lượng dịch vụ:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và tên Quý khách *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={feedbackForm.senderName}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, senderName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#00c5a0]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số điện thoại liên hệ *</label>
                <input
                  type="tel"
                  required
                  placeholder="0912 345 678"
                  value={feedbackForm.senderPhone}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, senderPhone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#00c5a0]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã căn hộ (nếu có)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: P.402 Sunshine Tower"
                  value={feedbackForm.roomCode}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, roomCode: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#00c5a0]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Loại phản ánh</label>
                <select
                  value={feedbackForm.issueType}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, issueType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#00c5a0]"
                >
                  <option value="Kỹ thuật & Thiết bị">Báo hỏng kỹ thuật / Điện nước</option>
                  <option value="Vệ sinh & Cảnh quan">Vệ sinh & Rác thải hành lang</option>
                  <option value="An ninh & Trật tự">An ninh & Tiếng ồn</option>
                  <option value="Góp ý ứng dụng">Đóng góp ý tưởng ứng dụng Dwell</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nội dung chi tiết *</label>
              <textarea
                rows={3}
                required
                placeholder="Vui lòng mô tả cụ thể vấn đề hoặc ý kiến đóng góp của bạn..."
                value={feedbackForm.content}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, content: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-800 focus:outline-none focus:border-[#00c5a0] resize-none"
              />
            </div>

            <div className="pt-1 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi Phản Hồi Ngay</span>
              </button>
            </div>
          </form>
        );

      case 'FLOOR_PLANS':
        return (
          <div className="space-y-4 text-xs text-slate-600">
            <p>Hệ thống tòa nhà Dwell Living được quy hoạch theo chuẩn kiến trúc xanh hiện đại:</p>

            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between font-bold text-slate-900 text-sm">
                  <span className="flex items-center"><Building2 className="w-4 h-4 text-brand-600 inline mr-2 shrink-0" /> Tòa Sunshine Tower A – Cầu Giấy / Nam Từ Liêm</span>
                  <span className="text-xs text-brand-600 font-bold">25 Tầng</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-[11px] text-slate-500">
                  <div>Tầng hầm: 02 tầng đỗ xe</div>
                  <div>Tầng 1-3: TTTM & Shophouse</div>
                  <div>Tầng 4-24: Căn hộ 1PN - 2PN</div>
                  <div>Tầng 25: Sky Lounge & Vườn</div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between font-bold text-slate-900 text-sm">
                  <span className="flex items-center"><Building2 className="w-4 h-4 text-sky-600 inline mr-2 shrink-0" /> Tòa Sky Park Residence – Bình Thạnh, TP.HCM</span>
                  <span className="text-xs text-sky-600">30 Tầng</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-[11px] text-slate-500">
                  <div>Tầng hầm: 03 tầng ô tô/xe máy</div>
                  <div>Tầng 5: Hồ bơi tràn bờ & Gym</div>
                  <div>Tầng 6-28: Căn hộ 2PN - 3PN</div>
                  <div>Tầng 29-30: Penthouse Panorama</div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between font-bold text-slate-900 text-sm">
                  <span className="flex items-center"><Building2 className="w-4 h-4 text-amber-600 inline mr-2 shrink-0" /> Tòa Sunshine Golden River – Tây Hồ, Hà Nội</span>
                  <span className="text-xs text-amber-600">28 Tầng</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-[11px] text-slate-500">
                  <div>Tầng hầm: 02 tầng bãi đỗ xe</div>
                  <div>Tầng 1-2: Co-working Space</div>
                  <div>Tầng 3-27: Căn hộ thông minh</div>
                  <div>Tầng 28: Đài ngắm cảnh Sông Hồng</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'BUILDING_RULES':
        return (
          <div className="space-y-3.5 text-xs text-slate-600">
            <p className="leading-relaxed">
              Mọi cư dân và khách lưu trú tại hệ thống Dwell Living đều cam kết tuân thủ 06 điều khoản nội quy vì môi trường sống văn minh, an toàn:
            </p>

            <div className="space-y-2.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-rose-100 text-rose-700 font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                <div>
                  <strong className="text-slate-900 block">An toàn PCCC & Đốt lửa:</strong>
                  <span>Nghiêm cấm thắp hương đốt vàng mã ngoài hành lang hoặc ban công. Hệ thống cảm biến khói IoT được kích hoạt 24/24.</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                <div>
                  <strong className="text-slate-900 block">Trật tự & Tiếng ồn:</strong>
                  <span>Không phát nhạc công suất lớn, tụ tập gây ồn ào ảnh hưởng căn hộ lân cận sau 22:00 đêm và trong giờ nghỉ trưa (12:00 - 13:30).</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                <div>
                  <strong className="text-slate-900 block">Vệ sinh hành lang & Phân loại rác:</strong>
                  <span>Túi rác phải được buộc kín và bỏ vào họng rác tự động từng tầng. Không để giày dép hoặc đồ đạc cản trở lối thoát hiểm.</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center justify-center shrink-0">4</span>
                <div>
                  <strong className="text-slate-900 block">Sử dụng thang máy & Thẻ từ an ninh:</strong>
                  <span>Quẹt thẻ từ đúng tầng căn hộ. Nghiêm cấm dùng vật cản giữ cửa thang máy hoặc chở hàng cồng kềnh bằng thang máy khách.</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 font-bold text-[11px] flex items-center justify-center shrink-0">5</span>
                <div>
                  <strong className="text-slate-900 block">Khai báo khách lưu trú qua đêm:</strong>
                  <span>Trường hợp có người thân hoặc khách ở lại qua đêm, vui lòng khai báo nhanh trên Cổng Cư Dân trước 23:00 theo quy định tạm trú.</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'RESIDENCE_REGISTRATION':
        return (
          <div className="space-y-4 text-xs text-slate-600">
            <p>
              Ban Quản Lý Dwell Living hỗ trợ toàn diện thủ tục đăng ký tạm trú điện tử cho mọi cư dân theo Luật Cư Trú năm 2020:
            </p>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <h6 className="font-bold text-slate-900">Hồ sơ cần chuẩn bị (gửi file ảnh qua ứng dụng):</h6>
              <div className="space-y-1.5 pl-2">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Bản chụp 02 mặt Căn cước công dân (hoặc Hộ chiếu / Visa còn hạn đối với khách nước ngoài).</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Hợp đồng thuê căn hộ điện tử Dwell Living (đã ký số thành công).</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Tài khoản định danh điện tử VNeID mức độ 2 (để xác thực trực tuyến).</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-brand-50/70 rounded-xl border border-brand-200 text-brand-950 flex items-center justify-between">
              <div>
                <div className="font-bold">Thời gian hoàn thành: 02 - 03 ngày làm việc</div>
                <div className="text-[11px] text-brand-800 mt-0.5">Kết quả xác nhận tạm trú sẽ được gửi qua VNeID và lưu trữ tại hồ sơ cư dân.</div>
              </div>
              <ShieldCheck className="w-8 h-8 text-brand-600 shrink-0" />
            </div>
          </div>
        );

      case 'LEASE_TERMS':
        return (
          <div className="space-y-3.5 text-xs text-slate-600">
            <p>Tóm tắt các điều khoản hợp đồng thuê căn hộ chuẩn mực tại Dwell Living:</p>
            <div className="space-y-2">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <strong className="text-slate-900 block">1. Tiền thuê & Kỳ thanh toán:</strong>
                <span>Tiền thuê thanh toán định kỳ từ ngày 01 đến ngày 05 hàng tháng qua hệ thống VietQR tự động.</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <strong className="text-slate-900 block">2. Tiền đặt cọc bảo đảm:</strong>
                <span>Tiền cọc nhằm bảo đảm trách nhiệm giữ gìn thiết bị, không dùng thay thế tiền thuê nhà. Hoàn trả đầy đủ sau khi thanh lý.</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <strong className="text-slate-900 block">3. Chấm dứt hợp đồng:</strong>
                <span>Bên muốn chấm dứt hợp đồng trước hạn cần thông báo bằng văn bản hoặc qua Cổng Cư Dân trước tối thiểu 30 ngày.</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <strong className="text-slate-900 block">4. Bảo trì & Sửa chữa:</strong>
                <span>Hao mòn tự nhiên (thấm dột, hệ thống điện âm tường) do bên cho thuê chịu trách nhiệm sửa chữa miễn phí trong 24h.</span>
              </div>
            </div>
          </div>
        );

      case 'PRIVACY_POLICY':
        return (
          <div className="space-y-3 text-xs text-slate-600">
            <div className="bg-sky-50 p-3 rounded-xl border border-sky-100 flex items-center gap-2.5 text-sky-900 font-semibold">
              <Lock className="w-5 h-5 text-sky-600 shrink-0" />
              <span>Cam kết tuân thủ nghiêm ngặt Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân</span>
            </div>
            <div className="space-y-2 leading-relaxed">
              <p><strong>1. Mục đích thu thập:</strong> Dữ liệu họ tên, số điện thoại, CCCD và thông tin hợp đồng chỉ phục vụ việc vận hành căn hộ, đăng ký tạm trú và xuất hóa đơn VAT điện tử.</p>
              <p><strong>2. An toàn dữ liệu:</strong> Mọi thông tin được mã hóa bảo mật chuẩn AES-256 trên cụm máy chủ đám mây đặt tại Việt Nam.</p>
              <p><strong>3. Cam kết không chia sẻ:</strong> Dwell Living tuyệt đối không bán hoặc cung cấp thông tin cư dân cho bên thứ ba vì bất kỳ mục đích quảng cáo thương mại nào.</p>
            </div>
          </div>
        );

      case 'DISPUTE_RESOLUTION':
        return (
          <div className="space-y-3.5 text-xs text-slate-600">
            <p>Quy trình giải quyết khiếu nại và phản ánh của cư dân theo chuẩn SLA chất lượng cao:</p>
            <div className="space-y-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <span className="px-2 py-0.5 bg-teal-100 text-teal-800 font-bold rounded text-[10px]">Cấp 1</span>
                <div>
                  <strong className="text-slate-900 block">Tiếp nhận tức thì (15 Phút):</strong>
                  <span>Ghi nhận phản ánh qua Hotline 1900 8899, Trợ lý AI Copilot hoặc Cổng Cư Dân. Phân loại mức độ khẩn cấp.</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <span className="px-2 py-0.5 bg-sky-100 text-sky-800 font-bold rounded text-[10px]">Cấp 2</span>
                <div>
                  <strong className="text-slate-900 block">Xử lý hiện trường (2 - 24 Giờ):</strong>
                  <span>Đội ngũ kỹ thuật hoặc nhân viên an ninh có mặt trực tiếp kiểm tra, khắc phục sự cố và lập biên bản nghiệm thu.</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold rounded text-[10px]">Cấp 3</span>
                <div>
                  <strong className="text-slate-900 block">Hòa giải & Thỏa thuận:</strong>
                  <span>Trường hợp tranh chấp hợp đồng, đại diện Ban Giám Đốc Dwell sẽ trực tiếp đối thoại hòa giải trên tinh thần tôn trọng pháp luật và quyền lợi đôi bên.</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'LEGAL_COMPLIANCE':
        return (
          <div className="space-y-3.5 text-xs text-slate-600">
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center gap-2.5 text-emerald-900 font-semibold">
              <Scale className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Giá trị pháp lý của Hợp đồng điện tử ký số Dwell Living</span>
            </div>
            <div className="space-y-2 leading-relaxed">
              <p><strong>• Căn cứ pháp lý:</strong> Căn cứ Luật Giao dịch điện tử số 20/2023/QH15 và Bộ luật Dân sự 2015, hợp đồng điện tử được xác lập qua phương tiện điện tử có giá trị pháp lý đầy đủ và giá trị chứng cứ tương đương văn bản giấy truyền thống.</p>
              <p><strong>• Xác thực hai lớp:</strong> Hợp đồng được gắn kèm mã chứng thực chữ ký số OTP định danh người ký và dấu thời gian Timestamp Authority (TSA) ngăn chặn chỉnh sửa.</p>
              <p><strong>• Tra cứu trực tuyến:</strong> Mỗi hợp đồng có mã tra cứu và mã QR code để các cơ quan chức năng hoặc ngân hàng kiểm tra tính toàn vẹn bất kỳ lúc nào.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getModalTitle = () => {
    switch (modalKey) {
      case 'ABOUT_US': return { title: 'Về Chúng Tôi (Dwell Living)', category: 'Giới Thiệu Thương Hiệu' };
      case 'PRICING_FEES': return { title: 'Báo Giá Thuê Phòng & Biểu Phí Dịch Vụ', category: 'Biểu Phí Niêm Yết' };
      case 'AI_CONTRACT_PROCESS': return { title: 'Quy Trình Ký Hợp Đồng Điện Tử AI 4.0', category: 'Hướng Dẫn Thuê Nhà' };
      case 'VIETQR_PAYMENT_GUIDE': return { title: 'Hướng Dẫn Thanh Toán VietQR Napas247', category: 'Cổng Thanh Toán Số' };
      case 'FAQ_RESIDENTS': return { title: 'Câu Hỏi Thường Gặp (FAQ Cư Dân)', category: 'Hỏi Đáp 24/7' };
      case 'FEEDBACK_REPORT': return { title: 'Góp Ý & Báo Lỗi Kỹ Thuật Trực Tuyến', category: 'Hỗ Trợ Khách Hàng' };
      case 'FLOOR_PLANS': return { title: 'Sơ Đồ Mặt Bằng & Tiện Ích Các Tòa Nhà', category: 'Quy Hoạch Mặt Bằng' };
      case 'BUILDING_RULES': return { title: 'Nội Quy Quản Lý & Vận Hành Tòa Nhà', category: 'Quy Chế Sinh Hoạt' };
      case 'RESIDENCE_REGISTRATION': return { title: 'Quy Định Đăng Ký Tạm Trú Điện Tử Số', category: 'Thủ Tục Pháp Lý' };
      case 'LEASE_TERMS': return { title: 'Điều Khoản Thỏa Thuận Hợp Đồng Thuê Căn Hộ', category: 'Hợp Đồng Pháp Lý' };
      case 'PRIVACY_POLICY': return { title: 'Chính Sách Bảo Mật Dữ Liệu Cá Nhân', category: 'An Toàn Thông Tin' };
      case 'DISPUTE_RESOLUTION': return { title: 'Quy Trình Giải Quyết Khiếu Nại Cư Dân', category: 'Chính Sách Hỗ Trợ' };
      case 'LEGAL_COMPLIANCE': return { title: 'Tính Pháp Lý Của Chữ Ký Số & Hợp Đồng AI', category: 'Chứng Nhận Pháp Lý' };
      default: return { title: 'Thông Tin Chi Tiết', category: 'Dwell Living' };
    }
  };

  const modalMeta = getModalTitle();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-sky-700 via-blue-700 to-sky-800 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="text-[10px] uppercase font-bold text-sky-200 tracking-wider">
              {modalMeta.category}
            </div>
            <h3 className="font-bold text-sm sm:text-base mt-0.5 leading-snug">
              {modalMeta.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors ml-3 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-5 overflow-y-auto flex-1">
          {renderModalContent()}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              onClose();
              if (onOpenAIChat) onOpenAIChat();
            }}
            className="inline-flex items-center space-x-1.5 text-xs text-sky-700 hover:text-sky-800 font-semibold"
          >
            <AIBotLogo size="xs" />
            <span>Hỏi thêm trợ lý AI Copilot</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
