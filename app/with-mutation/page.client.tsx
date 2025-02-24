'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './_form'

const schema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.enum(['anime', 'manga']),
  price: z.number().min(5),
})

type Schema = z.infer<typeof schema>

export const CreatePostForm: React.FC = () => {
  const { mutate, isPending, error } = useMutation({
    mutationFn: async (data: Schema) => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      schema.parse(data)
      toast.success('Post created!', {
        description: <pre>{JSON.stringify(data, null, 2)}</pre>,
      })
    },
  })

  return (
    <Form<typeof mutate>
      defaultValues={{
        title: '',
        content: '',
        category: '' as Schema['category'],
        price: 0,
      }}
      onSubmit={mutate}
      errors={
        error instanceof z.ZodError
          ? (error.flatten().fieldErrors as Record<keyof Schema, string[] | undefined>)
          : undefined
      }
      isPending={isPending}
    >
      <FormField<typeof mutate>
        name="title"
        render={(field) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl {...field} placeholder="Enter title" />
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField<typeof mutate>
        name="content"
        render={(field) => (
          <FormItem>
            <FormLabel>Content</FormLabel>
            <FormControl {...field} placeholder="Enter content" />
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField<typeof mutate>
        name="category"
        render={(field) => (
          <FormItem>
            <FormLabel>Category</FormLabel>
            <Select value={String(field.value)} onValueChange={field.onChange}>
              <FormControl asChild>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
              </FormControl>

              <SelectContent>
                <SelectItem value="anime">Anime</SelectItem>
                <SelectItem value="manga">Manga</SelectItem>
              </SelectContent>
            </Select>

            <FormMessage />
          </FormItem>
        )}
      />

      <FormField<typeof mutate>
        name="price"
        type="number"
        render={(field) => (
          <FormItem>
            <FormLabel>Price</FormLabel>
            <FormControl {...field} placeholder="Enter price" />
            <FormMessage />
          </FormItem>
        )}
      />

      <Button disabled={isPending}>Create</Button>
    </Form>
  )
}
