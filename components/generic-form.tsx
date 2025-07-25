"use client"

import { UseFormReturn } from "react-hook-form"
import { z } from "zod"
import { Form } from "@/components/ui/form"

type ZodObjectOrEffects = z.ZodObject<any, any, any> | z.ZodEffects<z.ZodObject<any, any, any>>;

export function GenericForm<T extends ZodObjectOrEffects>(
  props: {
    schema: T;
    onSubmit: (values: z.infer<T>) => void;
    children: React.ReactNode;
    formId?: string;
    form: UseFormReturn<z.infer<T>>;
    className?: string;
  }
) {
  return (
    <Form {...props.form}>
      <form onSubmit={props.form.handleSubmit(props.onSubmit)} className={props.className} id={props.formId}>
        {props.children}
      </form>
    </Form>
  )
}
