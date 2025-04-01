import { createCollab } from "@/app/actions/collab/post"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "../ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form"
import { Input } from "../ui/input"

export const NewCollabSchema = z.object({
  title: z
    .string()
    .min(2, { message: "Collab title must be minimum 2 characters." }),
})

export default function NewCollabForm({
  className,
  setOpen,
}: React.ComponentProps<"form"> & {
  setOpen: (state: boolean) => void
}) {
  const form = useForm<z.infer<typeof NewCollabSchema>>({
    resolver: zodResolver(NewCollabSchema),
    defaultValues: {
      title: "",
    },
  })

  const {
    formState: { isSubmitting },
  } = form

  const throwErrorToast = () =>
    toast.error("Error", {
      description: "Something went wrong, try again or contact support.",
    })

  async function onSubmit(formData: z.infer<typeof NewCollabSchema>) {
    const { success, error } = await createCollab(formData)

    if (!success) {
      console.error("Error creating new collab", error)
      throwErrorToast()
    } else {
      toast.success("Success", {
        description: "New collab created",
      })
      setOpen(false)
    }
  }
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("grid items-start gap-4", className)}
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="My new collab" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button disabled={isSubmitting} type="submit">
          Submit
        </Button>
      </form>
    </Form>
  )
}
