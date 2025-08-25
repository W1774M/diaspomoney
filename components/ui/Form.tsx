import { cn } from "@/lib/utils";
import { ComponentPropsWithoutRef, forwardRef } from "react";

interface FormProps extends ComponentPropsWithoutRef<"form"> {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const Form = forwardRef<HTMLFormElement, FormProps>(
  ({ className, onSubmit, ...props }, ref) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      onSubmit(e);
    };

    return (
      <form
        ref={ref}
        onSubmit={handleSubmit}
        className={cn("space-y-6", className)}
        {...props}
      />
    );
  }
);
Form.displayName = "Form";

interface FormFieldProps extends ComponentPropsWithoutRef<"div"> {
  error?: string;
}

const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {children}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);
FormField.displayName = "FormField";

const FormLabel = forwardRef<
  HTMLLabelElement,
  ComponentPropsWithoutRef<"label">
>(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

const FormDescription = forwardRef<
  HTMLParagraphElement,
  ComponentPropsWithoutRef<"p">
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});
FormDescription.displayName = "FormDescription";

export { Form, FormDescription, FormField, FormLabel };
