import os

from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from flask_admin.theme import Bootstrap4Theme

from .models import Product, db


class ProductAdminView(ModelView):
    can_create = False
    can_edit = False
    can_delete = False


def setup_admin(app):
    app.secret_key = os.environ.get('FLASK_APP_KEY') or app.config['SECRET_KEY']
    admin = Admin(app, name='4Geeks Admin', theme=Bootstrap4Theme(swatch='cerulean'))
    admin.add_view(ProductAdminView(Product, db.session))