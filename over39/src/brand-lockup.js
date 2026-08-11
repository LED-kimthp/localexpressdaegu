export function ledWordmark({ className = "led-wordmark", decorative = false } = {}) {
  const accessibility = decorative ? 'aria-hidden="true" focusable="false"' : 'role="img" aria-label="Local Express Daegu"';
  return `<svg class="${className}" viewBox="0 0 174 64" ${accessibility}>
    <g aria-hidden="true" transform="translate(4 4)" fill="#8b8c87">
      <path d="M4 7h12v38h27v11H4z"/><path d="M57 7h43v11H69v8h25v10H69v9h32v11H57z"/><path fill-rule="evenodd" d="M115 7h24c20 0 31 9 31 24.5S159 56 139 56h-24zm12 11v27h12c12 0 19-4 19-13.5S151 18 139 18z"/>
    </g>
    <g aria-hidden="true" fill="#171816">
      <path d="M4 7h12v38h27v11H4z"/><path d="M57 7h43v11H69v8h25v10H69v9h32v11H57z"/><path fill-rule="evenodd" d="M115 7h24c20 0 31 9 31 24.5S159 56 139 56h-24zm12 11v27h12c12 0 19-4 19-13.5S151 18 139 18z"/>
    </g>
  </svg>`;
}

export function mohoHouseMark({ className = "moho-house-mark" } = {}) {
  return `<picture class="${className}" aria-hidden="true"><source srcset="./moho-house-logo-vector.svg" type="image/svg+xml"/><img src="./moho-house-logo-transparent.png" alt="" width="580" height="239"/></picture>`;
}
