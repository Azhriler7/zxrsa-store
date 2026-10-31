// ============================================================================
// FILE: server/api/auth/login.post.ts
// DESKRIPSI: Endpoint POST Login Admin (Open-Source Session + Anti-Brute Force)
// ============================================================================

import { z } from 'zod'
import { AuthRepository } from '../../services/AuthRepository'

// Validasi ketat Zod untuk menolak karakter berbahaya/payload berlebih di awal
const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .max(120, 'Email terlalu panjang')
    .email('Format alamat email tidak valid'),
  password: z
    .string()
    .min(6, 'Kata sandi minimal 6 karakter')
    .max(128, 'Kata sandi terlalu panjang')
})

export default defineEventHandler(async (event) => {
  const authRepo = new AuthRepository(event)

  // 1. Cek Rate Limit / Anti-Brute Force terlebih dahulu sebelum memproses apapun
  await authRepo.verifyNotRateLimited()

  // 2. Validasi body request menggunakan Zod
  const body = await readValidatedBody(event, result => loginSchema.safeParse(result))
  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: body.error.issues[0]?.message || 'Format input login tidak valid.'
    })
  }

  // 3. Autentikasi ke Cloudflare D1 (menggunakan Prepared Statement Anti-SQLi)
  const adminUser = await authRepo.authenticateAdmin(body.data.email, body.data.password)

  // 4. Set Encrypted HttpOnly Session Cookie menggunakan nuxt-auth-utils
  await setUserSession(event, {
    user: {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role
    },
    loggedInAt: new Date().toISOString()
  })

  return {
    success: true,
    user: {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role
    }
  }
})
