/**
 * ROUTER — Hash-based SPA routing
 */

export class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    window.addEventListener('hashchange', () => this._resolve());
  }

  on(path, handler) {
    this.routes[path] = handler;
    return this;
  }

  navigate(path) {
    window.location.hash = path;
  }

  start() {
    this._resolve();
  }

  resolve() {
    this._resolve();
  }

  _resolve() {
    const hash = window.location.hash.slice(1) || '/login';
    // Handle parameterized routes like /player/:uid or /match/:id
    for (const [pattern, handler] of Object.entries(this.routes)) {
      const params = matchRoute(pattern, hash);
      if (params !== null) {
        this.currentRoute = hash;
        handler(params);
        return;
      }
    }
    // Default: redirect to dashboard if logged in, else login
    this.navigate('/dashboard');
  }
}

function matchRoute(pattern, hash) {
  const patternParts = pattern.split('/');
  const hashParts = hash.split('/');
  if (patternParts.length !== hashParts.length) return null;
  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = decodeURIComponent(hashParts[i]);
    } else if (patternParts[i] !== hashParts[i]) {
      return null;
    }
  }
  return params;
}
