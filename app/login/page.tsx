"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { LoginForm } from "@/components/auth/login-form"
import { Form } from "@/components/ui/form"
import { LoginSchema } from "@/lib/auth/schemas"
import z from "zod"
import { login } from "../actions/auth"

export default function LoginPage() {
  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: z.infer<typeof LoginSchema>) {
    console.log(data)
    await login(data)
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <Form {...form}>
              <LoginForm onSubmit={form.handleSubmit(onSubmit)} form={form} />
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
