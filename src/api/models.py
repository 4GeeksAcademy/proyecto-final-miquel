from datetime import datetime

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

db = SQLAlchemy()


class User(db.Model):
    id = db.Column(Integer, primary_key=True)
    name = db.Column(String(120), nullable=True)
    email = db.Column(String(120), unique=True, nullable=False)
    password = db.Column(String(255), nullable=False)
    is_active = db.Column(Boolean, nullable=False, default=True)

    cart_items = relationship("CartItem", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user")

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name or self.email.split("@")[0],
            "email": self.email,
        }


class Product(db.Model):
    id = db.Column(Integer, primary_key=True)
    category = db.Column(String(32), nullable=False, index=True)
    subcategory = db.Column(String(80), nullable=False)
    name = db.Column(String(160), nullable=False)
    description = db.Column(Text, nullable=False)
    price = db.Column(Numeric(10, 2), nullable=False)
    stock = db.Column(Integer, nullable=False, default=0)
    image_url = db.Column(String(500), nullable=False)
    __table_args__ = (
        db.CheckConstraint("price >= 0", name="ck_product_price_nonnegative"),
        db.CheckConstraint("stock >= 0", name="ck_product_stock_nonnegative"),
    )

    def serialize(self):
        return {
            "id": self.id,
            "category": self.category,
            "subcategory": self.subcategory,
            "name": self.name,
            "description": self.description,
            "price": float(self.price),
            "stock": self.stock,
            "image_url": self.image_url,
        }


class CartItem(db.Model):
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey("user.id"), nullable=False, index=True)
    product_id = db.Column(Integer, ForeignKey("product.id"), nullable=False)
    quantity = db.Column(Integer, nullable=False, default=1)
    user = relationship("User", back_populates="cart_items")
    product = relationship("Product")
    __table_args__ = (
        db.UniqueConstraint("user_id", "product_id", name="uq_cart_user_product"),
        db.CheckConstraint("quantity > 0", name="ck_cart_item_quantity_positive"),
    )


class Order(db.Model):
    __tablename__ = "customer_order"

    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey("user.id"), nullable=False, index=True)
    created_at = db.Column(DateTime, nullable=False, default=datetime.utcnow)
    status = db.Column(String(32), nullable=False, default="pending_payment")
    shipping_name = db.Column(String(120), nullable=False)
    shipping_email = db.Column(String(120), nullable=False)
    shipping_address = db.Column(String(255), nullable=False)
    shipping_city = db.Column(String(120), nullable=False)
    shipping_postal_code = db.Column(String(20), nullable=False)
    total = db.Column(Numeric(10, 2), nullable=False)
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

    def serialize(self):
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat(),
            "status": self.status,
            "total": float(self.total),
        }


class OrderItem(db.Model):
    id = db.Column(Integer, primary_key=True)
    order_id = db.Column(Integer, ForeignKey("customer_order.id"), nullable=False)
    product_id = db.Column(Integer, ForeignKey("product.id"), nullable=False)
    product_name = db.Column(String(160), nullable=False)
    unit_price = db.Column(Numeric(10, 2), nullable=False)
    quantity = db.Column(Integer, nullable=False)
    order = relationship("Order", back_populates="items")
