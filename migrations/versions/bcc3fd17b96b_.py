from alembic import op
import sqlalchemy as sa

revision = 'bcc3fd17b96b'
down_revision = '0763d677d453'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('product',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('category', sa.String(length=32), nullable=False),
    sa.Column('subcategory', sa.String(length=80), nullable=False),
    sa.Column('name', sa.String(length=160), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('stock', sa.Integer(), nullable=False),
    sa.Column('image_url', sa.String(length=500), nullable=False),
    sa.CheckConstraint('price >= 0', name='ck_product_price_nonnegative'),
    sa.CheckConstraint('stock >= 0', name='ck_product_stock_nonnegative'),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('product', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_product_category'), ['category'], unique=False)

    op.create_table('cart_item',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('product_id', sa.Integer(), nullable=False),
    sa.Column('quantity', sa.Integer(), nullable=False),
    sa.CheckConstraint('quantity > 0', name='ck_cart_item_quantity_positive'),
    sa.ForeignKeyConstraint(['product_id'], ['product.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'product_id', name='uq_cart_user_product')
    )
    with op.batch_alter_table('cart_item', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_cart_item_user_id'), ['user_id'], unique=False)

    op.create_table('customer_order',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('status', sa.String(length=32), nullable=False),
    sa.Column('shipping_name', sa.String(length=120), nullable=False),
    sa.Column('shipping_email', sa.String(length=120), nullable=False),
    sa.Column('shipping_address', sa.String(length=255), nullable=False),
    sa.Column('shipping_city', sa.String(length=120), nullable=False),
    sa.Column('shipping_postal_code', sa.String(length=20), nullable=False),
    sa.Column('total', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('customer_order', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_customer_order_user_id'), ['user_id'], unique=False)

    op.create_table('order_item',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('order_id', sa.Integer(), nullable=False),
    sa.Column('product_id', sa.Integer(), nullable=False),
    sa.Column('product_name', sa.String(length=160), nullable=False),
    sa.Column('unit_price', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('quantity', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['order_id'], ['customer_order.id'], ),
    sa.ForeignKeyConstraint(['product_id'], ['product.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.add_column(sa.Column('name', sa.String(length=120), nullable=True))

def downgrade():
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.drop_column('name')

    op.drop_table('order_item')
    with op.batch_alter_table('customer_order', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_customer_order_user_id'))

    op.drop_table('customer_order')
    with op.batch_alter_table('cart_item', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_cart_item_user_id'))

    op.drop_table('cart_item')
    with op.batch_alter_table('product', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_product_category'))

    op.drop_table('product')
