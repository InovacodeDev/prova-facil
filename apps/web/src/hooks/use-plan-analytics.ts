import { useEffect } from "react";

export function usePlanAnalytics(redirect?: string | null) {
    useEffect(() => {
        (async () => {
            try {
                await fetch("/api/analytics/plan-visit", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ redirect }),
                });
            } catch (e) {
                // ignore analytics failures
            }
        })();
    }, [redirect]);
}

export default usePlanAnalytics;
