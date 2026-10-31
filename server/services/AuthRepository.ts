// ============================================================================
// FILE: server/services/AuthRepository.ts
// DESKRIPSI: Repository OOP untuk Autentikasi Admin D1 (Open-Source),
//            Anti-SQL Injection (Prepared Statements), & Anti-Brute Force Lockout.
// ============================================================================

import type { DbUser } from '../types/database'
import { BaseRepository } from './BaseRepository'
import { CryptoService } from './CryptoService'

export class AuthRepository extends BaseRepository {
  private readonly MAX_FAILED_ATTEMPTS = 5
  private readonly LOCKOUT_WINDOW_MINUTES = 15

  // Catatan: Constructor otomatis diwarisi dari BaseRepository(event)

  // --------------------------------------------------------------------------
  // [SECTION: ANTI-BRUTE FORCE & RATE LIMITER]
  // --------------------------------------------------------------------------
  public async verifyNotRateLimited(): Promise<void> {
    const clientIp = this.getClientIp()
    const windowModifier = `-${this.LOCKOUT_WINDOW_MINUTES} minutes`

    const failedRecord = await this.db
      .prepare(
        `SELECT COUNT(id) as failed_count
         FROM system_logs
         WHERE module = 'AUTH_FAILED'
           AND ip_address = ?1
           AND created_at >= datetime('now', ?2)`
      )
      .bind(clientIp, windowModifier)
      .first<{ failed_count: number }>()

    const attempts = failedRecord?.failed_count ?? 0

    if (attempts >= this.MAX_FAILED_ATTEMPTS) {
      await this.writeSystemLog(
        'security',
        'AUTH_LOCKOUT',
        `IP diblokir sementara karena gagal login ${attempts}x berturut-turut.`,
        { ip: clientIp }
      )

      throw createError({
        statusCode: 429,
        statusMessage: `Terlalu banyak percobaan login gagal. Silakan tunggu ${this.LOCKOUT_WINDOW_MINUTES} menit lagi.`
      })
    }
  }

  // --------------------------------------------------------------------------
  // [SECTION: VERIFIKASI KREDENSIAL ADMIN KE DATABASE D1]
  // --------------------------------------------------------------------------
  public async authenticateAdmin(email: string, plainPassword: string): Promise<DbUser> {
    const normalizedEmail = email.trim().toLowerCase()

    const user = await this.db
      .prepare('SELECT id, email, password_hash, role, created_at, updated_at FROM users WHERE email = ?1 LIMIT 1')
      .bind(normalizedEmail)
      .first<DbUser>()

    if (!user) {
      await this.writeSystemLog('security', 'AUTH_FAILED', 'Percobaan login gagal: Email tidak terdaftar', {
        attemptedEmail: normalizedEmail
      })
      throw createError({
        statusCode: 401,
        statusMessage: 'Email atau kata sandi salah.'
      })
    }

    const isPasswordValid = await CryptoService.verifyPassword(plainPassword, user.password_hash)

    if (!isPasswordValid) {
      await this.writeSystemLog('security', 'AUTH_FAILED', 'Percobaan login gagal: Kata sandi salah', {
        userId: user.id,
        email: user.email
      })
      throw createError({
        statusCode: 401,
        statusMessage: 'Email atau kata sandi salah.'
      })
    }

    await this.writeSystemLog('info', 'AUTH_SUCCESS', 'Admin berhasil login ke sistem', {
      userId: user.id,
      email: user.email,
      role: user.role
    })

    return user
  }
}
