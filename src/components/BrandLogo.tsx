import { Link } from 'react-router-dom';

/** Brand artwork is taken from the logo provided by the project owner. */
export function BrandLogo({ compact = false, light = false, tagline = false, to = '/' }: { compact?: boolean; light?: boolean; tagline?: boolean; to?: string }) {
  return <Link to={to} className={`brand-logo${compact ? ' brand-logo-compact' : ''}${light ? ' brand-logo-light' : ''}`} aria-label="Bookanear">
    <img className="brand-logo-icon" src="/brand/icon.png" alt="" aria-hidden="true" />
    <span className="brand-logo-text">
      <img className="brand-logo-wordmark" src="/brand/wordmark.png" alt="Bookanear" />
      {tagline && <small className="brand-logo-tagline">Your next booking is near.</small>}
    </span>
  </Link>;
}
