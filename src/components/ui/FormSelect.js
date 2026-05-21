import React from 'react';

function FormSelect({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  options = [],
  placeholder = 'Select an option',
  required = false,
  disabled = false,
}) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={name} className="input-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          className={`
            input-field appearance-none pr-10
            ${error ? 'border-red-400 focus:ring-red-400 bg-red-50' : ''}
            ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}
          `}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* Chevron */}
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

export default FormSelect;
