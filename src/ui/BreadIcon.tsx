export function BreadIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M3 11a5 5 0 015-5h8a5 5 0 015 5v9H3z" fill="#e7b068" />
      <path d="M3 11a5 5 0 015-5h8a5 5 0 015 5v2.5H3z" fill="#c9873c" />
      <rect x="7" y="8" width="2.2" height="4" rx="1.1" fill="#f6dcaa" />
      <rect x="11" y="8" width="2.2" height="4" rx="1.1" fill="#f6dcaa" />
      <rect x="15" y="8" width="2.2" height="4" rx="1.1" fill="#f6dcaa" />
    </svg>
  );
}
