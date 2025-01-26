import * as React from "react";
import { cn } from "@/app/front/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md",
          "border border-primary-muted/20",
          "bg-primary-muted/5",
          "px-3 py-2 text-sm",
          "placeholder:text-primary-muted",
          "focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input }; 