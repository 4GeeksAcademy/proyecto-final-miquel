import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";

export function Catalog() {
  const { category } = useParams();
  const { store, actions } = useGlobalReducer();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [message, setMessage] = useState("");
  const categoryName = category === "guitarras" ? "Guitarras y Bajos" : "Pianos y Teclados";

  const categoryProducts = useMemo(
    () => store.products.filter((product) => product.category === category),
    [store.products, category]
  );
  const subcategories = useMemo(() => {
    const unique = [...new Set(categoryProducts.map((product) => product.subcategory))];
    return unique.map((name) => ({
      name,
      image: categoryProducts.find((product) => product.subcategory === name)?.image_url
    }));
  }, [categoryProducts]);
  const filteredProducts = categoryProducts.filter((product) => {
    const matchesName = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesSubcategory = !selectedSubcategory || product.subcategory === selectedSubcategory;
    return matchesName && matchesSubcategory;
  });

  async function addToCart(product) {
    if (!store.user) {
      navigate("/login", { state: { from: `/categoria/${category}` } });
      return;
    }
    try {
      await actions.addToCart(product.id);
      setMessage(`${product.name} se añadió al carrito.`);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="container py-5">
      <nav aria-label="Ruta de navegación" className="mb-3">
        <Link to="/">Inicio</Link>
        <span className="mx-2">&gt;</span>
        <span>{categoryName}</span>
      </nav>
      <h1 className="mb-4">{categoryName}</h1>
      <label className="form-label" htmlFor="catalog-search">Buscar por nombre</label>
      <input
        className="form-control mb-4"
        id="catalog-search"
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Escribe el nombre de un producto"
      />

      <h2 className="h4 mb-3">Subcategorías</h2>
      <div className="row g-3 mb-5">
        {subcategories.map((subcategory) => (
          <div className="col-6 col-md-4 col-lg-3" key={subcategory.name}>
            <button
              className={`subcategory-button ${selectedSubcategory === subcategory.name ? "selected" : ""}`}
              type="button"
              onClick={() => setSelectedSubcategory(
                selectedSubcategory === subcategory.name ? "" : subcategory.name
              )}
            >
              <img src={subcategory.image} alt="" />
              <span>{subcategory.name}</span>
            </button>
          </div>
        ))}
      </div>

      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <h2 className="h3 mb-0">Productos</h2>
        {selectedSubcategory && (
          <button className="btn btn-outline-secondary" type="button" onClick={() => setSelectedSubcategory("")}>
            Quitar filtro
          </button>
        )}
      </div>
      {message && <div className="alert alert-info" role="status">{message}</div>}
      {store.error && <div className="alert alert-danger">{store.error}</div>}
      {store.isLoading ? (
        <p>Cargando catálogo...</p>
      ) : (
        <div className="row g-4">
          {filteredProducts.map((product) => (
            <div className="col-sm-6 col-lg-4" key={product.id}>
              <article className="card h-100">
                <img className="card-img-top catalog-product-image" src={product.image_url} alt={product.name} />
                <div className="card-body d-flex flex-column">
                  <p className="small text-secondary mb-1">{product.subcategory}</p>
                  <h3 className="h5 card-title">{product.name}</h3>
                  <p className={product.stock > 0 ? "text-success" : "text-danger"}>
                    {product.stock > 0 ? "En stock" : "Agotado"}
                  </p>
                  <p className="fs-4 fw-bold">
                    {product.price.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                  </p>
                  <div className="mt-auto d-flex flex-wrap gap-2">
                    <Link className="btn btn-outline-info" to={`/producto/${product.id}`}>Ver detalle</Link>
                    <button
                      className="btn btn-info text-white"
                      type="button"
                      disabled={product.stock < 1}
                      onClick={() => addToCart(product)}
                    >
                      Añadir al carrito
                    </button>
                  </div>
                </div>
              </article>
            </div>
          ))}
          {!filteredProducts.length && (
            <p>No hay productos que coincidan con tu búsqueda.</p>
          )}
        </div>
      )}
    </main>
  );
}
