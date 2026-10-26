import { Link, useNavigate } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";

function ProductCard({ product, store, actions, navigate }) {
  async function addProduct() {
    if (!store.user) {
      navigate("/login", { state: { from: `/producto/${product.id}` } });
      return;
    }
    try {
      await actions.addToCart(product.id);
    } catch (error) {
      window.alert(error.message);
    }
  }

  return (
    <article className="card h-100">
      <img className="card-img-top home-product-image" src={product.image_url} alt={product.name} />
      <div className="card-body d-flex flex-column">
        <h3 className="h5 card-title">{product.name}</h3>
        <p className="text-success mb-2">En stock</p>
        <p className="fs-4 fw-bold">{product.price.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</p>
        <div className="mt-auto d-flex flex-wrap gap-2">
          <Link className="btn btn-outline-info" to={`/producto/${product.id}`}>Ver detalle</Link>
          <button className="btn btn-info text-white" type="button" onClick={addProduct}>Añadir al carrito</button>
        </div>
      </div>
    </article>
  );
}

export function Home() {
  const { store, actions } = useGlobalReducer();
  const navigate = useNavigate();

  return (
    <main>
      <section className="store-hero">
        <div className="container py-5">
          <p className="text-info fw-bold">SONORA · INSTRUMENTOS MUSICALES</p>
          <h1 className="display-3 fw-bold">Tu pasión por la música empieza aquí</h1>
          <p className="lead store-hero-copy">
            Descubre nuestra selección de instrumentos para principiantes y profesionales al mejor precio.
          </p>
          <a className="btn btn-info btn-lg text-white fw-bold" href="#departamentos">Explorar catálogo</a>
        </div>
      </section>

      <section className="container py-5 text-center">
        <h2 className="mb-3">Bienvenidos a nuestra tienda</h2>
        <p className="lead mx-auto store-welcome-copy">
          Somos especialistas en instrumentos musicales revisados por músicos profesionales. Cada instrumento se prepara con cuidado y acompañamos a cada persona desde su primer acorde hasta el escenario.
        </p>
      </section>

      <section className="container pb-5">
        <h2 className="text-center mb-4">Nuestras Ventajas</h2>
        <div className="row g-4">
          <div className="col-md-4">
            <article className="card h-100 border-info">
              <div className="card-body">
                <h3 className="h5">Envío Gratis y Seguro</h3>
                <p className="mb-0">Embalaje especial para proteger tu instrumento hasta la puerta de tu casa.</p>
              </div>
            </article>
          </div>
          <div className="col-md-4">
            <article className="card h-100 border-info">
              <div className="card-body">
                <h3 className="h5">3 Años de Garantía</h3>
                <p className="mb-0">Taller propio y soporte técnico en todos nuestros productos.</p>
              </div>
            </article>
          </div>
          <div className="col-md-4">
            <article className="card h-100 border-info">
              <div className="card-body">
                <h3 className="h5">Para Todos los Niveles</h3>
                <p className="mb-0">Desde tu primer instrumento de estudio hasta equipo profesional.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="container pb-5" id="departamentos">
        <h2 className="text-center mb-4">Explora nuestros departamentos</h2>
        <div className="row g-4">
          <div className="col-md-6">
            <Link className="department-link guitar-department-link" to="/categoria/guitarras">
              <span>Guitarras y Bajos</span>
              <span className="btn btn-info text-white">Ver sección</span>
            </Link>
          </div>
          <div className="col-md-6">
            <Link className="department-link piano-department-link" to="/categoria/pianos">
              <span>Pianos y Teclados</span>
              <span className="btn btn-info text-white">Ver sección</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="container pb-5">
        <h2 className="text-center mb-4">Productos destacados</h2>
        {store.error && <div className="alert alert-danger">{store.error}</div>}
        {store.isLoading ? (
          <p className="text-center">Cargando catálogo...</p>
        ) : (
          <div className="row g-4">
            {store.products.slice(0, 4).map((product) => (
              <div className="col-sm-6 col-lg-3" key={product.id}>
                <ProductCard product={product} store={store} actions={actions} navigate={navigate} />
              </div>
            ))}
            {!store.products.length && !store.error && (
              <p className="text-center">No hay productos disponibles en este momento.</p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
