import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Boolean, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector
from app.db import Base


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), nullable=False, index=True)
    external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    turns: Mapped[dict] = mapped_column(JSONB, nullable=False, default=list)
    first_msg: Mapped[str | None] = mapped_column(Text, nullable=True)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(1536), nullable=True)
    gap_flagged: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    cluster_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("clusters.id"), nullable=True, index=True)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    workspace: Mapped["Workspace"] = relationship(back_populates="conversations")
    cluster: Mapped["Cluster | None"] = relationship(back_populates="conversations")

    __table_args__ = (
        # Composite unique: one external_id per workspace
        __import__("sqlalchemy").UniqueConstraint("workspace_id", "external_id", name="uq_conversations_workspace_external"),
    )
