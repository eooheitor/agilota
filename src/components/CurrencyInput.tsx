interface Props {
  value: number
  onChange: (v: number) => void
  placeholder?: string
  required?: boolean
  className?: string
  disabled?: boolean
}

export function CurrencyInput({ value, onChange, placeholder = 'R$ 0,00', required, className, disabled }: Props) {
  const display = value > 0
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    : ''

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '')
    onChange(parseInt(digits || '0') / 100)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={className}
    />
  )
}
