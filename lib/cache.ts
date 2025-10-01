/**
 * Utility functions for managing application cache
 */

const CACHE_KEY = "dashboard_stats_cache";

/**
 * Invalidate the dashboard statistics cache
 * Call this after creating new questions to refresh the dashboard data
 */
export const invalidateDashboardCache = () => {
    if (typeof window !== "undefined") {
        localStorage.removeItem(CACHE_KEY);
    }
};

/**
 * Get cached dashboard data
 */
export const getDashboardCache = () => {
    if (typeof window === "undefined") return null;

    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        return JSON.parse(cached);
    } catch (error) {
        console.error("Error reading cache:", error);
        return null;
    }
};

/**
 * Set dashboard cache data
 */
export const setDashboardCache = (data: any) => {
    if (typeof window === "undefined") return;

    try {
        localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
                data,
                timestamp: Date.now(),
            })
        );
    } catch (error) {
        console.error("Error writing cache:", error);
    }
};
