export const WidgetCard = ({ children, className = '', onClick, ...props }) => (
  <div
    className={`bg-[var(--bg-panel)]/80 backdrop-blur-3xl border border-[var(--border-color)] shadow-[0_24px_48px_rgba(0,0,0,0.4)] rounded-[32px] overflow-hidden ${className}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </div>
);
