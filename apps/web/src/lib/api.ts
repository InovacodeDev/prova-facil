// Small helper to prefix API calls with optional base URL from Vite env.
// Behavior:
// - In development you can set API_URL to e.g. "http://localhost:8800" so the web app
//   calls the local API server directly.
// - In production leave API_URL empty (default) so the app uses relative paths ("/api/...")
//   which works with serverless platform routing (Vercel, etc.).
export const API_BASE = import.meta.env.API_URL || "";

// module-level in-memory cache for csrf token
let _cachedCsrf: string | null = null;

export async function apiFetch(path: string, init?: RequestInit) {
    // If path already starts with http or /, we handle accordingly:
    const normalized = path.startsWith("/") ? path : `/${path}`;
    const url = API_BASE ? `${API_BASE.replace(/\/$/, "")}${normalized}` : normalized;

    // small helper to read a cookie value in the browser (will return null for httpOnly cookies)
    const readCookie = (name: string) => {
        if (typeof document === "undefined") return null;
        const esc = name.replace(/([.*+?^${}()|[\]\\])/g, "\\$1");
        const re = new RegExp("(?:^|; )" + esc + "=([^;]*)");
        const m = document.cookie.match(re);
        return m ? decodeURIComponent(m[1]) : null;
    };

    // In-memory cache for csrf token retrieved from the server when sb_csrf is httpOnly
    let cachedCsrf: string | null = _cachedCsrf || null;
    let csrfFetchPromise: Promise<string | null> | null = null;

    async function getCsrfFromServer(): Promise<string | null> {
        if (cachedCsrf) return cachedCsrf;
        if (csrfFetchPromise) return csrfFetchPromise;
        csrfFetchPromise = (async () => {
            try {
                const csrfUrl = API_BASE ? `${API_BASE.replace(/\/$/, "")}/api/auth/csrf` : "/api/auth/csrf";
                const r = await fetch(csrfUrl, { credentials: "include" });
                if (!r.ok) return null;
                const data = await r.json();
                cachedCsrf = data && data.csrf ? String(data.csrf) : null;
                _cachedCsrf = cachedCsrf;
                return cachedCsrf;
            } catch (e) {
                return null;
            } finally {
                csrfFetchPromise = null;
            }
        })();
        return csrfFetchPromise;
    }

    const method = (init && init.method) || "GET";
    const safeMethod = !["POST", "PUT", "PATCH", "DELETE"].includes(String(method).toUpperCase());

    // normalize headers using the Headers API so we support Headers instances, arrays, or plain objects
    const headers = new Headers(init?.headers as HeadersInit);

    if (!safeMethod) {
        // try to read sb_csrf cookie first (will be null if httpOnly)
        let csrf = readCookie("sb_csrf");
        if (!csrf) {
            // if cookie isn't readable (httpOnly), fetch it from the server endpoint
            csrf = await getCsrfFromServer();
        }
        if (csrf) headers.set("x-csrf-token", csrf);
    }

    const baseInit: RequestInit = {
        credentials: "include",
        ...init,
        headers,
    };

    // helper to perform fetch and optionally retry once after refresh
    const doFetch = async (attemptRefresh = true): Promise<Response> => {
        const res = await fetch(url, baseInit);
        if (res.status === 401 && attemptRefresh) {
            // try to refresh session using cookie-based refresh endpoint
            try {
                const refreshRes = await fetch(
                    API_BASE ? `${API_BASE.replace(/\/$/, "")}/api/auth/refresh` : "/api/auth/refresh",
                    {
                        method: "POST",
                        credentials: "include",
                    }
                );
                if (refreshRes.ok) {
                    // rotated session/cookies on the server side - clear cached csrf so we re-fetch the new one
                    cachedCsrf = null;
                    _cachedCsrf = null;
                    // refreshed on server side (cookies updated) - retry original request once
                    return doFetch(false);
                }
            } catch (e) {
                // ignore and fallthrough to returning original 401
            }
        }
        return res;
    };

    return doFetch(true);
}

export async function apiLogout() {
    const url = API_BASE ? `${API_BASE.replace(/\/$/, "")}/api/auth/logout` : "/api/auth/logout";
    return fetch(url, { method: "POST", credentials: "include" });
}
