import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";

export function Login() {
  const { actions } = useGlobalReducer();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitLogin(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const formData = new FormData(event.currentTarget);
    try {
      await actions.login({
        email: formData.get("email"),
        password: formData.get("password")
      });
      navigate(location.state?.from || "/", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container py-5">
      <div className="auth-card card mx-auto">
        <div className="card-body p-4">
          <h1 className="h2 mb-4">Iniciar sesión</h1>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={submitLogin}>
            <label className="form-label" htmlFor="login-email">Correo electrónico</label>
            <input className="form-control mb-3" id="login-email" name="email" type="email" autoComplete="email" required />
            <label className="form-label" htmlFor="login-password">Contraseña</label>
            <input className="form-control mb-4" id="login-password" name="password" type="password" autoComplete="current-password" required />
            <button className="btn btn-info text-white w-100" type="submit" disabled={submitting}>
              {submitting ? "Entrando..." : "Entrar"}
            </button>
          </form>
          <p className="mt-3 mb-0">¿Aún no tienes cuenta? <Link to="/register">Regístrate</Link></p>
        </div>
      </div>
    </main>
  );
}
