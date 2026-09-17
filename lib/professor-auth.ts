import { createHmac, scryptSync, randomBytes, timingSafeEqual } from 'crypto'

const secret = () => {
  const s = process.env.PROFESSOR_JWT_SECRET
  if (!s) throw new Error('PROFESSOR_JWT_SECRET não configurado')
  return s
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 32).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(':')
    const derived = scryptSync(password, salt, 32)
    return timingSafeEqual(derived, Buffer.from(hash, 'hex'))
  } catch {
    return false
  }
}

export function signProfessorToken(professorId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ id: professorId, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })
  ).toString('base64url')
  const sig = createHmac('sha256', secret()).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function verifyProfessorToken(token: string): string | null {
  try {
    const [payload, sig] = token.split('.')
    if (!payload || !sig) return null
    const expected = createHmac('sha256', secret()).update(payload).digest('base64url')
    const a = Buffer.from(sig, 'base64url')
    const b = Buffer.from(expected, 'base64url')
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
    const { id, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (Date.now() > exp) return null
    return id as string
  } catch {
    return null
  }
}
