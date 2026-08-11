export function ledWordmark({ className = "led-wordmark" } = {}) {
  return `<svg class="${className}" viewBox="0 0 174 64" role="img" aria-label="Local Express Daegu">
    <g aria-hidden="true" transform="translate(4 4)" fill="#8b8c87">
      <path d="M4 7h12v38h27v11H4z"/><path d="M57 7h43v11H69v8h25v10H69v9h32v11H57z"/><path fill-rule="evenodd" d="M115 7h24c20 0 31 9 31 24.5S159 56 139 56h-24zm12 11v27h12c12 0 19-4 19-13.5S151 18 139 18z"/>
    </g>
    <g aria-hidden="true" fill="#171816">
      <path d="M4 7h12v38h27v11H4z"/><path d="M57 7h43v11H69v8h25v10H69v9h32v11H57z"/><path fill-rule="evenodd" d="M115 7h24c20 0 31 9 31 24.5S159 56 139 56h-24zm12 11v27h12c12 0 19-4 19-13.5S151 18 139 18z"/>
    </g>
  </svg>`;
}

export function productionBrandLockup({ compact = false } = {}) {
  return `<div class="production-brand-lockup ${compact ? "is-compact" : ""}" aria-label="프로젝트 협력 기관">
    <div class="production-brand-item led-brand-item">${ledWordmark()}<span>Local Express Daegu</span></div>
    <span class="production-brand-divider" aria-hidden="true">×</span>
    <div class="production-brand-item moho-brand-item"><picture><source srcset="./moho-house-logo-vector.svg" type="image/svg+xml"/><img src="./moho-house-logo-transparent.png" alt="모호주택" width="580" height="239"/></picture><span>모호주택</span></div>
  </div>`;
}
