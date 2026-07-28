import { Link } from "react-router-dom";
import "./NotFoundPage.scss";

const NotFoundPage = () => {
  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <div className="not-found-visual" aria-hidden="true">
          <span className="not-found-orbit">
            <span className="not-found-ball" />
          </span>
          <span className="not-found-number">404</span>
          <span className="not-found-chip not-found-chip-left">C</span>
          <span className="not-found-chip not-found-chip-right">C</span>
        </div>

        <div className="not-found-copy">
          <span className="not-found-eyebrow">Table not found</span>
          <h1>Looks like this table is closed.</h1>
          <p>
            The page may have moved, or the dealer never opened it. Pick a game
            and get back in the action.
          </p>

          <div className="not-found-actions">
            <Link className="not-found-primary" to="/">
              Back to lobby
            </Link>
            <Link className="not-found-secondary" to="/roulette">
              Play roulette
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default NotFoundPage;
