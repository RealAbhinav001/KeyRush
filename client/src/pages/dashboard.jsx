import { useSelector } from "react-redux";
import { Link } from "react-router";
import "./landing.css";
import "./dashboard.css";

const Dashboard = () => {
  const username = useSelector((state) => state.auth.user?.username);
  const name = username || "racer";

  return (
    <div className="kr3 kr3-db">
      <header className="kr3-db-bar">
        <Link className="kr3-logo" to="/" aria-label="Keyrush home">
          <span className="kr3-logo-mark" aria-hidden="true" />
          Keyrush
        </Link>
        <span className="kr3-db-chip-plate">{name}</span>
      </header>

      <main className="kr3-db-scene">
        {/* Start lights, flat above the track */}
        <div className="kr3-db-sky">
          <div className="kr3-db-gantry" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className="kr3-db-light" style={{ "--n": n }}>
                <i />
                <i />
              </span>
            ))}
          </div>
          <p className="kr3-db-status">Multiplayer races open soon. Your slot is saved.</p>
        </div>

        {/* The track itself, tilted away from you */}
        <div className="kr3-db-track">
          <h1 className="kr3-db-paint">You're on the grid.</h1>
          <span className="kr3-db-startline" aria-hidden="true" />

          <ol className="kr3-db-slots" aria-label="Starting grid">
            <li className="kr3-db-slot is-you">
              <span className="kr3-db-pos">P1</span>
              <span className="kr3-db-car">
                <span className="kr3-db-plate">{name}</span>
              </span>
            </li>
            <li className="kr3-db-slot">
              <span className="kr3-db-pos">P2</span>
              <span className="kr3-db-open">Open</span>
            </li>
            <li className="kr3-db-slot">
              <span className="kr3-db-pos">P3</span>
              <span className="kr3-db-open">Open</span>
            </li>
            <li className="kr3-db-slot">
              <span className="kr3-db-pos">P4</span>
              <span className="kr3-db-open">Open</span>
            </li>
          </ol>
        </div>

        {/* Broadcast timing bar */}
        <section className="kr3-db-tv" aria-labelledby="db-tv-title">
          <h2 id="db-tv-title" className="kr3-sr">
            Your numbers
          </h2>
          <div className="kr3-db-tv-bar">
            <div className="kr3-db-tv-driver">
              <span className="kr3-db-tv-pos">P1</span>
              <span className="kr3-db-tv-name">{name}</span>
            </div>
            <dl className="kr3-db-tv-stats">
              <div>
                <dt>Races</dt>
                <dd>0</dd>
              </div>
              <div>
                <dt>Best WPM</dt>
                <dd aria-label="No data yet">–</dd>
              </div>
              <div>
                <dt>Accuracy</dt>
                <dd aria-label="No data yet">–</dd>
              </div>
            </dl>
          </div>
          <p className="kr3-db-tv-note">Your numbers show up after your first race.</p>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
