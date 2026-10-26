from decimal import Decimal
import secrets

from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    jwt_required,
)
from sqlalchemy import func
from werkzeug.security import check_password_hash, generate_password_hash

from api.models import CartItem, Order, OrderItem, Product, User, db

api = Blueprint("api", __name__)


def current_user():
    return db.session.get(User, int(get_jwt_identity()))


def cart_response(user):
    items = CartItem.query.filter_by(user_id=user.id).all()
    cart = []
    total = Decimal("0.00")
    for item in items:
        product = item.product.serialize()
        subtotal = item.product.price * item.quantity
        total += subtotal
        cart.append({
            "id": item.id,
            "product_id": item.product_id,
            "quantity": item.quantity,
            "product": product,
            "subtotal": float(subtotal),
        })
    return {"items": cart, "total": float(total)}


@api.route("/hello", methods=["GET", "POST"])
def handle_hello():
    return jsonify({"message": "Hello! The API is ready."}), 200


@api.route("/categories", methods=["GET"])
def get_categories():
    category_names = {
        "guitarras": "Guitarras y Bajos",
        "pianos": "Pianos y Teclados",
    }
    categories = db.session.query(Product.category).distinct().all()
    return jsonify([
        {"slug": category, "name": category_names.get(category, category)}
        for (category,) in categories
    ]), 200


@api.route("/products", methods=["GET"])
def get_products():
    query = Product.query
    category = request.args.get("category")
    search = request.args.get("search", "").strip()
    if category:
        query = query.filter_by(category=category)
    if search:
        query = query.filter(func.lower(Product.name).contains(search.lower()))
    return jsonify([product.serialize() for product in query.order_by(Product.name).all()]), 200


@api.route("/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    product = db.session.get(Product, product_id)
    if product is None:
        return jsonify({"message": "Producto no encontrado."}), 404
    return jsonify(product.serialize()), 200


@api.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    if not name or "@" not in email or len(password) < 8:
        return jsonify({"message": "Indica nombre, correo válido y una contraseña de al menos 8 caracteres."}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Ya existe una cuenta con ese correo."}), 409
    user = User(name=name, email=email, password=generate_password_hash(password), is_active=True)
    db.session.add(user)
    db.session.commit()
    token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": token, "user": user.serialize()}), 201


@api.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    user = User.query.filter_by(email=email, is_active=True).first()
    if user is None or not check_password_hash(user.password, password):
        return jsonify({"message": "Correo o contraseña incorrectos."}), 401
    token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": token, "user": user.serialize()}), 200


@api.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    user = current_user()
    if user is None or not user.is_active:
        return jsonify({"message": "La cuenta no está disponible."}), 404
    return jsonify(user.serialize()), 200


@api.route("/me", methods=["PUT"])
@jwt_required()
def update_me():
    user = current_user()
    if user is None or not user.is_active:
        return jsonify({"message": "La cuenta no está disponible."}), 404

    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    if not name or "@" not in email or "." not in email.rsplit("@", 1)[-1]:
        return jsonify({"message": "Indica un nombre y un correo electrónico válido."}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user is not None and existing_user.id != user.id:
        return jsonify({"message": "Ya existe una cuenta con ese correo."}), 409

    user.name = name
    user.email = email
    db.session.commit()
    return jsonify(user.serialize()), 200


@api.route("/me", methods=["DELETE"])
@jwt_required()
def delete_me():
    user = current_user()
    if user is None or not user.is_active:
        return jsonify({"message": "La cuenta no está disponible."}), 404

    deleted_email = f"deleted-{user.id}-{secrets.token_hex(8)}@deleted.invalid"
    user.name = None
    user.email = deleted_email
    user.password = generate_password_hash(secrets.token_urlsafe(32))
    user.is_active = False
    CartItem.query.filter_by(user_id=user.id).delete()
    for order in user.orders:
        order.shipping_name = "Cuenta eliminada"
        order.shipping_email = deleted_email
        order.shipping_address = "Eliminado"
        order.shipping_city = "Eliminado"
        order.shipping_postal_code = "Eliminado"
    db.session.commit()
    return jsonify({"message": "La cuenta se ha eliminado."}), 200


@api.route("/orders", methods=["GET"])
@jwt_required()
def get_orders():
    user = current_user()
    if user is None:
        return jsonify({"message": "La cuenta no está disponible."}), 404
    orders = Order.query.filter_by(user_id=user.id).order_by(Order.created_at.desc()).all()
    return jsonify([order.serialize() for order in orders]), 200


@api.route("/cart", methods=["GET"])
@jwt_required()
def get_cart():
    user = current_user()
    if user is None:
        return jsonify({"message": "La cuenta no está disponible."}), 404
    return jsonify(cart_response(user)), 200


@api.route("/cart/items", methods=["POST"])
@jwt_required()
def add_cart_item():
    user = current_user()
    if user is None:
        return jsonify({"message": "La cuenta no está disponible."}), 404
    data = request.get_json(silent=True) or {}
    try:
        product_id = int(data.get("product_id"))
        quantity = int(data.get("quantity", 1))
    except (TypeError, ValueError):
        return jsonify({"message": "Producto o cantidad no válidos."}), 400
    if quantity < 1:
        return jsonify({"message": "La cantidad debe ser mayor que cero."}), 400
    product = db.session.get(Product, product_id)
    if product is None:
        return jsonify({"message": "Producto no encontrado."}), 404
    item = CartItem.query.filter_by(user_id=user.id, product_id=product.id).first()
    new_quantity = quantity + (item.quantity if item else 0)
    if new_quantity > product.stock:
        return jsonify({"message": "No hay suficiente stock disponible."}), 409
    if item:
        item.quantity = new_quantity
    else:
        db.session.add(CartItem(user_id=user.id, product_id=product.id, quantity=quantity))
    db.session.commit()
    return jsonify(cart_response(user)), 200


@api.route("/cart/items/<int:item_id>", methods=["PUT"])
@jwt_required()
def update_cart_item(item_id):
    user = current_user()
    if user is None:
        return jsonify({"message": "La cuenta no está disponible."}), 404
    item = CartItem.query.filter_by(id=item_id, user_id=user.id).first()
    if item is None:
        return jsonify({"message": "El artículo no está en el carrito."}), 404
    data = request.get_json(silent=True) or {}
    try:
        quantity = int(data.get("quantity"))
    except (TypeError, ValueError):
        return jsonify({"message": "La cantidad no es válida."}), 400
    if quantity < 1:
        return jsonify({"message": "La cantidad debe ser mayor que cero."}), 400
    if quantity > item.product.stock:
        return jsonify({"message": "No hay suficiente stock disponible."}), 409
    item.quantity = quantity
    db.session.commit()
    return jsonify(cart_response(user)), 200


@api.route("/cart/items/<int:item_id>", methods=["DELETE"])
@jwt_required()
def remove_cart_item(item_id):
    user = current_user()
    if user is None:
        return jsonify({"message": "La cuenta no está disponible."}), 404
    item = CartItem.query.filter_by(id=item_id, user_id=user.id).first()
    if item is None:
        return jsonify({"message": "El artículo no está en el carrito."}), 404
    db.session.delete(item)
    db.session.commit()
    return jsonify(cart_response(user)), 200


@api.route("/checkout", methods=["POST"])
@jwt_required()
def checkout():
    user = current_user()
    if user is None:
        return jsonify({"message": "La cuenta no está disponible."}), 404
    data = request.get_json(silent=True) or {}
    fields = {
        "shipping_name": str(data.get("name", "")).strip(),
        "shipping_email": str(data.get("email", "")).strip(),
        "shipping_address": str(data.get("address", "")).strip(),
        "shipping_city": str(data.get("city", "")).strip(),
        "shipping_postal_code": str(data.get("postal_code", "")).strip(),
    }
    if any(not value for value in fields.values()) or "@" not in fields["shipping_email"]:
        return jsonify({"message": "Completa correctamente todos los datos de envío."}), 400
    cart_items = CartItem.query.filter_by(user_id=user.id).all()
    if not cart_items:
        return jsonify({"message": "El carrito está vacío."}), 400
    if any(item.quantity > item.product.stock for item in cart_items):
        return jsonify({"message": "El stock de un producto ha cambiado. Revisa tu carrito."}), 409

    total = sum((item.product.price * item.quantity for item in cart_items), Decimal("0.00"))
    order = Order(user_id=user.id, total=total, **fields)
    db.session.add(order)
    db.session.flush()
    for item in cart_items:
        db.session.add(OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            product_name=item.product.name,
            unit_price=item.product.price,
            quantity=item.quantity,
        ))
        db.session.delete(item)
    db.session.commit()
    return jsonify({
        "order": order.serialize(),
        "message": "Pedido registrado. El pago queda pendiente hasta integrar una pasarela segura.",
    }), 201
