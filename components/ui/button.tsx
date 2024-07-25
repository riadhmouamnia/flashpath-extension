import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "fp-inline-flex fp-items-center fp-justify-center fp-whitespace-nowrap fp-rounded-md fp-text-sm fp-font-medium fp-transition-colors focus-visible:fp-outline-none focus-visible:fp-ring-1 focus-visible:fp-ring-ring disabled:fp-pointer-events-none disabled:fp-opacity-50",
  {
    variants: {
      variant: {
        default:
          "fp-bg-primary fp-text-primary-foreground fp-shadow hover:fp-bg-primary/90",
        destructive:
          "fp-bg-destructive fp-text-destructive-foreground fp-shadow-sm hover:fp-bg-destructive/90",
        outline:
          "fp-border fp-border-input fp-bg-background fp-shadow-sm hover:fp-bg-accent hover:fp-text-accent-foreground",
        secondary:
          "fp-bg-secondary fp-text-secondary-foreground fp-shadow-sm hover:fp-bg-secondary/80",
        ghost: "hover:fp-bg-accent hover:fp-text-accent-foreground",
        link: "fp-text-primary fp-underline-offset-4 hover:fp-underline",
      },
      size: {
        default: "fp-h-9 fp-px-4 fp-py-2",
        sm: "fp-h-8 fp-rounded-md fp-px-3 fp-text-xs",
        lg: "fp-h-10 fp-rounded-md fp-px-8",
        icon: "fp-h-9 fp-w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
