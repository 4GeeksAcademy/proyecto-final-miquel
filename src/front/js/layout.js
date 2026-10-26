import { createBrowserRouter, createRoutesFromElements, Link, NavLink, Outlet, Route } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { Home } from "./pages/home";
import { Catalog } from "./pages/catalog";
import { ProductDetail } from "./pages/productDetail";
import { Cart } from "./pages/cart";
import { Login } from "./pages/login";
import { Register } from "./pages/register";
import { Profile } from "./pages/profile";

function Layout() {
  const { store } = useGlobalReducer();
  const cartCount = store.cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <>
      <header className="store-navbar">
        <nav className="container navbar navbar-expand-lg">
          <Link className="navbar-brand fw-bold text-info" to="/">SONORA</Link>
          <div className="navbar-nav flex-row flex-wrap gap-3">
            <NavLink className="nav-link" to="/">Inicio</NavLink>
            <NavLink className="nav-link" to="/categoria/guitarras">Guitarras y Bajos</NavLink>
            <NavLink className="nav-link" to="/categoria/pianos">Pianos y Teclados</NavLink>
          </div>
          <div className="ms-auto d-flex flex-wrap gap-3 align-items-center">
            {store.user ? (
              <Link to="/perfil">{store.user.name}</Link>
            ) : (
              <Link to="/login">Iniciar sesión</Link>
            )}
            <Link to="/carrito">Carrito ({cartCount})</Link>
          </div>
        </nav>
      </header>
      <Outlet />
      <footer className="store-footer py-4">
        <div className="container d-flex flex-wrap justify-content-between gap-3">
          <Link to="/">SONORA</Link>
          <nav className="d-flex gap-3" aria-label="Secciones de la tienda">
            <Link to="/categoria/guitarras">Guitarras y Bajos</Link>
            <Link to="/categoria/pianos">Pianos y Teclados</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />} errorElement={<main className="container py-5"><h1>No se pudo cargar esta página.</h1><Link to="/">Volver al inicio</Link></main>}>
      <Route index element={<Home />} />
      <Route path="categoria/:category" element={<Catalog />} />
      <Route path="producto/:id" element={<ProductDetail />} />
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="perfil" element={<Profile />} />
      <Route path="carrito" element={<Cart />} />
    </Route>
  )
);
