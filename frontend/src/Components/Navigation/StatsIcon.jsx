const StatsIcon = ({ className = "" }) => {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M4 19V9m6 10V5m6 14v-7m4 7H2" />
    </svg>
  );
};

export default StatsIcon;
