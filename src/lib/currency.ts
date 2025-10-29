/**
 * Formatea un valor numérico como moneda USD
 * @param amount - Cantidad a formatear
 * @param locale - Locale para el formato (por defecto 'es-ES')
 * @returns Valor formateado como string
 */
export function formatCurrency(amount: number, locale: string = 'es-ES'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatea un valor numérico como moneda compacta (ej: 1.2K, 1.5M)
 * @param amount - Cantidad a formatear
 * @returns Valor formateado como string
 */
export function formatCurrencyCompact(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

/**
 * Suma múltiples cantidades
 * @param amounts - Array de cantidades a sumar
 * @returns Total sumado
 */
export function sumAmounts(amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + amount, 0);
}

/**
 * Calcula el promedio de múltiples cantidades
 * @param amounts - Array de cantidades
 * @returns Promedio calculado
 */
export function averageAmount(amounts: number[]): number {
  if (amounts.length === 0) return 0;
  return sumAmounts(amounts) / amounts.length;
}

/**
 * Calcula el porcentaje de una cantidad respecto al total
 * @param amount - Cantidad individual
 * @param total - Cantidad total
 * @returns Porcentaje (0-100)
 */
export function calculatePercentage(amount: number, total: number): number {
  if (total === 0) return 0;
  return (amount / total) * 100;
}

