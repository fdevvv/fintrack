export function Input({
  label,
  error,
  className = '',
  id,
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-3 py-2.5 rounded-xl border text-sm transition-colors
          focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500
          ${error ? 'border-danger-500' : 'border-gray-200'}
        `}
        {...props}
      />
      {error && <p className="text-xs text-danger-500">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className = '', id, ...props }) {
  const selectId = id || label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`
          w-full px-3 py-2.5 rounded-xl border text-sm transition-colors bg-white
          focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500
          ${error ? 'border-danger-500' : 'border-gray-200'}
        `}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-danger-500">{error}</p>}
    </div>
  );
}

export function MoneyInput({ label, currency = 'ARS', error, value, onChange, ...props }) {
  const symbol = currency === 'USD' ? 'US$' : '$';

  const handleChange = (e) => {
    // Allow only numbers and one decimal point
    const raw = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
    onChange(raw);
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
          {symbol}
        </span>
        <input
          type="text"
          inputMode="decimal"
          className={`
            w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm text-right font-mono
            transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20
            focus:border-brand-500
            ${error ? 'border-danger-500' : 'border-gray-200'}
          `}
          value={value}
          onChange={handleChange}
          placeholder="0.00"
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger-500">{error}</p>}
    </div>
  );
}
