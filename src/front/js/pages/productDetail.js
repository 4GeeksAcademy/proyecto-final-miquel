import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";

export function ProductDetail() {
  const { id } = useParams();
  const { store, actions } = useGlobalReducer();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const product = store.products.find((item) => String(item.id) === id);

  async function addToCart() {
    if (!store.user) {
      navigate("/login", { state: { from: `/producto/${id}` } });
      return;
    }
    try {
      await actions.addToCart(product.id);
      setMessage("El producto se añadió al carrito.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (store.isLoading) {
    return <main className="container py-5"><p>Cargando producto...</p></main>;
  }

  if (!product) {
    return (
      <main className="container py-5">
        <h1>Producto no encontrado</h1>
        <Link to="/">Volver al inicio</Link>
      </main>
    );
  }

  return (
    <main className="container py-5">
      <nav aria-label="Ruta de navegación" className="mb-4">
        <Link to="/">Inicio</Link>
        <span className="mx-2">&gt;</span>
        <Link to={`/categoria/${product.category}`}>
          {product.category === "guitarras" ? "Guitarras y Bajos" : "Pianos y Teclados"}
        </Link>
        <span className="mx-2">&gt;</span>
        <span>{product.name}</span>
      </nav>
      <div className="row g-5">
        <div className="col-md-6">
          <img className="img-fluid rounded product-detail-image" src={product.image_url} alt={product.name} />
        </div>
        <section className="col-md-6">
          <p className="text-secondary">{product.subcategory}</p>
          <h1>{product.name}</h1>
          <p className={product.stock > 0 ? "text-success fw-bold" : "text-danger fw-bold"}>
            {product.stock > 0 ? "En stock" : "Agotado"}
          </p>
          <p className="product-description">{product.description}</p>
          <p className="text-secondary">Garantía de 3 años</p>
          <p className="display-6 fw-bold">
            {product.price.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
          </p>
          {message && <div className="alert alert-info" role="status">{message}</div>}
          <button
            className="btn btn-info btn-lg text-white"
            type="button"
            disabled={product.stock < 1}
            onClick={addToCart}
          >
            Añadir al carrito
          </button>
        </section>
      </div>
    </main>
  );
}
