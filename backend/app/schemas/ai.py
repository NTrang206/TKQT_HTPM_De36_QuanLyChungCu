from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict
from datetime import datetime
from decimal import Decimal


class ContractCoreTerms(BaseModel):
    rental_price: str = Field(description="Giá thuê hàng tháng và kỳ thanh toán")
    deposit_terms: str = Field(description="Tiền đặt cọc và điều kiện bảo lưu")
    payment_due_date: str = Field(description="Hạn nộp tiền hàng tháng")
    payment_cycle: str = Field(description="Chu kỳ thanh toán")
    refund_and_termination_policy: str = Field(description="Quy định bồi hoàn cọc và chấm dứt hợp đồng")


class ContractSummarizeRequest(BaseModel):
    contract_id: Optional[int] = None
    contract_text: Optional[str] = None


class ContractSummarizeResponse(BaseModel):
    contract_id: Optional[int] = None
    contract_code: Optional[str] = None
    summary: str
    core_terms: ContractCoreTerms
    generated_by: str = "Gemini-GenAI-Assistant"


class DunningMessageRequest(BaseModel):
    receivable_id: int
    urgency_level: Optional[str] = Field(default="NORMAL", description="NORMAL, URGENT, FINAL_NOTICE")


class DunningMessageResponse(BaseModel):
    receivable_id: int
    recipient_name: str
    recipient_phone: str
    days_overdue: int
    amount_due: Decimal
    email_subject: str
    message_body: str
    sms_body: str
    vietqr_quick_link: Optional[str] = None


class RAGChatRequest(BaseModel):
    question: str = Field(..., min_length=2, description="Câu hỏi của cư dân về nội quy tòa nhà")
    history: Optional[List[Dict[str, str]]] = None


class RAGChatResponse(BaseModel):
    question: str
    answer: str
    has_context: bool
    citations: List[str]
    confidence_score: float = 1.0


class DocumentChunkCreate(BaseModel):
    document_name: str
    chunk_index: int
    category: str = "LIVING_RULES"
    content: str
    citation: Optional[str] = None


class DocumentChunkResponse(BaseModel):
    id: int
    document_name: str
    chunk_index: int
    category: str
    content: str
    citation: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
