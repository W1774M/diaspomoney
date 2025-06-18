import { zodResolver } from "@hookform/resolvers/zod";
import { UseFormProps, useForm as useHookForm } from "react-hook-form";
import { z } from "zod";

export function useForm<T extends z.AnyZodObject>({
  schema,
  ...props
}: UseFormProps<z.infer<T>> & { schema: T }) {
  return useHookForm<z.infer<T>>({
    resolver: zodResolver(schema),
    ...props,
  });
}
