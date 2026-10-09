import * as React from "react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "gold" | "secondary" | "outline" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "relative inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer select-none rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4bd55] focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100"

    const sizeStyles = {
      sm: "text-xs h-9 px-3.5 gap-1.5 min-h-[36px]",
      md: "text-sm h-11 px-5 gap-2 min-h-[44px]", // WCAG 2.1 AA 44px min touch target
      lg: "text-base h-13 px-7 gap-2.5 min-h-[50px]",
    }[size]

    const variantStyles = {
      primary:
        "bg-[#0b1528] text-white hover:bg-[#12233a] shadow-sm hover:shadow-md active:bg-[#0c2236]",
      gold: "bg-[#e4bd55] text-[#07111f] hover:bg-[#9b7428] shadow-sm hover:shadow-[#e4bd55]/20 hover:shadow-lg font-semibold active:bg-[#b89422]",
      secondary:
        "bg-[#F1F5F9] text-[#0b1528] hover:bg-[#E2E8F0] active:bg-[#CBD5E1]",
      outline:
        "border border-[#0b1528]/15 text-[#0b1528] bg-white/70 backdrop-blur-sm hover:bg-white hover:border-[#0b1528]/30 active:bg-slate-50",
      ghost:
        "text-[#475569] hover:text-[#0b1528] hover:bg-slate-100/80 active:bg-slate-200/70",
      danger:
        "bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-sm hover:shadow-red-500/20 active:bg-[#B91C1C]",
    }[variant]

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && (
          <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!loading && rightIcon && (
          <span className="inline-flex shrink-0">{rightIcon}</span>
        )}
      </button>
    )
  },
)

Button.displayName = "Button"
