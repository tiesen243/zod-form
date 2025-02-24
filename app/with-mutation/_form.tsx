'use client'

import * as React from 'react'
import { Label } from '@radix-ui/react-label'
import { Slot } from '@radix-ui/react-slot'

import { cn } from '@/lib/utils'

type Fn = (...args: never[]) => Promise<void> | void

interface FormContextValue<T extends Record<string, unknown>> {
  data: T
  setData: (data: T) => void
  errors?: Record<keyof T, string[] | undefined>
  isPending?: boolean
}

const FormContext = React.createContext<FormContextValue<Record<string, unknown>>>(
  {} as FormContextValue<Record<string, unknown>>,
)

interface FormProps<T extends Fn> extends Omit<React.ComponentProps<'form'>, 'onSubmit'> {
  defaultValues: Parameters<T>[0]
  onSubmit?: T
  errors?: Record<keyof T, string[] | undefined>
  isPending?: boolean
  isReset?: boolean
  asChild?: boolean
}

function Form<T extends Fn>({
  defaultValues,
  onSubmit,
  errors,
  isPending,
  isReset = false,
  asChild = false,
  className,
  ...props
}: FormProps<T>) {
  const [data, setFormData] = React.useState<Parameters<T>[0]>(defaultValues)

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      if (!onSubmit) return
      event.preventDefault()
      await onSubmit(data)
      if (isReset) setFormData(defaultValues)
    },
    [onSubmit, data, isReset, defaultValues],
  )

  const Comp = asChild ? Slot : 'form'

  return (
    <FormContext.Provider
      value={{
        data,
        setData: React.useCallback((data: Record<string, unknown>) => {
          setFormData((prev) => ({ ...(prev as object), ...data }) as never)
        }, []),
        errors,
        isPending,
      }}
    >
      <Comp
        data-slot="form"
        className={cn('grid gap-4', className)}
        onSubmit={handleSubmit}
        {...props}
      />
    </FormContext.Provider>
  )
}

interface FormFieldContextValue {
  name: string
  type?: React.ComponentProps<'input'>['type']
  value?: unknown
  setValue?: (data: unknown) => void
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
    ...fieldContext,
    id,
    name: fieldContext.name,
    error: form.errors?.[fieldContext.name],
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
  }
}

interface FormFieldProps<
  T extends Fn,
  K extends keyof Parameters<T>[0] = keyof Parameters<T>[0],
> {
  name: K
  type?: React.ComponentProps<'input'>['type']
  render: (field: {
    value: Parameters<T>[0][K]
    onChange: (event: React.ChangeEvent<HTMLInputElement> | string) => void
  }) => React.ReactNode
}

function FormField<T extends Fn>({ name, type = 'text', render }: FormFieldProps<T>) {
  const { data, setData } = React.use(FormContext)

  return (
    <FormFieldContext.Provider value={{ name: String(name), type }}>
      {render({
        value: data[name as keyof typeof data] as never,
        onChange: React.useCallback(
          (event: React.ChangeEvent<HTMLInputElement> | string) => {
            const value = typeof event === 'string' ? event : event.currentTarget.value
            setData({
              [name]:
                type === 'number'
                  ? Number.isNaN(parseInt(value, 10))
                    ? 0
                    : parseInt(value, 10)
                  : value,
            })
          },
          [name, type, setData],
        ),
      })}
    </FormFieldContext.Provider>
  )
}

interface FormItemContextValue {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
)

function FormItem({ className, ...props }: React.ComponentProps<'fieldset'>) {
  const id = React.useId()
  const { isPending } = React.use(FormContext)

  return (
    <FormItemContext.Provider value={{ id }}>
      <fieldset
        data-slot="form-item"
        className={cn('grid gap-2', className)}
        disabled={isPending}
        {...props}
      />
    </FormItemContext.Provider>
  )
}

function FormLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  const { error, formItemId } = useFormField()

  return (
    <Label
      data-slot="form-label"
      htmlFor={formItemId}
      className={cn(
        'text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        error && 'text-destructive',
        className,
      )}
      {...props}
    />
  )
}

function FormControl({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'input'> & { asChild?: boolean }) {
  const { name, type, error, formItemId, formDescriptionId, formMessageId } =
    useFormField()
  const Comp = asChild ? Slot : 'input'

  return (
    <Comp
      data-slot="form-control"
      id={formItemId}
      name={name}
      type={type}
      aria-describedby={
        !error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      className={cn(
        asChild
          ? ''
          : 'border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground aria-invalid:outline-destructive/60 aria-invalid:ring-destructive/20 dark:aria-invalid:outline-destructive dark:aria-invalid:ring-destructive/50 ring-ring/10 dark:ring-ring/20 dark:outline-ring/40 outline-ring/50 aria-invalid:outline-destructive/60 dark:aria-invalid:outline-destructive dark:aria-invalid:ring-destructive/40 aria-invalid:ring-destructive/20 aria-invalid:border-destructive/60 dark:aria-invalid:border-destructive flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-4 focus-visible:outline-1 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:focus-visible:ring-[3px] aria-invalid:focus-visible:outline-none md:text-sm dark:aria-invalid:focus-visible:ring-4',
        className,
      )}
      {...props}
    />
  )
}

function FormDescription({ className, ...props }: React.ComponentProps<'span'>) {
  const { formDescriptionId } = useFormField()

  return (
    <span
      data-slot="form-description"
      id={formDescriptionId}
      className={cn('text-muted-foreground text-xs', className)}
      {...props}
    />
  )
}

function FormMessage({ className, children, ...props }: React.ComponentProps<'p'>) {
  const { error, formMessageId } = useFormField()

  const body = error ? String(error) : children
  if (!body) return null

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn('text-destructive text-xs font-medium', className)}
      {...props}
    >
      {body}
    </p>
  )
}

export { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage }
