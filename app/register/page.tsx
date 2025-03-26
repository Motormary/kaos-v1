"use client"

import { RegisterForm } from "@/components/auth/register-form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import z from "zod"
import { Form } from "@/components/ui/form"
import { RegisterSchema } from "@/lib/auth/schemas"

export default function RegisterPage() {
  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirm: "",
    },
  })

  async function onSubmit(data: z.infer<typeof RegisterSchema>) {
    console.log(data)
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <Form {...form}>
              <RegisterForm
                form={form}
                onSubmit={form.handleSubmit(onSubmit)}
              />
            </Form>
          </div>
        </div>
      </div>
      <picture className="bg-muted relative hidden lg:block">
        <img
          src="/placeholder.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </picture>
    </div>
  )
}
