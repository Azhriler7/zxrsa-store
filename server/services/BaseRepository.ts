// ============================================================================
// FILE: server/services/BaseRepository.ts
// DESKRIPSI: Abstract Base Class (OOP Inheritance) untuk koneksi Cloudflare D1
//            dan pencatatan otomatis ke tabel system_logs (Audit Trail).
// ============================================================================

import type { H3Event } from 'h3'
import type { LogLevel } from '../types/database'

// Kontrak minimal untuk objek Cloudflare D1Database agar 100% Type-Safe
export interface D1DatabaseLike {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      first: <T = unknown>(colName?: string) => Promise<T | null>
      all: <T = unknown>() => Promise<{ results: T[], success: boolean }>
      run: () => Promise<{ success: boolean, meta: Record<string, unknown> }>
    }
    first: <T = unknown>(colName?: string) => Promise<T | null>
    all: <T = unknown>() => Promise<{ results: T[], success: boolean }>
    run: () => Promise<{ success: boolean, meta: Record<string, unknown> }>
  }
}

export abstract class BaseRepository {
  protected db: D1DatabaseLike
  protected event: H3Event

  constructor(event: H3Event) {
    this.event = event
    const d1 = event.context.cloudflare?.env?.DB as D1DatabaseLike | undefined

    if (!d1) {
      throw createError({
        statusCode: 500,
        statusMessage: '[D1_BINDING_ERROR] Database Cloudflare D1 tidak ditemukan pada environment.'
      })
    }

    this.db = d1
  }

  // --------------------------------------------------------------------------
  // [SECTION: HELPER IP ADDRESS]
  // Mengambil IP asli pengunjung dari header Cloudflare untuk kebutuhan Audit Log
  // --------------------------------------------------------------------------
  protected getClientIp(): string {
    return (
      getRequestHeader(this.event, 'cf-connecting-ip')
      || getRequestHeader(this.event, 'x-forwarded-for')
      || '127.0.0.1'
    )
  }

  // --------------------------------------------------------------------------
  // [SECTION: SYSTEM AUDIT LOGGER]
  // Mencatat aktivitas krusial (Login, Webhook, Upload Stok, Error) ke D1
  // --------------------------------------------------------------------------
  public async writeSystemLog(
    level: LogLevel,
    moduleName: string,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const metaString = metadata ? JSON.stringify(metadata) : null
      const ip = this.getClientIp()

      await this.db
        .prepare(
          `INSERT INTO system_logs (level, module, message, metadata, ip_address)
           VALUES (?1, ?2, ?3, ?4, ?5)`
        )
        .bind(level, moduleName, message, metaString, ip)
        .run()
    } catch (err) {
      // Jangan gagalkan transaksi utama jika proses penulisan log gagal
      console.error('[SYSTEM_LOG_WRITE_FAILED]:', err)
    }
  }
}
