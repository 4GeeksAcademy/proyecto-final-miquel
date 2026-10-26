import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";

function formatPrice(value) {
  return Number(value).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

export function Cart() {
  const { store, actions } = useGlobalReducer();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!store.user) {
    return (
      <main className="container py-5">
        <h1>Tu carrito</h1>
        <p>Inicia sesión para consultar y guardar tu carrito.</p>
        <Link className="btn btn-info text-white" to="/login">Iniciar sesión</Link>
      </main>
    );
  }

  async function changeQuantity(item, quantity) {
    setFeedback(null);
    try {
      if (quantity < 1) {
        await actions.removeFromCart(item.id);
      } else {
        await actions.updateCartItem(item.id, quantity);
      }
    } catch (error) {
      setFeedback({ type: "danger", text: error.message });
    }
  }

  async function submitOrder(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const result = await actions.checkout({
        name: formData.get("name"),
        email: formData.get("email"),
        address: formData.get("address"),
        city: formData.get("city"),
        postal_code: formData.get("postal_code")
      });
      setFeedback({
        type: "success",
        text: `Pedido #${result.order.id} registrado. El pago queda pendiente hasta integrar una pasarela segura.`
      });
      form.reset();
    } catch (error) {
      setFeedback({ type: "danger", text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (store.isLoading) {
    return <main className="container py-5"><p>Cargando carrito...</p></main>;
  }

  return (
    <main className="container py-5">
      <h1 className="mb-4">Carrito y pedido</h1>
      {feedback && <div className={`alert alert-${feedback.type}`} role="status">{feedback.text}</div>}
      {store.cart.length === 0 ? (
        <div className="alert alert-light border">
          Tu carrito está vacío. <Link to="/categoria/guitarras">Explora el catálogo</Link>.
        </div>
      ) : (
        <div className="row g-4">
          <section className="col-lg-7" aria-label="Productos del carrito">
            <div className="list-group">
              {store.cart.map((item) => (
                <article className="list-group-item" key={item.id}>
                  <div className="d-flex flex-wrap align-items-center gap-3">
                    <img className="cart-product-image" src={item.product.image_url} alt={item.product.name} />
                    <div className="flex-grow-1">
                      <h2 className="h5 mb-1">{item.product.name}</h2>
                      <p className="mb-1">{formatPrice(item.product.price)} por unidad</p>
                      <strong>{formatPrice(item.subtotal)}</strong>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        aria-label={`Reducir cantidad de ${item.product.name}`}
                        onClick={() => changeQuantity(item, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span aria-live="polite">{item.quantity}</span>
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        aria-label={`Aumentar cantidad de ${item.product.name}`}
                        disabled={item.quantity >= item.product.stock}
                        onClick={() => changeQuantity(item, item.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        type="button"
                        aria-label={`Eliminar ${item.product.name}`}
                        onClick={() => changeQuantity(item, 0)}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="col-lg-5">
            <div className="card mb-4">
              <div className="card-body">
                <h2 className="h4">Resumen de tu pedido</h2>
                <div className="d-flex justify-content-between py-2">
                  <span>Envío</span><strong className="text-success">Gratis</strong>
                </div>
                <div className="d-flex justify-content-between border-top pt-3">
                  <span>Total</span><strong className="fs-4">{formatPrice(store.cartTotal)}</strong>
                </div>
              </div>
            </div>

            <form className="card" onSubmit={submitOrder}>
              <div className="card-body">
                <h2 className="h4">Datos de envío</h2>
                <p className="text-secondary">
                  Registra tu pedido. La web no recoge información de tarjetas ni procesa pagos.
                </p>
                <label className="form-label" htmlFor="shipping-name">Nombre completo</label>
                <input className="form-control mb-3" id="shipping-name" name="name" autoComplete="name" required />
                <label className="form-label" htmlFor="shipping-email">Correo electrónico</label>
                <input className="form-control mb-3" id="shipping-email" name="email" type="email" autoComplete="email" required />
                <label className="form-label" htmlFor="shipping-address">Dirección</label>
                <input className="form-control mb-3" id="shipping-address" name="address" autoComplete="street-address" required />
                <label className="form-label" htmlFor="shipping-city">Ciudad</label>
                <input className="form-control mb-3" id="shipping-city" name="city" autoComplete="address-level2" required />
                <label className="form-label" htmlFor="shipping-postal">Código postal</label>
                <input className="form-control mb-3" id="shipping-postal" name="postal_code" autoComplete="postal-code" required />
                <button
                  className="btn btn-info text-white fw-bold w-100"
                  type="submit"
                  disabled={!store.cart.length || isSubmitting}
                >
                  {isSubmitting ? "Registrando pedido..." : "Registrar pedido"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
      <button className="btn btn-link mt-3" type="button" onClick={() => navigate(-1)}>
        Volver
      </button>
    </main>
  );
}
