import { useState } from "react";
import { signUpSchema } from "@keyrush/shared";
import { signUp } from "../api/auth";
import { useDispatch } from "react-redux";
import { signedIn } from "../features/auth/authSlice";
import { Link, useNavigate } from "react-router";
import "./landing.css";
import "./auth.css";
import "./signup.css";

const userFieldErrors = {
  username: "",
  email: "",
  password: "",
};

const SignUp = () => {
  const [values, setValues] = useState({
    username: "",
    email: "",
    password: "",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formError, setFormError] = useState(null);

  const [fieldErrors, setFieldErrors] = useState(userFieldErrors);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting !== false) return;

    setFormError(null);
    setFieldErrors(userFieldErrors);

    const result = signUpSchema.safeParse(values);
    if (result.success === false) {
      const newObject = {};

      for (const item of result.error.issues) {
        const stringItem = item.path.join(".");

        if (stringItem in newObject) {
          newObject[stringItem] += ". " + item.message;
        } else {
          newObject[stringItem] = item.message;
        }
      }

      setFieldErrors(newObject);

      return;
    }

    setIsSubmitting(true);

    try {
      const user = await signUp(result.data);

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

  // Presentation only: preview the name the way the server will store it.
  const plateName = values.username.trim().toLowerCase();

  return (
    <div className="kr3 kr3-auth">
      <aside className="kr3-auth-side">
        <Link className="kr3-logo" to="/" aria-label="Keyrush home">
          <span className="kr3-logo-mark" aria-hidden="true" />
          Keyrush
        </Link>

        <div className="kr3-su-plate-wrap" aria-hidden="true">
          <span key={plateName.length} className="kr3-su-streak" />
          <div
            className={`kr3-su-plate${plateName ? "" : " is-empty"}`}
            style={{ "--len": Math.max(plateName.length, 6) }}
          >
            <span className="kr3-su-plate-name">{plateName || "your_name"}</span>
          </div>
          <p className="kr3-su-plate-meta">
            <span className="kr3-su-count">{plateName.length}/20</span>
          </p>
        </div>

        <span className="kr3-auth-kerb" aria-hidden="true" />
      </aside>

      <main className="kr3-auth-main">
        <div className="kr3-auth-panel">
          <h1>Create your account</h1>
          <p className="kr3-auth-lede">Pick a racing name and you're on the grid in seconds.</p>

          <form className="kr3-auth-form" noValidate onSubmit={handleSubmit}>
            <div className="kr3-auth-field">
              <label htmlFor="su-username">Username</label>
              <input
                id="su-username"
                type="text"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={20}
                value={values.username}
                onChange={handleFormChange}
                aria-invalid={Boolean(fieldErrors.username)}
                aria-describedby="su-username-msg"
              />
              <p
                id="su-username-msg"
                className={fieldErrors.username ? "kr3-auth-error" : "kr3-auth-hint"}
              >
                {fieldErrors.username || "3 to 20 letters, numbers or underscores."}
              </p>
            </div>

            <div className="kr3-auth-field">
              <label htmlFor="su-email">Email</label>
              <input
                id="su-email"
                type="email"
                name="email"
                autoComplete="email"
                value={values.email}
                onChange={handleFormChange}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "su-email-msg" : undefined}
              />
              {fieldErrors.email && (
                <p id="su-email-msg" className="kr3-auth-error">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="kr3-auth-field">
              <label htmlFor="su-password">Password</label>
              <input
                id="su-password"
                type="password"
                name="password"
                autoComplete="new-password"
                value={values.password}
                onChange={handleFormChange}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby="su-password-msg"
              />
              <p
                id="su-password-msg"
                className={fieldErrors.password ? "kr3-auth-error" : "kr3-auth-hint"}
              >
                {fieldErrors.password || "At least 8 characters."}
              </p>
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
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="kr3-auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default SignUp;
