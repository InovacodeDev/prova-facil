import { useEffect } from "react";

export function usePlanAnalytics(redirect?: string | null) {
    useEffect(() => {
        (async () => {
            try {
                const token = localStorage.getItem("sb_access_token");
                await fetch("/api/analytics/plan-visit", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({ redirect }),
                });
            } catch (e) {
                // ignore analytics failures
            }
        })();
    }, [redirect]);
}

export default usePlanAnalytics;
