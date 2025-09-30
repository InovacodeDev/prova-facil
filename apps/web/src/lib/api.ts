// Small helper to prefix API calls with optional base URL from Vite env.
// Behavior:
// - In development you can set API_URL to e.g. "http://localhost:8800" so the web app
//   calls the local API server directly.
// - In production leave API_URL empty (default) so the app uses relative paths ("/api/...")
//   which works with serverless platform routing (Vercel, etc.).
export const API_BASE = import.meta.env.API_URL || "";

export async function apiFetch(path: string, init?: RequestInit) {
    // If path already starts with http or /, we handle accordingly:
    const normalized = path.startsWith("/") ? path : `/${path}`;
    const url = API_BASE ? `${API_BASE.replace(/\/$/, "")}${normalized}` : normalized;
    return fetch(url, init);
}
