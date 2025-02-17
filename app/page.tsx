'use client'

import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from '@/components/ui/form'

export default function Home() {
  const form = useForm({
    defaultValues: { title: '', content: '' },
    schema: z.object({
      title: z.string().min(1),
      content: z.string().min(1),
    }),
    onSubmit: (data) => {
      if (data.title.toLowerCase().trim() === 'hello') throw new Error('Title is invalid')
      toast.success(JSON.stringify(data, null, 2))
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return (
    <main className="py-4">
      <Form form={form} className="mx-auto max-w-md">
        <FormField
          name="title"
          render={() => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="content"
          render={() => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl />
              <FormMessage />
            </FormItem>
          )}
        />

        <Button disabled={form.isPending}>Create</Button>
      </Form>
    </main>
  )
}
