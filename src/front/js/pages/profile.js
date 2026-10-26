import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";

export function Profile() {
  const { store, actions } = useGlobalReducer();
  const [error, setError] = useState("");

  useEffect(() => {
    if (store.user) {
      actions.loadOrders().catch((requestError) => setError(requestError.message));
    }
  }, [store.user, actions]);

  if (!store.user) {
    return <Navigate to="/login" replace state={{ from: "/perfil" }} />;
  }

  return (
    <main className="container py-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1>Mi perfil</h1>
          <p className="mb-0">{store.user.name} · {store.user.email}</p>
        </div>
        <button className="btn btn-outline-secondary" type="button" onClick={actions.logout}>
          Cerrar sesión
        </button>
      </div>
      <h2 className="h3">Mis pedidos</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {!store.orders.length && <p>Aún no tienes pedidos.</p>}
      <div className="list-group">
        {store.orders.map((order) => (
          <article className="list-group-item d-flex justify-content-between gap-3" key={order.id}>
            <div>
              <strong>Pedido #{order.id}</strong>
              <div className="small text-secondary">{new Date(order.created_at).toLocaleString("es-ES")}</div>
            </div>
            <div className="text-end">
              <span className="badge bg-warning text-dark">{order.status === "pending_payment" ? "Pago pendiente" : order.status}</span>
              <div>{Number(order.total).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</div>
            </div>
          </article>
        ))}
      </div>
      <Link className="btn btn-info text-white mt-4" to="/carrito">Ver carrito</Link>
    </main>
  );
}
