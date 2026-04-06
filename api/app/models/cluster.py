import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Boolean, Integer, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base


class Cluster(Base):
    __tablename__ = "clusters"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), nullable=False, index=True)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    user_label: Mapped[str | None] = mapped_column(String(255), nullable=True)  # operator override
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_gap: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    hidden: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    workspace: Mapped["Workspace"] = relationship(back_populates="clusters")
    conversations: Mapped[list["Conversation"]] = relationship(back_populates="cluster")

    @property
    def display_label(self) -> str:
        return self.user_label or self.label
