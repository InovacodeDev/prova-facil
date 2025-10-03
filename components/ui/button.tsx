import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-label-large font-medium transition-all duration-short-3 ease-emphasized focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Default filled variant
        default: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-elevation-1 hover:shadow-elevation-2",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-elevation-1 hover:shadow-elevation-2",
        outline: "border-2 border-outline bg-surface hover:bg-surface-container-high text-on-surface",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-hover shadow-elevation-1 hover:shadow-elevation-2",
        ghost: "hover:bg-surface-container-high text-on-surface",
        link: "text-primary underline-offset-4 hover:underline",
        // MD3 specific variants
        filled: "bg-primary text-on-primary hover:bg-primary-hover shadow-elevation-1 hover:shadow-elevation-2",
        "filled-tonal": "bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 shadow-elevation-1 hover:shadow-elevation-2",
        elevated: "bg-surface-container-low text-primary shadow-elevation-1 hover:shadow-elevation-2",
        outlined: "border-2 border-outline bg-surface text-primary hover:bg-surface-container-high",
        text: "text-primary hover:bg-surface-container-high",
        // Legacy variants (kept for backward compatibility)
        hero: "bg-gradient-primary text-primary-foreground hover:shadow-primary hover:scale-105 font-semibold",
        accent: "bg-gradient-accent text-accent-foreground hover:shadow-accent hover:scale-105 font-semibold",
        success: "bg-secondary text-secondary-foreground hover:bg-secondary-hover shadow-elevation-1 hover:shadow-elevation-2",
        muted: "bg-muted text-muted-foreground hover:bg-muted-hover",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-label-medium",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
      shape: {
        default: "rounded-lg",
        pill: "rounded-full",
        square: "rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, shape, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
