import * as React from "react"
import { cn } from "./utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2",
        {
          'border-transparent bg-cyan-500 text-white hover:bg-cyan-600': variant === 'default',
          'border-transparent bg-slate-800 text-slate-200 hover:bg-slate-700': variant === 'secondary',
          'border-transparent bg-red-600 text-white hover:bg-red-700': variant === 'destructive',
          'text-slate-300 border-slate-800': variant === 'outline',
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
