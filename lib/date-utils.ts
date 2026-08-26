// Brazil is permanently UTC-3 (no DST since 2019)
export function toBRT(d: Date | string): Date {
  const date = typeof d === 'string' ? new Date(d) : d
  return new Date(date.getTime() - 3 * 60 * 60 * 1000)
}
