
import click
from werkzeug.security import generate_password_hash

from api.models import Product, User, db

DEFAULT_PRODUCTS = [
    {
        "category": "guitarras",
        "subcategory": "Guitarras Eléctricas",
        "name": "Classic Electric Sunburst",
        "description": "Guitarra eléctrica versátil con acabado sunburst, cómoda para estudiar y tocar en directo.",
        "price": 499.00,
        "stock": 12,
        "image_url": "https://images.unsplash.com/photo-1550291652-6ea9114a47b1?auto=format&fit=crop&w=900&q=80",
    },
    {
        "category": "guitarras",
        "subcategory": "Guitarras Acústicas",
        "name": "Acoustic Wood 100",
        "description": "Guitarra acústica de sonido cálido y construcción resistente para acompañamiento y práctica.",
        "price": 329.00,
        "stock": 10,
        "image_url": "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=900&q=80",
    },
    {
        "category": "guitarras",
        "subcategory": "Bajos Eléctricos",
        "name": "Bass Player 4",
        "description": "Bajo eléctrico de cuatro cuerdas con perfil cómodo y sonido definido.",
        "price": 379.00,
        "stock": 8,
        "image_url": "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?auto=format&fit=crop&w=900&q=80",
    },
    {
        "category": "guitarras",
        "subcategory": "Amplificadores",
        "name": "Studio Amp 20",
        "description": "Amplificador compacto de 20 W para practicar en casa y ensayar.",
        "price": 149.00,
        "stock": 15,
        "image_url": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=80",
    },
    {
        "category": "pianos",
        "subcategory": "Pianos Digitales",
        "name": "Digital Piano Home 88",
        "description": "Piano digital de 88 teclas con respuesta natural para practicar y aprender.",
        "price": 599.00,
        "stock": 7,
        "image_url": "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=900&q=80",
    },
    {
        "category": "pianos",
        "subcategory": "Sintetizadores",
        "name": "Synth Stage 61",
        "description": "Sintetizador de 61 teclas diseñado para directo y producción musical.",
        "price": 449.00,
        "stock": 6,
        "image_url": "https://images.unsplash.com/photo-1552422535-c45813c61732?auto=format&fit=crop&w=900&q=80",
    },
    {
        "category": "pianos",
        "subcategory": "Teclados MIDI",
        "name": "USB MIDI Keys 49",
        "description": "Teclado MIDI de 49 teclas para controlar instrumentos y software musical.",
        "price": 129.00,
        "stock": 14,
        "image_url": "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=900&q=80",
    },
    {
        "category": "pianos",
        "subcategory": "Pianos Clásicos",
        "name": "Classic Grand 150",
        "description": "Piano acústico de cola con acabado cuidado y respuesta expresiva.",
        "price": 1299.00,
        "stock": 2,
        "image_url": "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80",
    },
]

def setup_commands(app):
    @app.cli.command("insert-test-users")
    @click.argument("count")
    def insert_test_users(count):
        print("Creating test users")
        for x in range(1, int(count) + 1):
            user = User()
            user.name = "Test User " + str(x)
            user.email = "test_user" + str(x) + "@test.com"
            user.password = generate_password_hash("12345678")
            user.is_active = True
            db.session.add(user)
            db.session.commit()
            print("User: ", user.email, " created.")

        print("All test users created")

    @app.cli.command("insert-test-data")
    def insert_test_data():
        added_count = 0
        for product_data in DEFAULT_PRODUCTS:
            existing = Product.query.filter_by(name=product_data["name"]).first()
            if existing is None:
                db.session.add(Product(**product_data))
                added_count += 1
        db.session.commit()
        click.echo(f"Catálogo actualizado: {added_count} productos añadidos.")