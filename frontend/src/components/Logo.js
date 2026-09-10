import React from 'react';

/**
 * Reusable app logo.
 * Uses /logo.svg (copied from the provided "chat logo design").
 * Falls back to /logo.gif, then to the scissors icon if files are missing.
 */
function Logo({ size = 38, radius = 10, className = '', style = {} }) {
  const [src, setSrc] = React.useState('/logo.svg?v=2');

  if (src === null) {
    return (
      <div
        className={`app-logo-fallback ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: size * 0.42,
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
          ...style,
        }}
      >
        <i className="fas fa-cut"></i>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="MyBeezNus Billing logo"
      width={size}
      height={size}
      className={`app-logo ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        objectFit: 'cover',
        flexShrink: 0,
        background: '#fff',
        ...style,
      }}
      onError={() => setSrc((prev) => (prev === '/logo.svg' ? '/logo.gif' : null))}
    />
  );
}

export default Logo;
