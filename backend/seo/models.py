from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from database import Base

class AnalysisRecord(Base):
    __tablename__ = "analysis"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    url: Mapped[str] = mapped_column(String, index=True)
    category: Mapped[str] = mapped_column(String, default="seo")  # seo|brand|social
    summary: Mapped[dict] = mapped_column(JSON, default={})
    issues: Mapped[dict] = mapped_column(JSON, default={})
    rankings: Mapped[dict] = mapped_column(JSON, default={})
    created_at: Mapped[Any] = mapped_column(DateTime(timezone=True), server_default=func.now())

# Pydantic Schemas
class AnalyzeRequest(BaseModel):
    url: str
    categories: List[str] = Field(default_factory=lambda: ["seo"])

class KPI(BaseModel):
    seo_score: int
    organic_traffic: int
    keyword_rankings: int
    backlinks: int

class IssueCounts(BaseModel):
    missing_meta_descriptions: int
    slow_loading_pages: int
    broken_internal_links: int
    missing_alt_tags: int

class AnalyzeResponse(BaseModel):
    url: str
    kpis: KPI
    issues: IssueCounts
    rankings: Dict[str, Any]
    created_at: str

class SummaryResponse(BaseModel):
    url: str
    period_days: int
    category: str
    totals: KPI
    trend: List[Dict[str, Any]]
