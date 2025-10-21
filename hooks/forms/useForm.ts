import { zodResolver } from "@hookform/resolvers/zod";
import { FieldValues, UseFormProps, useForm as useHookForm } from "react-hook-form";
import { ZodType, ZodTypeAny } from "zod";

export function useForm<TSchema extends ZodTypeAny>({
  schema,
  ...props
}: UseFormProps<FieldValues> & { schema: TSchema }) {
  const form = useHookForm<FieldValues>({
    resolver: zodResolver(schema as ZodType<FieldValues, any, any>),
    ...props,
  });
  
  return form;
}
