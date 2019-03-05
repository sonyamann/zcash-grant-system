"""Add refund_tx_id to proposal_contributions

Revision ID: c0646a888d4f
Revises: ebccb1298297
Create Date: 2019-02-17 11:36:45.851391

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c0646a888d4f'
down_revision = 'ebccb1298297'
branch_labels = None
depends_on = None


def upgrade():
# ### commands auto generated by Alembic - please adjust! ###
    op.add_column('proposal_contribution', sa.Column('refund_tx_id', sa.String(length=255), nullable=True))
    # ### end Alembic commands ###


def downgrade():
# ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('proposal_contribution', 'refund_tx_id')
    # ### end Alembic commands ###