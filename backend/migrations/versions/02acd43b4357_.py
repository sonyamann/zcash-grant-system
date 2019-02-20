"""basic comment table moderation fields - hidden, reported

Revision ID: 02acd43b4357
Revises: 27975c4a04a4
Create Date: 2019-02-17 17:17:17.677275

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '02acd43b4357'
down_revision = '27975c4a04a4'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('comment', sa.Column('hidden', sa.Boolean(), server_default=sa.text('FALSE'), nullable=False))
    op.add_column('comment', sa.Column('reported', sa.Boolean(), server_default=sa.text('FALSE'), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('comment', 'reported')
    op.drop_column('comment', 'hidden')
    # ### end Alembic commands ###
