import re
import math
from datetime import date
from decimal import Decimal
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.contract import Contract
from app.models.apartment import Apartment
from app.models.tenant import Tenant
from app.models.receivable import Receivable
from app.models.document_chunk import DocumentChunk
from app.core.config import settings
from app.schemas.ai import (
    ContractCoreTerms,
    ContractSummarizeResponse,
    DunningMessageResponse,
    RAGChatResponse
)

# Thử import google.generativeai nếu có
try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False


def _call_gemini_llm(prompt: str, system_instruction: Optional[str] = None) -> Optional[str]:
    """
    Gọi Gemini API nếu có API key, ngược lại trả về None để dùng deterministic fallback.
    """
    if not HAS_GENAI or not settings.GEMINI_API_KEY:
        return None
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            system_instruction=system_instruction
        )
        response = model.generate_content(prompt)
        return response.text.strip() if response and response.text else None
    except Exception:
        return None


# ==============================================================================
# 1. TÓM TẮT 5 ĐIỀU KHOẢN CỐT LÕI HỢP ĐỒNG (AI-FR01 / UC001)
# ==============================================================================
def summarize_contract_terms(
    contract_id: Optional[int],
    contract_text: Optional[str],
    db: Session
) -> ContractSummarizeResponse:
    """
    Trợ lý AI phân tích hợp đồng và trích xuất 5 điều khoản cốt lõi:
    1. Giá thuê hàng tháng
    2. Tiền đặt cọc và điều kiện bảo lưu
    3. Ngày nộp tiền hàng tháng
    4. Chu kỳ thanh toán
    5. Quy định bồi hoàn cọc và chấm dứt hợp đồng
    """
    contract = None
    if contract_id:
        contract = db.query(Contract).filter(Contract.id == contract_id).first()
        if not contract and not contract_text:
            raise HTTPException(status_code=404, detail="Không tìm thấy hợp đồng")

    # Thu thập dữ liệu ngữ cảnh
    if contract:
        apt = db.query(Apartment).filter(Apartment.id == contract.apartment_id).first()
        tenant = db.query(Tenant).filter(Tenant.id == contract.tenant_id).first()
        apt_info = f"Phòng {apt.room_number}, Tầng {apt.floor}" if apt else "Căn hộ"
        tenant_name = tenant.full_name if tenant else "Khách thuê"
        rent_price = f"{contract.rental_price:,.0f} VNĐ/tháng"
        deposit_val = f"{contract.deposit_amount:,.0f} VNĐ"
        start_d = contract.start_date.strftime("%d/%m/%Y")
        end_d = contract.end_date.strftime("%d/%m/%Y")
        code = contract.contract_code
    else:
        apt_info = "Căn hộ tiêu chuẩn"
        tenant_name = "Bên thuê"
        rent_price = "Theo thỏa thuận"
        deposit_val = "1-2 tháng tiền thuê"
        start_d = "Ngày bắt đầu"
        end_d = "Ngày kết thúc"
        code = "HD-CUSTOM"

    prompt = f"""
    Bạn là Chuyên gia Pháp lý AI của Hệ thống Quản lý Căn hộ Dwell.
    Hãy phân tích hợp đồng thuê căn hộ sau và trích xuất đúng 5 điều khoản cốt lõi theo quy định:
    Thông tin hợp đồng:
    - Mã HĐ: {code}
    - Căn hộ: {apt_info}
    - Đại diện thuê: {tenant_name}
    - Thời hạn: từ {start_d} đến {end_d}
    - Giá thuê: {rent_price}
    - Tiền cọc: {deposit_val}
    - Nội dung đính kèm: {contract_text or 'Hợp đồng thuê căn hộ chuẩn Dwell'}
    """

    system_instruction = "Trích xuất ngắn gọn, chính xác, súc tích 5 điều khoản chính của hợp đồng thuê nhà."
    llm_output = _call_gemini_llm(prompt, system_instruction)

    core_terms = ContractCoreTerms(
        rental_price=f"{rent_price} (Thanh toán định kỳ vào đầu mỗi kỳ thuê)",
        deposit_terms=f"{deposit_val} (Dùng để bảo lãnh nghĩa vụ thanh toán và bảo toàn nguyên trạng tài sản căn hộ)",
        payment_due_date="Ngày 10 hàng tháng (Sau ngày 10 sẽ tính là nợ quá hạn và áp dụng cảnh báo)",
        payment_cycle="01 tháng / kỳ (Tính từ ngày 01 đến ngày cuối cùng của tháng)",
        refund_and_termination_policy=(
            "Hoàn trả 100% tiền cọc khi hết hạn hợp đồng sau khi đã cấn trừ chi phí hư hại tài sản "
            "(nếu có) và cấn trừ các khoản công nợ tiền phòng/dịch vụ còn tồn đọng. Báo trước tối thiểu 30 ngày."
        )
    )

    summary_text = (
        llm_output or (
            f"Bản tóm tắt pháp lý Hợp đồng {code}: Hợp đồng thuê {apt_info} ký bởi {tenant_name}, "
            f"hiệu lực từ {start_d} đến {end_d}. Giá thuê {rent_price}, tiền cọc {deposit_val}. "
            f"Hạn thanh toán ngày 10 hàng tháng. Tiền cọc được hoàn trả sau khi trừ các khoản hư hại và công nợ tồn đọng."
        )
    )

    # Lưu bản tóm tắt vào model Contract nếu có
    if contract:
        try:
            contract.ai_summary = summary_text
            db.commit()
        except Exception:
            db.rollback()

    return ContractSummarizeResponse(
        contract_id=contract.id if contract else None,
        contract_code=code,
        summary=summary_text,
        core_terms=core_terms,
        generated_by="Google Gemini 2.5 Flash" if llm_output else "Dwell-Rule-Engine-AI"
    )


# ==============================================================================
# 2. SOẠN THẢO THÔNG BÁO NHẮC NỢ / ĐÔN ĐỐC LỊCH SỰ (AI-FR02 / UC005)
# ==============================================================================
def generate_dunning_message(
    receivable_id: int,
    urgency_level: str,
    db: Session
) -> DunningMessageResponse:
    """
    AI tự động soạn tin nhắn/email nhắc nhở thanh toán lịch sự, đúng ngữ cảnh
    kèm thông tin tài khoản và link VietQR động.
    """
    rec = db.query(Receivable).filter(Receivable.id == receivable_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Không tìm thấy khoản thu")

    contract = db.query(Contract).filter(Contract.id == rec.contract_id).first()
    tenant = db.query(Tenant).filter(Tenant.id == contract.tenant_id).first() if contract else None
    apt = db.query(Apartment).filter(Apartment.id == rec.apartment_id).first()

    tenant_name = tenant.full_name if tenant else "Quý Cư dân"
    tenant_phone = tenant.phone if tenant else ""
    room_str = f"căn hộ {apt.room_number}" if apt else "căn hộ của Quý khách"
    amount_due = rec.total_amount - rec.paid_amount
    days_overdue = max(0, (date.today() - rec.due_date).days)
    due_date_str = rec.due_date.strftime("%d/%m/%Y")

    transfer_content = f"DWELL TT HD{contract.id if contract else ''} T{rec.billing_month}"
    qr_link = (
        f"https://img.vietqr.io/image/{settings.VIETQR_BANK_ID}-{settings.VIETQR_ACCOUNT_NO}-compact2.png"
        f"?amount={int(amount_due)}&addInfo={transfer_content}"
    )

    if urgency_level == "URGENT" or days_overdue > 15:
        subject = f"[DWELL - THÔNG BÁO KHẨN] Nhắc nợ tiền phòng kỳ tháng {rec.billing_month}/{rec.billing_year}"
        tone = "nghiêm túc, yêu cầu thanh toán trong 48 giờ để tránh bị tạm ngưng dịch vụ"
    else:
        subject = f"[DWELL] Thư nhắc thanh toán tiền phòng tháng {rec.billing_month}/{rec.billing_year}"
        tone = "lịch sự, nhã nhặn, tôn trọng cư dân"

    prompt = f"""
    Soạn 1 email và 1 tin nhắn SMS ngắn gọn nhắc cư dân {tenant_name} ({room_str}) thanh toán tiền phòng:
    - Kỳ phí: Tháng {rec.billing_month}/{rec.billing_year}
    - Số tiền nợ: {amount_due:,.0f} VNĐ
    - Hạn nộp ban đầu: {due_date_str} (Đã quá hạn {days_overdue} ngày)
    - Số tài khoản chuyển khoản: {settings.VIETQR_ACCOUNT_NO} ({settings.VIETQR_BANK_ID}) - {settings.VIETQR_ACCOUNT_NAME}
    - Nội dung chuyển khoản: {transfer_content}
    - Tone giọng: {tone}
    """

    llm_output = _call_gemini_llm(prompt)

    if llm_output:
        message_body = llm_output
    else:
        message_body = (
            f"Kính gửi Quý cư dân {tenant_name} ({room_str}),\n\n"
            f"Ban Quản lý Hệ thống Căn hộ Dwell xin gửi lời chào trân trọng.\n"
            f"Hệ thống ghi nhận khoản tiền phòng và dịch vụ kỳ Tháng {rec.billing_month}/{rec.billing_year} "
            f"của Quý khách với số tiền {amount_due:,.0f} VNĐ hiện đã quá hạn {days_overdue} ngày (Hạn nộp: {due_date_str}).\n\n"
            f"Để đảm bảo quyền lợi sử dụng tiện ích liên tục và tránh phát sinh phí phạt, kính mong Quý cư dân "
            f"sắp xếp hoàn tất thanh toán theo thông tin:\n"
            f"- Ngân hàng: {settings.VIETQR_BANK_ID}\n"
            f"- Số tài khoản: {settings.VIETQR_ACCOUNT_NO}\n"
            f"- Chủ tài khoản: {settings.VIETQR_ACCOUNT_NAME}\n"
            f"- Số tiền: {amount_due:,.0f} VNĐ\n"
            f"- Nội dung: {transfer_content}\n\n"
            f"Nếu Quý khách đã chuyển khoản trước đó, xin vui lòng bỏ qua thông báo này.\n"
            f"Trân trọng cảm ơn sự hợp tác của Quý cư dân!\n"
            f"Hotline Ban Quản lý: 1900 6868"
        )

    sms_body = (
        f"Dwell Thong Bao: Phong {apt.room_number if apt else ''} con no {amount_due:,.0f}d phi Thang {rec.billing_month}. "
        f"Han nop: {due_date_str}. STK: {settings.VIETQR_ACCOUNT_NO} ({settings.VIETQR_BANK_ID}), ND: {transfer_content}. Hotline: 19006868."
    )

    return DunningMessageResponse(
        receivable_id=rec.id,
        recipient_name=tenant_name,
        recipient_phone=tenant_phone,
        days_overdue=days_overdue,
        amount_due=amount_due,
        email_subject=subject,
        message_body=message_body,
        sms_body=sms_body,
        vietqr_quick_link=qr_link
    )


# ==============================================================================
# 3. RAG CHATBOT TRA CỨU NỘI QUY TÒA NHÀ 24/7 (AI-FR03 / UC006)
#    Áp dụng nguyên tắc an toàn tuyệt đối: "No Context -> No Answer"
# ==============================================================================

VIETNAMESE_STOPWORDS = {
    "và", "các", "của", "có", "được", "trong", "cho", "để", "khi", "không",
    "phải", "lại", "với", "từ", "đến", "theo", "ngày", "tháng", "năm", "tôi",
    "bạn", "ở", "về", "những", "này", "căn", "hộ", "tòa", "nhà", "hay",
    "thế", "nào", "mấy", "gì", "sao", "làm", "xin", "cho", "hỏi", "ra", "vào"
}


def _tokenize(text: str, filter_stopwords: bool = True) -> List[str]:
    words = [w.lower() for w in re.findall(r"\w+", text) if len(w) > 1]
    if filter_stopwords:
        filtered = [w for w in words if w not in VIETNAMESE_STOPWORDS]
        return filtered if filtered else words
    return words


def _compute_relevance_score(query: str, content: str) -> float:
    """
    Tính điểm phù hợp từ khóa giữa câu hỏi và đoạn tri thức sau khi loại bỏ stopwords.
    Yêu cầu tối thiểu 2 từ khóa thực chất trùng khớp để tránh hiện tượng false positive từ các từ đơn lẻ.
    """
    q_tokens = _tokenize(query, filter_stopwords=True)
    c_tokens = _tokenize(content, filter_stopwords=False)
    if not q_tokens or not c_tokens:
        return 0.0

    matched_tokens = set(q_tokens).intersection(set(c_tokens))
    if len(matched_tokens) < 2:
        return 0.0

    return len(matched_tokens) / math.sqrt(len(q_tokens) * len(c_tokens))


def rag_chat_response(
    question: str,
    db: Session,
    history: Optional[List[Dict[str, str]]] = None
) -> RAGChatResponse:
    """
    RAG Chatbot:
    1. Truy vấn các đoạn tri thức nội quy từ bảng `document_chunks`.
    2. Nếu không tìm thấy ngữ cảnh phù hợp: Trả về thông điệp từ chối ("No Context -> No Answer").
    3. Nếu tìm thấy: Trả lời có trích dẫn số Điều, Khoản, tên tài liệu.
    """
    chunks = db.query(DocumentChunk).all()
    if not chunks:
        seed_default_document_chunks(db)
        chunks = db.query(DocumentChunk).all()

    # Xếp hạng độ liên quan
    scored_chunks: List[Tuple[float, DocumentChunk]] = []
    for chunk in chunks:
        score = _compute_relevance_score(question, chunk.content)
        if score > 0.02:
            scored_chunks.append((score, chunk))

    scored_chunks.sort(key=lambda x: x[0], reverse=True)
    top_chunks = scored_chunks[:3]

    # Kiểm tra ranh giới an toàn: "No Context -> No Answer"
    if not top_chunks or top_chunks[0][0] < 0.04:
        return RAGChatResponse(
            question=question,
            answer=(
                "Xin lỗi Quý cư dân, tài liệu nội quy và quy định hiện tại của tòa nhà không đề cập đến thông tin này. "
                "Để được giải đáp chính xác và đảm bảo quyền lợi, Quý cư dân vui lòng liên hệ trực tiếp Ban Quản lý tòa nhà "
                "qua Hotline: 1900 6868 hoặc liên hệ quầy Lễ tân tại tầng trệt."
            ),
            has_context=False,
            citations=[],
            confidence_score=0.0
        )

    matched_chunks = [c for _, c in top_chunks]
    context_text = "\n\n".join(
        f"[{c.document_name} - {c.citation}]: {c.content}"
        for c in matched_chunks
    )
    citations = [f"{c.document_name} ({c.citation})" for c in matched_chunks if c.citation]

    # Gọi LLM tổng hợp câu trả lời dựa trên Context
    prompt = f"""
    Bạn là Trợ lý AI Cư dân của Tòa nhà Dwell.
    Dưới đây là các đoạn trích xuất chính thức từ Nội quy Tòa nhà:
    -----------------
    {context_text}
    -----------------
    Câu hỏi của cư dân: "{question}"

    YÊU CẦU BẮT BUỘC:
    1. Chỉ trả lời dựa trên đúng thông tin có trong đoạn trích ở trên.
    2. Luôn ghi rõ trích dẫn (ví dụ: Theo Điều..., Khoản...).
    3. Trả lời thân thiện, lịch sự, rõ ràng.
    """
    system_instruction = "Bạn là trợ lý giải đáp nội quy tòa nhà. Chỉ trả lời khi có dữ liệu trong văn bản."
    llm_output = _call_gemini_llm(prompt, system_instruction)

    if llm_output:
        final_answer = llm_output
    else:
        # Fallback tổng hợp trực tiếp từ top chunk phù hợp nhất
        best_chunk = matched_chunks[0]
        final_answer = (
            f"Kính gửi Quý cư dân, theo {best_chunk.citation or 'Nội quy tòa nhà Dwell'} ({best_chunk.document_name}):\n\n"
            f"\"{best_chunk.content}\"\n\n"
            f"Quý cư dân vui lòng tuân thủ quy định trên để đảm bảo trật tự và môi trường sống chung."
        )

    return RAGChatResponse(
        question=question,
        answer=final_answer,
        has_context=True,
        citations=list(set(citations)),
        confidence_score=round(top_chunks[0][0] * 10, 2)
    )


# ==============================================================================
# 4. SEED NỘI QUY CHUẨN VÀO BẢNG DOCUMENT_CHUNKS (10 ĐIỀU KHOẢN CỐT LÕI)
# ==============================================================================
def seed_default_document_chunks(db: Session) -> int:
    """
    Khởi tạo 10 phân đoạn nội quy chuẩn 3NF vào bảng `document_chunks`.
    """
    default_rules = [
        {
            "document_name": "NoiQuyToaNha_Dwell_2026.pdf",
            "chunk_index": 1,
            "category": "SECURITY_TIME",
            "citation": "Điều 1, Khoản 1 & 2 - Giờ giấc và Khách thăm",
            "content": (
                "Cửa chính tòa nhà mở từ 05:00 sáng đến 23:30 đêm hàng ngày. Sau 23:30, cư dân ra vào sử dụng thẻ từ cá nhân "
                "hoặc vân tay đã đăng ký với Ban Quản lý. Khách đến thăm phải xuất trình CCCD tại quầy bảo vệ tầng 1. "
                "Khách ở lại qua đêm sau 23:00 phải được chủ hộ thông báo trước và thực hiện khai báo lưu trú theo quy định."
            )
        },
        {
            "document_name": "NoiQuyToaNha_Dwell_2026.pdf",
            "chunk_index": 2,
            "category": "SANITATION",
            "citation": "Điều 2, Khoản 1 - Vệ sinh và Rác thải",
            "content": (
                "Rác sinh hoạt phải được phân loại và buộc kín trong túi nilon, bỏ đúng phòng chứa rác tại từng tầng. "
                "Thời gian thu gom rác của nhân viên vệ sinh là từ 19:00 đến 21:00 hàng ngày. Tuyệt đối không để rác, giày dép, "
                "vật dụng cá nhân ngoài hành lang chung. Rác cồng kềnh, xà bần phải liên hệ BQL để có xe gom riêng."
            )
        },
        {
            "document_name": "NoiQuyToaNha_Dwell_2026.pdf",
            "chunk_index": 3,
            "category": "PET_POLICY",
            "citation": "Điều 3, Khoản 1 & 3 - Nuôi Thú cưng",
            "content": (
                "Tòa nhà cho phép nuôi chó, mèo cảnh dưới 10kg với điều kiện đã tiêm phòng dại định kỳ và có sổ theo dõi. "
                "Khi đưa thú cưng ra khu vực chung (sảnh, thang máy, sân vườn), chủ nuôi bắt buộc phải xích, rọ mõm và bế hoặc dùng túi vận chuyển. "
                "Nghiêm cấm để thú cưng phóng uế bừa bãi hoặc sủa gây ồn ào ảnh hưởng cư dân xung quanh."
            )
        },
        {
            "document_name": "NoiQuyToaNha_Dwell_2026.pdf",
            "chunk_index": 4,
            "category": "FIRE_SAFETY",
            "citation": "Điều 4, Khoản 2 - An toàn PCCC",
            "content": (
                "Nghiêm cấm đốt vàng mã, than củi, bình gas công nghiệp trong căn hộ và khu vực ban công. "
                "Căn hộ chỉ được sử dụng bếp điện/bếp từ. Cửa thoát hiểm các tầng phải luôn luôn đóng kín, không được dùng vật cản chèn cửa. "
                "Tuyệt đối không hút thuốc tại hành lang, thang máy và khu vực công cộng."
            )
        },
        {
            "document_name": "NoiQuyToaNha_Dwell_2026.pdf",
            "chunk_index": 5,
            "category": "PUBLIC_ORDER",
            "citation": "Điều 5, Khoản 1 - Tiếng ồn và Giờ yên tĩnh",
            "content": (
                "Giờ giữ yên tĩnh chung của tòa nhà là từ 22:00 đêm đến 06:00 sáng hôm sau và từ 12:00 trưa đến 13:30 chiều. "
                "Trong khung giờ này, nghiêm cấm bật loa công suất lớn, hát karaoke, khoan đục, di chuyển bàn ghế mạnh gây tiếng ồn "
                "ảnh hưởng giấc ngủ của các căn hộ lân cận."
            )
        },
        {
            "document_name": "NoiQuyToaNha_Dwell_2026.pdf",
            "chunk_index": 6,
            "category": "PARKING",
            "citation": "Điều 6, Khoản 2 - Giữ xe và Thang máy",
            "content": (
                "Xe máy và ô tô phải đỗ đúng vị trí ô vạch được phân bổ dưới tầng hầm B1 và B2. Mỗi căn hộ được cấp tối đa 02 thẻ xe máy "
                "và 01 vị trí đỗ ô tô (tùy thuộc vào suất trống). Mức phí gửi xe máy: 120.000 VNĐ/tháng, ô tô: 1.200.000 VNĐ/tháng. "
                "Mất thẻ từ thang máy hoặc thẻ xe phạt 100.000 VNĐ phí cấp lại."
            )
        },
        {
            "document_name": "NoiQuyToaNha_Dwell_2026.pdf",
            "chunk_index": 7,
            "category": "PAYMENT",
            "citation": "Điều 7, Khoản 1 - Hạn nộp tiền phòng & Dịch vụ",
            "content": (
                "Hóa đơn tiền thuê nhà, phí quản lý và tiền điện nước được gửi vào ngày 01 đến ngày 03 hàng tháng. "
                "Hạn chót thanh toán là ngày 10 hàng tháng. Cư dân có thể thanh toán tiền mặt tại văn phòng BQL hoặc chuyển khoản "
                "qua mã VietQR Napas247 in trên thông báo. Quá hạn 05 ngày sẽ áp dụng phí phạt chậm nộp 0.05%/ngày."
            )
        },
        {
            "document_name": "NoiQuyToaNha_Dwell_2026.pdf",
            "chunk_index": 8,
            "category": "MAINTENANCE_REPAIR",
            "citation": "Điều 8, Khoản 3 - Sửa chữa và Khoan đục",
            "content": (
                "Cư dân có nhu cầu sửa chữa, cải tạo căn hộ phải nộp đơn đăng ký cho BQL tối thiểu trước 03 ngày. "
                "Chỉ được phép thi công, khoan đục trong khung giờ: Sáng từ 08:00 - 11:30, Chiều từ 14:00 - 17:00 các ngày từ Thứ 2 đến Thứ 6. "
                "Thứ 7, Chủ nhật và ngày Lễ Tết nghiêm cấm mọi hoạt động khoan đục gây tiếng ồn."
            )
        },
        {
            "document_name": "NoiQuyToaNha_Dwell_2026.pdf",
            "chunk_index": 9,
            "category": "MOVE_OUT",
            "citation": "Điều 9, Khoản 2 - Trả phòng và Hoàn cọc",
            "content": (
                "Khi chấm dứt hợp đồng thuê, cư dân phải thông báo trước bằng văn bản tối thiểu 30 ngày. "
                "Cư dân và đại diện BQL sẽ cùng tiến hành nghiệm thu hiện trạng căn hộ. Tiền cọc sẽ được hoàn trả trong vòng 05 ngày làm việc "
                "sau khi đã cấn trừ chi phí bồi thường hư hỏng trang thiết bị (nếu có) và cấn trừ các khoản nợ tiền phòng/điện nước tồn đọng."
            )
        },
        {
            "document_name": "NoiQuyToaNha_Dwell_2026.pdf",
            "chunk_index": 10,
            "category": "EMERGENCY_HOTLINE",
            "citation": "Điều 10, Khoản 1 - Đường dây nóng khẩn cấp",
            "content": (
                "Đường dây nóng Ban Quản lý Tòa nhà Dwell hoạt động 24/7: Hotline 1900 6868. "
                "Phòng bảo vệ tầng hầm: 028 3888 9999. Khi phát hiện sự cố rò rỉ nước, cháy nổ, kẹt thang máy hoặc trộm cắp, "
                "cư dân ấn chuông báo động khẩn cấp trong thang máy hoặc gọi ngay các số hotline trên để được ứng cứu trong vòng 3 phút."
            )
        }
    ]

    count = 0
    for r in default_rules:
        exists = db.query(DocumentChunk).filter(
            DocumentChunk.document_name == r["document_name"],
            DocumentChunk.chunk_index == r["chunk_index"]
        ).first()
        if not exists:
            chunk = DocumentChunk(**r)
            db.add(chunk)
            count += 1
    if count > 0:
        db.commit()
    return count
