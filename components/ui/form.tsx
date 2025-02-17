import * as React from 'react'
import { Label } from '@radix-ui/react-label'
import { Slot } from '@radix-ui/react-slot'
import * as z from 'zod'

import { cn } from '@/lib/utils'
import { Input } from './input'

const useForm = <TSchema extends z.ZodSchema>({
  schema,
  defaultValues,
  onSubmit,
  onError,
}: {
  defaultValues: z.infer<TSchema>
  schema: TSchema
  onSubmit: (data: z.infer<TSchema>) => Promise<void> | void
  onError?: (error: Error) => void
}) => {
  type Schema = z.infer<typeof schema>

  const [isPending, startTransition] = React.useTransition()
  const [formData, setFormData] = React.useState<Schema>(defaultValues)
  const [errors, setErrors] = React.useState<
    ReturnType<z.ZodError<Schema>['flatten']>['fieldErrors']
  >({})

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      startTransition(async () => {
        event.preventDefault()
        try {
          const parsedData = schema.parse(formData) as Schema
          await onSubmit(parsedData)
        } catch (error) {
          if (error instanceof z.ZodError) {
            setErrors(error.flatten().fieldErrors)
            return
          }
          if (error instanceof Error && onError) {
            onError(error)
            return
          }
        }
      })
    },
    [formData, schema, onSubmit, onError],
  )

  const setValue = React.useCallback(
    <T extends keyof Schema>(name: T, value: Schema[T]) => {
      setFormData((prev) => ({ ...prev, [name]: value }))
    },
    [],
  )

  return {
    handleSubmit,
    isPending,
    formData,
    setValue,
    errors,
  }
}

type FormContextValue<TSchema extends z.ZodType> = ReturnType<typeof useForm<TSchema>>

const FormContext = React.createContext<FormContextValue<z.ZodSchema>>(
  {} as FormContextValue<z.ZodSchema>,
)

interface FormProps<TSchema extends z.ZodSchema> extends React.ComponentProps<'form'> {
  form: FormContextValue<TSchema>
}

function Form<TSchema extends z.ZodSchema>({
  form,
  className,
  ...props
}: FormProps<TSchema>) {
  return (
    <FormContext.Provider value={form}>
      <form
        {...props}
        className={cn('grid gap-4', className)}
        onSubmit={form.handleSubmit}
      />
    </FormContext.Provider>
  )
}

interface FormFieldContextValue {
  id?: string
  name: string
  error?: string
  formItemId?: string
  formDescriptionId?: string
  formMessageId?: string
  render?: () => React.ReactNode
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
)

const useFormField = () => {
  const fieldContext = React.use(FormFieldContext)
  const itemContext = React.use(FormItemContext)
  const form = React.use(FormContext)

  if (!fieldContext.name)
    throw new Error('useFormField should be used within <FormField>')

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    value: (form.formData as Record<string, unknown>)[fieldContext.name],
    setValue: (value: (typeof form.formData)[keyof typeof form.formData]) => {
      form.setValue(fieldContext.name as keyof typeof form.formData, value)
    },
    error: form.errors[fieldContext.name as keyof typeof form.errors],
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
  }
}

function FormField({ name, render }: FormFieldContextValue) {
  if (!render)
    throw new Error('FormField requires a render prop to display field content')

  return (
    <FormFieldContext.Provider value={{ name }}>{render()}</FormFieldContext.Provider>
  )
}

interface FormItemContextValue {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
)

function FormItem({ className, ...props }: React.ComponentProps<'fieldset'>) {
  const { isPending } = React.use(FormContext)
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <fieldset
        {...props}
        data-slot="form-item"
        className={cn('space-y-2', className)}
        disabled={isPending}
      />
    </FormItemContext.Provider>
  )
}

function FormLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  const { error, formItemId } = useFormField()

  return (
    <Label
      {...props}
      data-slot="form-label"
      htmlFor={formItemId}
      className={cn(
        'text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        error && 'text-destructive',
        className,
      )}
    />
  )
}

function FormControl({
  asChild,
  ...props
}: React.ComponentProps<'input'> & { asChild?: boolean }) {
  const { name, error, value, setValue, formItemId, formDescriptionId, formMessageId } =
    useFormField()
  const Comp = asChild ? Slot : Input

  return (
    <Comp
      {...props}
      data-slot="form-control"
      id={formItemId}
      name={name}
      value={String(value)}
      onChange={(event) => {
        setValue(event.currentTarget.value)
      }}
      aria-describedby={
        !error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
    />
  )
}

function FormDescription({ className, ...props }: React.ComponentProps<'span'>) {
  const { formDescriptionId } = useFormField()

  return (
    <span
      {...props}
      data-slot="form-description"
      id={formDescriptionId}
      className={cn('text-muted-foreground text-xs', className)}
    />
  )
}

function FormMessage({ className, children, ...props }: React.ComponentProps<'p'>) {
  const { error, formMessageId } = useFormField()

  const body = error ? String(error) : children
  if (!body) return null

  return (
    <p
      {...props}
      data-slot="form-message"
      id={formMessageId}
      className={cn('text-destructive text-xs font-medium', className)}
    >
      {body}
    </p>
  )
}

export {
  useForm,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
}
