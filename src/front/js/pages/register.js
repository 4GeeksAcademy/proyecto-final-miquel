import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";

export function Register() {
  const { actions } = useGlobalReducer();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitRegistration(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const formData = new FormData(event.currentTarget);
    try {
      await actions.register({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password")
      });
      navigate("/perfil", { replace: true });
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
          <h1 className="h2 mb-4">Crear cuenta</h1>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={submitRegistration}>
            <label className="form-label" htmlFor="register-name">Nombre</label>
            <input className="form-control mb-3" id="register-name" name="name" autoComplete="name" required />
            <label className="form-label" htmlFor="register-email">Correo electrónico</label>
            <input className="form-control mb-3" id="register-email" name="email" type="email" autoComplete="email" required />
            <label className="form-label" htmlFor="register-password">Contraseña (mínimo 8 caracteres)</label>
            <input className="form-control mb-4" id="register-password" name="password" type="password" minLength="8" autoComplete="new-password" required />
            <button className="btn btn-info text-white w-100" type="submit" disabled={submitting}>
              {submitting ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>
          <p className="mt-3 mb-0">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
        </div>
      </div>
    </main>
  );
}
