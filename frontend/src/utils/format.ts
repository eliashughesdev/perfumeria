export const formatMoney = (value: number): string => {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
  }).format(value)
}

export const formatMoneySimple = (value: number): string => {
  return `$${value.toFixed(2)}`
}

export const formatDate = (iso: string): string => {
  return new Date(iso).toLocaleDateString('es-DO')
}

export const formatDateTime = (iso: string): string => {
  return new Date(iso).toLocaleString('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const padLeft = (num: number, size: number): string => {
  return String(num).padStart(size, '0')
}
