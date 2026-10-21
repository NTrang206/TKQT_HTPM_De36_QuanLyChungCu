from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from app.database import Base


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_name = Column(String(100), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    category = Column(String(50), default="LIVING_RULES")
    content = Column(Text, nullable=False)
    citation = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.now)
