import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    api_key_hash: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    api_key_prefix: Mapped[str] = mapped_column(String(16), nullable=False)  # e.g. "juno_sk_ab12"
    plan: Mapped[str] = mapped_column(String(50), nullable=False, default="free")
    conv_count_month: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    users: Mapped[list["User"]] = relationship(back_populates="workspace")
    conversations: Mapped[list["Conversation"]] = relationship(back_populates="workspace")
    clusters: Mapped[list["Cluster"]] = relationship(back_populates="workspace")
