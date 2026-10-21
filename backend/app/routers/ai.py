from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.document_chunk import DocumentChunk
from app.models.user import User
from app.schemas.ai import (
    ContractSummarizeRequest,
    ContractSummarizeResponse,
    DunningMessageRequest,
    DunningMessageResponse,
    RAGChatRequest,
    RAGChatResponse,
    DocumentChunkResponse
)
from app.dependencies.auth import get_current_user, require_roles
from app.services.ai_service import (
    summarize_contract_terms,
    generate_dunning_message,
    rag_chat_response,
    seed_default_document_chunks
)

router = APIRouter(
    prefix="/ai",
    tags=["GenAI Assistants"]
)


@router.post("/summarize-contract", response_model=ContractSummarizeResponse)
def summarize_contract_api(
    data: ContractSummarizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    [AI-FR01] Trợ lý AI trích xuất 5 điều khoản cốt lõi của hợp đồng:
    1. Giá thuê hàng tháng
    2. Tiền cọc và điều kiện bảo lưu
    3. Ngày nộp tiền hàng tháng
    4. Chu kỳ thanh toán
    5. Quy định bồi hoàn cọc và chấm dứt hợp đồng
    """
    if not data.contract_id and not data.contract_text:
        raise HTTPException(
            status_code=400,
            detail="Vui lòng cung cấp contract_id hoặc contract_text để tóm tắt"
        )
    return summarize_contract_terms(
        contract_id=data.contract_id,
        contract_text=data.contract_text,
        db=db
    )


@router.post("/generate-dunning-message", response_model=DunningMessageResponse)
def generate_dunning_api(
    data: DunningMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "STAFF", "ACCOUNTANT"))
):
    """
    [AI-FR02] Trợ lý AI tự động soạn thảo thư/tin nhắn nhắc nợ lịch sự theo ngữ cảnh
    kèm thông tin thanh toán VietQR động.
    """
    return generate_dunning_message(
        receivable_id=data.receivable_id,
        urgency_level=data.urgency_level or "NORMAL",
        db=db
    )


@router.post("/rag-chat", response_model=RAGChatResponse)
def rag_chat_api(
    data: RAGChatRequest,
    db: Session = Depends(get_db)
):
    """
    [AI-FR03] Chatbot RAG Cư dân tra cứu Nội quy Tòa nhà 24/7.
    Tuân thủ tuyệt đối ranh giới an toàn: 'No Context -> No Answer' (từ chối bịa đặt ngoài tài liệu).
    """
    return rag_chat_response(
        question=data.question,
        db=db,
        history=data.history
    )


@router.get("/knowledge-chunks", response_model=List[DocumentChunkResponse])
def get_knowledge_chunks(
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách các phân đoạn tri thức nội quy đang được lưu trong CSDL.
    """
    chunks = db.query(DocumentChunk).order_by(DocumentChunk.chunk_index.asc()).all()
    if not chunks:
        seed_default_document_chunks(db)
        chunks = db.query(DocumentChunk).order_by(DocumentChunk.chunk_index.asc()).all()
    return chunks


@router.post("/seed-knowledge")
def seed_knowledge(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN"))
):
    """
    Khởi tạo hoặc cập nhật 10 điều khoản nội quy chuẩn của tòa nhà.
    """
    count = seed_default_document_chunks(db)
    return {"message": f"Đã nạp {count} phân đoạn nội quy chuẩn vào CSDL", "total_chunks": count}
