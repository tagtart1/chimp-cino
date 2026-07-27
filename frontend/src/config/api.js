const PROD_FRONTEND_HOSTS = ["chimpcino.com", "www.chimpcino.com"];
const PROD_API_BASE = "https://api.chimpcino.com";
const DEV_API_BASE = "http://localhost:3011";

export function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    if (PROD_FRONTEND_HOSTS.includes(window.location.hostname)) {
      return PROD_API_BASE;
    }
  }
  return DEV_API_BASE;
}

export function apiUrl(path) {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}/api/v1${suffix}`;
}
