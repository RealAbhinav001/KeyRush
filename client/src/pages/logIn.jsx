import { useState } from "react";
import { loginSchema } from "@keyrush/shared";
import { logIn } from "../api/auth";
import { Link, useNavigate } from "react-router";
import "./landing.css";
import "./auth.css";
import "./login.css";
import { useDispatch } from "react-redux";
import { signedIn } from "../features/auth/authSlice";

const userFieldErrors = {
  email: "",
  password: "",
};

const LogIn = () => {
  const [values, setValues] = useState({
    email: "",
    password: "",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [fieldErrors, setFieldErrors] = useState(userFieldErrors);

  const [formError, setFormError] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting === true) return;

    setFieldErrors(userFieldErrors);
    setFormError(null);

    const result = loginSchema.safeParse(values);

    if (result.success === false) {
      const newObject = {};

      for (const item of result.error.issues) {
        const stringPath = item.path.join(".");

        if (stringPath in newObject) {
          newObject[stringPath] += ". " + item.message;
        } else {
          newObject[stringPath] = item.message;
        }
      }

      setFieldErrors(newObject);

      return;
    }

    setIsSubmitting(true);

    try {
      const user = await logIn(result.data);

      dispatch(signedIn(user));
      navigate("/dashboard");
    } catch (error) {
      if (Object.keys(error?.details || {}).length > 0) {
        setFieldErrors(error.details);
      } else {
        setFormError(error.message);
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="kr3 kr3-auth">
      <aside className="kr3-auth-side">
        <Link className="kr3-logo" to="/" aria-label="Keyrush home">
          <span className="kr3-logo-mark" aria-hidden="true" />
          Keyrush
        </Link>

        {/* Presentation only: the lights follow isSubmitting. */}
        <div className={`kr3-li-start${isSubmitting ? " is-arming" : ""}`} aria-hidden="true">
          <div className="kr3-li-gantry">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className="kr3-li-light" style={{ "--n": n }}>
                <i />
                <i />
              </span>
            ))}
          </div>
          <p className="kr3-li-caption">
            {isSubmitting ? "Lights coming on…" : "Back on the grid in one click."}
          </p>
        </div>

        <span className="kr3-auth-kerb" aria-hidden="true" />
      </aside>

      <main className="kr3-auth-main">
        <div className="kr3-auth-panel">
          <h1>Welcome back</h1>
          <p className="kr3-auth-lede">Log in to take your slot on the grid.</p>

          <form className="kr3-auth-form" onSubmit={handleSubmit} noValidate>
            <div className="kr3-auth-field">
              <label htmlFor="li-email">Email</label>
              <input
                id="li-email"
                type="email"
                name="email"
                autoComplete="email"
                value={values.email}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "li-email-msg" : undefined}
              />
              {fieldErrors.email && (
                <p id="li-email-msg" className="kr3-auth-error">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="kr3-auth-field">
              <label htmlFor="li-password">Password</label>
              <input
                id="li-password"
                type="password"
                name="password"
                autoComplete="current-password"
                value={values.password}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "li-password-msg" : undefined}
              />
              {fieldErrors.password && (
                <p id="li-password-msg" className="kr3-auth-error">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {formError && (
              <p className="kr3-auth-alert" role="alert">
                {formError}
              </p>
            )}

            <button
              className="kr3-btn kr3-auth-submit"
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? "Logging in…" : "Log in"}
            </button>
          </form>

          <p className="kr3-auth-switch">
            New to Keyrush? <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default LogIn;
