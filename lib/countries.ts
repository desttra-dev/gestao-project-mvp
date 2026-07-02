export interface CountryDef {
  code: string
  name: string
  flag: string
  currency: string
  currencySymbol: string
  dialCode: string
  region: 'BR' | 'EU' | 'INTL'
}

export const COUNTRIES: CountryDef[] = [
  // Brasil
  { code: 'BR', name: 'Brasil',          flag: '🇧🇷', currency: 'BRL', currencySymbol: 'R$',  dialCode: '+55',  region: 'BR' },
  // Eurozona
  { code: 'PT', name: 'Portugal',        flag: '🇵🇹', currency: 'EUR', currencySymbol: '€',   dialCode: '+351', region: 'EU' },
  { code: 'DE', name: 'Alemanha',        flag: '🇩🇪', currency: 'EUR', currencySymbol: '€',   dialCode: '+49',  region: 'EU' },
  { code: 'FR', name: 'França',          flag: '🇫🇷', currency: 'EUR', currencySymbol: '€',   dialCode: '+33',  region: 'EU' },
  { code: 'ES', name: 'Espanha',         flag: '🇪🇸', currency: 'EUR', currencySymbol: '€',   dialCode: '+34',  region: 'EU' },
  { code: 'IT', name: 'Itália',          flag: '🇮🇹', currency: 'EUR', currencySymbol: '€',   dialCode: '+39',  region: 'EU' },
  { code: 'NL', name: 'Países Baixos',   flag: '🇳🇱', currency: 'EUR', currencySymbol: '€',   dialCode: '+31',  region: 'EU' },
  { code: 'BE', name: 'Bélgica',         flag: '🇧🇪', currency: 'EUR', currencySymbol: '€',   dialCode: '+32',  region: 'EU' },
  { code: 'AT', name: 'Áustria',         flag: '🇦🇹', currency: 'EUR', currencySymbol: '€',   dialCode: '+43',  region: 'EU' },
  { code: 'IE', name: 'Irlanda',         flag: '🇮🇪', currency: 'EUR', currencySymbol: '€',   dialCode: '+353', region: 'EU' },
  { code: 'FI', name: 'Finlândia',       flag: '🇫🇮', currency: 'EUR', currencySymbol: '€',   dialCode: '+358', region: 'EU' },
  { code: 'LU', name: 'Luxemburgo',      flag: '🇱🇺', currency: 'EUR', currencySymbol: '€',   dialCode: '+352', region: 'EU' },
  { code: 'GR', name: 'Grécia',          flag: '🇬🇷', currency: 'EUR', currencySymbol: '€',   dialCode: '+30',  region: 'EU' },
  // Europa não-euro
  { code: 'GB', name: 'Reino Unido',     flag: '🇬🇧', currency: 'GBP', currencySymbol: '£',   dialCode: '+44',  region: 'EU' },
  { code: 'CH', name: 'Suíça',           flag: '🇨🇭', currency: 'CHF', currencySymbol: 'Fr',  dialCode: '+41',  region: 'EU' },
  { code: 'SE', name: 'Suécia',          flag: '🇸🇪', currency: 'SEK', currencySymbol: 'kr',  dialCode: '+46',  region: 'EU' },
  { code: 'NO', name: 'Noruega',         flag: '🇳🇴', currency: 'NOK', currencySymbol: 'kr',  dialCode: '+47',  region: 'EU' },
  { code: 'DK', name: 'Dinamarca',       flag: '🇩🇰', currency: 'DKK', currencySymbol: 'kr',  dialCode: '+45',  region: 'EU' },
  // América do Norte
  { code: 'US', name: 'Estados Unidos',  flag: '🇺🇸', currency: 'USD', currencySymbol: '$',   dialCode: '+1',   region: 'INTL' },
  { code: 'CA', name: 'Canadá',          flag: '🇨🇦', currency: 'CAD', currencySymbol: 'C$',  dialCode: '+1',   region: 'INTL' },
]

export const countryByCode: Record<string, CountryDef> = Object.fromEntries(
  COUNTRIES.map(c => [c.code, c])
)

// Área codes canadenses para distinguir de EUA (ambos usam +1)
const CANADA_AREA_CODES = new Set([
  204, 226, 236, 249, 250, 289, 306, 343, 365, 387, 403, 416, 418,
  431, 437, 438, 450, 506, 514, 519, 548, 579, 581, 587, 604, 613,
  639, 647, 672, 705, 709, 742, 778, 780, 782, 807, 819, 825, 867,
  873, 902, 905,
])

export function detectCountryFromPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  const withPlus = phone.trim().startsWith('+') ? phone.trim() : null

  // Verifica DDIs mais longos primeiro (evita conflito +351 vs +35)
  const checks: [string, string][] = [
    ['+55',  'BR'], ['+351', 'PT'], ['+49',  'DE'], ['+33',  'FR'],
    ['+34',  'ES'], ['+39',  'IT'], ['+31',  'NL'], ['+32',  'BE'],
    ['+43',  'AT'], ['+353', 'IE'], ['+358', 'FI'], ['+352', 'LU'],
    ['+30',  'GR'], ['+44',  'GB'], ['+41',  'CH'], ['+46',  'SE'],
    ['+47',  'NO'], ['+45',  'DK'],
  ]

  if (withPlus) {
    for (const [ddi, code] of checks) {
      if (withPlus.startsWith(ddi)) return code
    }
    // +1 → USA ou Canadá pelo area code
    if (withPlus.startsWith('+1')) {
      const rest = withPlus.slice(2).replace(/\D/g, '')
      const area = parseInt(rest.slice(0, 3), 10)
      return CANADA_AREA_CODES.has(area) ? 'CA' : 'US'
    }
  }

  // Sem +, tenta pelo DDD brasileiro (11 dígitos = celular BR)
  if (digits.startsWith('55') && digits.length >= 12) return 'BR'
  if (digits.length === 11 || digits.length === 10) return 'BR' // DDD + número local

  return null
}

export function formatAmount(amount: number, currency: string): string {
  const country = COUNTRIES.find(c => c.currency === currency)
  const symbol = country?.currencySymbol ?? currency
  return `${symbol} ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}
