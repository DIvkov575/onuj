"""magic link tokens and api keys

Revision ID: 002
Revises: 001
Create Date: 2026-04-06
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade():
    # Drop old single-key columns from workspaces
    op.drop_column("workspaces", "api_key_hash")
    op.drop_column("workspaces", "api_key_prefix")

    # Make password_hash nullable (going passwordless)
    op.alter_column("users", "password_hash", nullable=True)

    # Multiple named API keys per workspace
    op.create_table(
        "api_keys",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("workspace_id", UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("key_hash", sa.String(255), nullable=False, unique=True),
        sa.Column("key_prefix", sa.String(20), nullable=False),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_api_keys_workspace_id", "api_keys", ["workspace_id"])
    op.create_index("ix_api_keys_key_hash", "api_keys", ["key_hash"])

    # One-time magic link tokens
    op.create_table(
        "magic_link_tokens",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("token_hash", sa.String(255), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_magic_link_tokens_email", "magic_link_tokens", ["email"])


def downgrade():
    op.drop_table("magic_link_tokens")
    op.drop_table("api_keys")
    op.alter_column("users", "password_hash", nullable=False)
    op.add_column("workspaces", sa.Column("api_key_prefix", sa.String(16), nullable=False, server_default=""))
    op.add_column("workspaces", sa.Column("api_key_hash", sa.String(255), nullable=False, server_default="", unique=True))
