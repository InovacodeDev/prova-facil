import { cva } from "class-variance-authority";

export const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm hover:shadow-md",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md",
                // outline: default outlined look, but transition to primary filled on hover
                outline:
                    "border border-border bg-background text-foreground transition-colors duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary",
                secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-hover shadow-sm hover:shadow-md",
                ghost: "hover:bg-muted-hover text-foreground",
                link: "text-primary underline-offset-4 hover:underline",
                hero: "bg-gradient-primary text-primary-foreground hover:shadow-primary hover:scale-105 font-semibold",
                accent: "bg-gradient-accent text-accent-foreground hover:shadow-accent hover:scale-105 font-semibold",
                success: "bg-secondary text-secondary-foreground hover:bg-secondary-hover shadow-sm hover:shadow-md",
                muted: "bg-muted text-muted-foreground hover:bg-muted-hover",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export default buttonVariants;
