import { Field, type FieldRootProps } from '@chakra-ui/react'

type FormFieldProps = FieldRootProps & {
  label: string
  htmlFor?: string
  error?: string
  helpText?: string
  children: React.ReactNode
}

export function FormField({
  label,
  htmlFor,
  error,
  helpText,
  children,
  ...props
}: FormFieldProps) {
  return (
    <Field.Root invalid={!!error} {...props}>
      <Field.Label htmlFor={htmlFor}>{label}</Field.Label>
      {children}
      {error ? <Field.ErrorText>{error}</Field.ErrorText> : null}
      {helpText ? <Field.HelperText>{helpText}</Field.HelperText> : null}
    </Field.Root>
  )
}
