import { Link, useLocation } from "react-router";
import "./landing.css";
import "./notFound.css";

const NotFound = () => {
  const { pathname } = useLocation();

  return (
    <div className="kr3 kr3-404">
      <header className="kr3-404-bar">
        <Link className="kr3-logo" to="/" aria-label="Keyrush home">
          <span className="kr3-logo-mark" aria-hidden="true" />
          Keyrush
        </Link>
      </header>

      <main className="kr3-404-main" aria-labelledby="nf-title">
        <p className="kr3-404-flag" aria-hidden="true">
          <span />
          Yellow flag
        </p>
        <h1 id="nf-title">Off the track.</h1>
        <p className="kr3-404-lede">There's no page at this address. Head back to the grid.</p>
        <p className="kr3-404-path">
          <span className="kr3-404-code">404</span>
          <code>{pathname}</code>
        </p>
        <div className="kr3-404-actions">
          <Link className="kr3-btn" to="/">
            Back to the grid
          </Link>
          <Link className="kr3-btn kr3-btn-ghost" to="/signup">
            Create account
          </Link>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
