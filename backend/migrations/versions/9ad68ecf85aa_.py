"""2fa user fields: backup_codes & totp_secret

Revision ID: 9ad68ecf85aa
Revises: 4e5d9f481f22
Create Date: 2019-02-21 13:26:32.715454

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9ad68ecf85aa'
down_revision = '4e5d9f481f22'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('user', sa.Column('backup_codes', sa.String(), nullable=True))
    op.add_column('user', sa.Column('totp_secret', sa.String(length=255), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('user', 'totp_secret')
    op.drop_column('user', 'backup_codes')
    # ### end Alembic commands ###