export function Card({ children, className = '', onClick, ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-b border-gray-50 ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}
