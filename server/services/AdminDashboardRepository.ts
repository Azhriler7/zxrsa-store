// ============================================================================
// FILE: server/services/AdminDashboardRepository.ts
// DESKRIPSI: Repository OOP untuk mengambil metrik ringkasan Dashboard Admin
//            dan daftar Audit Log terbaru dari Cloudflare D1.
// ============================================================================

import type { DbSystemLog } from '../types/database'
import { BaseRepository } from './BaseRepository'

export interface DashboardSummaryMetrics {
  totalRevenueLunas: number
  totalTransactionsLunas: number
  totalPendingTransactions: number
  availableStocksCount: number
  waitingCustomGmailCount: number
}

export class AdminDashboardRepository extends BaseRepository {
  // --------------------------------------------------------------------------
  // [SECTION: GET SUMMARY METRICS]
  // Mengambil statistik utama toko dalam 1 rangkaian query cepat
  // --------------------------------------------------------------------------
  public async getSummaryMetrics(): Promise<DashboardSummaryMetrics> {
    const revenueRow = await this.db
      .prepare(
        `SELECT 
           COALESCE(SUM(total_amount), 0) as revenue,
           COUNT(id) as tx_count
         FROM transactions
         WHERE status = 'lunas'`
      )
      .first<{ revenue: number, tx_count: number }>()

    const pendingRow = await this.db
      .prepare(`SELECT COUNT(id) as count FROM transactions WHERE status = 'pending'`)
      .first<{ count: number }>()

    const stockRow = await this.db
      .prepare(`SELECT COUNT(id) as count FROM account_stocks WHERE status = 'available'`)
      .first<{ count: number }>()

    const customGmailRow = await this.db
      .prepare(
        `SELECT COUNT(id) as count 
         FROM transactions 
         WHERE status = 'lunas' AND custom_gmail_status = 'waiting_admin'`
      )
      .first<{ count: number }>()

    return {
      totalRevenueLunas: revenueRow?.revenue ?? 0,
      totalTransactionsLunas: revenueRow?.tx_count ?? 0,
      totalPendingTransactions: pendingRow?.count ?? 0,
      availableStocksCount: stockRow?.count ?? 0,
      waitingCustomGmailCount: customGmailRow?.count ?? 0
    }
  }

  // --------------------------------------------------------------------------
  // [SECTION: GET RECENT SYSTEM LOGS]
  // Mengambil daftar log keamanan & aktivitas sistem terbaru
  // --------------------------------------------------------------------------
  public async getRecentLogs(limit = 20): Promise<DbSystemLog[]> {
    const { results } = await this.db
      .prepare(
        `SELECT id, level, module, message, metadata, ip_address, created_at
         FROM system_logs
         ORDER BY id DESC
         LIMIT ?1`
      )
      .bind(limit)
      .all<DbSystemLog>()

    return results
  }
}
