import logo from "../../images/chimps-logo-small.png";
import "./GlobalLoader.scss";

const GlobalLoader = () => {
  return (
    <main
      className="global-loader"
      role="status"
      aria-live="polite"
      aria-label="Loading Chimpcino"
    >
      <div className="global-loader-glow" aria-hidden="true" />

      <div className="global-loader-content">
        <div className="global-loader-brand">
          <span
            className="global-loader-sparkles global-loader-sparkles-top"
            aria-hidden="true"
          >
            <span className="global-loader-spark global-loader-spark-large" />
            <span className="global-loader-spark global-loader-spark-small" />
          </span>

          <img className="global-loader-logo" src={logo} alt="Chimps" />

          <span
            className="global-loader-sparkles global-loader-sparkles-bottom"
            aria-hidden="true"
          >
            <span className="global-loader-spark global-loader-spark-large" />
            <span className="global-loader-spark global-loader-spark-small" />
          </span>
        </div>

        <div className="global-loader-status" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </main>
  );
};

export default GlobalLoader;
