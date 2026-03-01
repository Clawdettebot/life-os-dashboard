export const WidgetCard = ({ children, className = '', onClick, ...props }) => (
    <div 
      className={`bg-[#0f0f13]/60 backdrop-blur-3xl border border-white-[0.08] shadow-[0_24px_48px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] rounded-[32px] overflow-hidden ${className}`}
      onClick={onClick}
      {...props}
    >
        {children}
    </div>
);
