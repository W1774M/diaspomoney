import { zodResolver } from "@hookform/resolvers/zod";
import { UseFormProps, useForm as useHookForm } from "react-hook-form";
import { z, ZodTypeAny } from "zod";

export function useForm<TSchema extends ZodTypeAny>({
  schema,
  ...props
}: UseFormProps<z.infer<TSchema>> & { schema: TSchema }) {
  return useHookForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    ...props,
  });
}
