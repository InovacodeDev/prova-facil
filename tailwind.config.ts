import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
    darkMode: ["class"],
    content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            fontFamily: {
                sans: ["Inter", "ui-sans-serif", "system-ui"],
            },
            // MD3 Typography Scale
            fontSize: {
                // Display - Large, high-emphasis text
                "display-large": ["3.5625rem", { lineHeight: "4rem", fontWeight: "400", letterSpacing: "-0.015625rem" }], // 57px
                "display-medium": ["2.8125rem", { lineHeight: "3.25rem", fontWeight: "400", letterSpacing: "0" }], // 45px
                "display-small": ["2.25rem", { lineHeight: "2.75rem", fontWeight: "400", letterSpacing: "0" }], // 36px
                // Headline - Medium-emphasis text
                "headline-large": ["2rem", { lineHeight: "2.5rem", fontWeight: "400", letterSpacing: "0" }], // 32px
                "headline-medium": ["1.75rem", { lineHeight: "2.25rem", fontWeight: "400", letterSpacing: "0" }], // 28px
                "headline-small": ["1.5rem", { lineHeight: "2rem", fontWeight: "400", letterSpacing: "0" }], // 24px
                // Title - Medium-emphasis, shorter text
                "title-large": ["1.375rem", { lineHeight: "1.75rem", fontWeight: "500", letterSpacing: "0" }], // 22px
                "title-medium": ["1rem", { lineHeight: "1.5rem", fontWeight: "500", letterSpacing: "0.009375rem" }], // 16px
                "title-small": ["0.875rem", { lineHeight: "1.25rem", fontWeight: "500", letterSpacing: "0.00625rem" }], // 14px
                // Label - Buttons, tabs, etc.
                "label-large": ["0.875rem", { lineHeight: "1.25rem", fontWeight: "500", letterSpacing: "0.00625rem" }], // 14px
                "label-medium": ["0.75rem", { lineHeight: "1rem", fontWeight: "500", letterSpacing: "0.03125rem" }], // 12px
                "label-small": ["0.6875rem", { lineHeight: "1rem", fontWeight: "500", letterSpacing: "0.03125rem" }], // 11px
                // Body - Main content text
                "body-large": ["1rem", { lineHeight: "1.5rem", fontWeight: "400", letterSpacing: "0.009375rem" }], // 16px
                "body-medium": ["0.875rem", { lineHeight: "1.25rem", fontWeight: "400", letterSpacing: "0.015625rem" }], // 14px
                "body-small": ["0.75rem", { lineHeight: "1rem", fontWeight: "400", letterSpacing: "0.025rem" }], // 12px
            },
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                
                // MD3 Surface System
                surface: {
                    DEFAULT: "hsl(var(--surface))",
                    dim: "hsl(var(--surface-dim))",
                    bright: "hsl(var(--surface-bright))",
                    "container-lowest": "hsl(var(--surface-container-lowest))",
                    "container-low": "hsl(var(--surface-container-low))",
                    container: "hsl(var(--surface-container))",
                    "container-high": "hsl(var(--surface-container-high))",
                    "container-highest": "hsl(var(--surface-container-highest))",
                },
                "on-surface": "hsl(var(--on-surface))",
                "on-surface-variant": "hsl(var(--on-surface-variant))",
                
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    hover: "hsl(var(--primary-hover))",
                    foreground: "hsl(var(--primary-foreground))",
                    muted: "hsl(var(--primary-muted))",
                    container: "hsl(var(--primary-container))",
                },
                "on-primary": "hsl(var(--on-primary))",
                "on-primary-container": "hsl(var(--on-primary-container))",
                
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    hover: "hsl(var(--secondary-hover))",
                    foreground: "hsl(var(--secondary-foreground))",
                    muted: "hsl(var(--secondary-muted))",
                    container: "hsl(var(--secondary-container))",
                },
                "on-secondary": "hsl(var(--on-secondary))",
                "on-secondary-container": "hsl(var(--on-secondary-container))",
                
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    hover: "hsl(var(--muted-hover))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    hover: "hsl(var(--accent-hover))",
                    foreground: "hsl(var(--accent-foreground))",
                    muted: "hsl(var(--accent-muted))",
                    container: "hsl(var(--accent-container))",
                },
                "on-accent": "hsl(var(--on-accent))",
                "on-accent-container": "hsl(var(--on-accent-container))",
                
                tertiary: {
                    DEFAULT: "hsl(var(--tertiary))",
                    hover: "hsl(var(--tertiary-hover))",
                    container: "hsl(var(--tertiary-container))",
                },
                "on-tertiary": "hsl(var(--on-tertiary))",
                "on-tertiary-container": "hsl(var(--on-tertiary-container))",
                
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                
                card: {
                    DEFAULT: "hsl(var(--card))",
                    hover: "hsl(var(--card-hover))",
                    foreground: "hsl(var(--card-foreground))",
                },
                
                sidebar: {
                    DEFAULT: "hsl(var(--sidebar-background))",
                    foreground: "hsl(var(--sidebar-foreground))",
                    primary: "hsl(var(--sidebar-primary))",
                    "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
                    accent: "hsl(var(--sidebar-accent))",
                    "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
                    border: "hsl(var(--sidebar-border))",
                    ring: "hsl(var(--sidebar-ring))",
                },
                
                // MD3 Error Colors
                error: {
                    DEFAULT: "hsl(var(--error))",
                    container: "hsl(var(--error-container))",
                },
                "on-error": "hsl(var(--on-error))",
                "on-error-container": "hsl(var(--on-error-container))",
                
                warning: {
                    DEFAULT: "hsl(var(--warning))",
                    foreground: "hsl(var(--warning-foreground))",
                },
                
                success: {
                    DEFAULT: "hsl(var(--success))",
                    foreground: "hsl(var(--success-foreground))",
                },
                
                // MD3 Outline
                outline: "hsl(var(--outline))",
                "outline-variant": "hsl(var(--outline-variant))",
            },
            backgroundImage: {
                "gradient-primary": "var(--gradient-primary)",
                "gradient-secondary": "var(--gradient-secondary)",
                "gradient-accent": "var(--gradient-accent)",
                "gradient-hero": "var(--gradient-hero)",
            },
            boxShadow: {
                // MD3 Elevation System
                none: "var(--elevation-0)",
                "elevation-0": "var(--elevation-0)",
                "elevation-1": "var(--elevation-1)",
                "elevation-2": "var(--elevation-2)",
                "elevation-3": "var(--elevation-3)",
                "elevation-4": "var(--elevation-4)",
                "elevation-5": "var(--elevation-5)",
                // Legacy shadow system (kept for backward compatibility)
                sm: "var(--shadow-sm)",
                md: "var(--shadow-md)",
                lg: "var(--shadow-lg)",
                xl: "var(--shadow-xl)",
                primary: "var(--shadow-primary)",
                accent: "var(--shadow-accent)",
            },
            transitionDuration: {
                // Legacy durations (kept for backward compatibility)
                fast: "var(--transition-fast)",
                smooth: "var(--transition-smooth)",
                slow: "var(--transition-slow)",
                // MD3 Motion System - Durations
                "short-1": "var(--duration-short-1)",
                "short-2": "var(--duration-short-2)",
                "short-3": "var(--duration-short-3)",
                "short-4": "var(--duration-short-4)",
                "medium-1": "var(--duration-medium-1)",
                "medium-2": "var(--duration-medium-2)",
                "medium-3": "var(--duration-medium-3)",
                "medium-4": "var(--duration-medium-4)",
                "long-1": "var(--duration-long-1)",
                "long-2": "var(--duration-long-2)",
                "long-3": "var(--duration-long-3)",
                "long-4": "var(--duration-long-4)",
            },
            transitionTimingFunction: {
                // MD3 Motion System - Easing Curves
                "standard": "var(--easing-standard)",
                "emphasized": "var(--easing-emphasized)",
                "emphasized-decelerate": "var(--easing-emphasized-decelerate)",
                "emphasized-accelerate": "var(--easing-emphasized-accelerate)",
            },
            borderRadius: {
                // MD3 Shape System
                none: "var(--radius-none)",
                xs: "var(--radius-xs)",
                sm: "var(--radius-sm)",
                DEFAULT: "var(--radius)",
                md: "var(--radius-md)",
                lg: "var(--radius-lg)",
                xl: "var(--radius-xl)",
                "2xl": "var(--radius-2xl)",
                full: "var(--radius-full)",
                // Legacy calculated values for backward compatibility
                "legacy-calc-sm": "calc(var(--radius) - 2px)",
                "legacy-calc-md": "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: {
                        height: "0",
                    },
                    to: {
                        height: "var(--radix-accordion-content-height)",
                    },
                },
                "accordion-up": {
                    from: {
                        height: "var(--radix-accordion-content-height)",
                    },
                    to: {
                        height: "0",
                    },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
        },
    },
    plugins: [tailwindcssAnimate],
} satisfies Config;
