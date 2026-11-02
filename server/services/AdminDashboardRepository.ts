// ============================================================================
// FILE: server/services/AdminDashboardRepository.ts
// DESKRIPSI: Repository OOP untuk mengambil metrik ringkasan Dashboard Admin
//            (Termasuk Penghasilan Bulan Ini) dan Audit Log terbaru.
// ============================================================================

import type { DbSystemLog } from '../types/database'
import { BaseRepository } from './BaseRepository'

export interface DashboardSummaryMetrics {
  totalRevenueLunas: number
  totalTransactionsLunas: number
  monthlyRevenueLunas: number
  monthlyTransactionsLunas: number
  totalPendingTransactions: number
  waitingCustomGmailCount: number
}

export class AdminDashboardRepository extends BaseRepository {
  public async getSummaryMetrics(): Promise<DashboardSummaryMetrics> {
    // 1. Total Pendapatan Keseluruhan
    const revenueRow = await this.db
      .prepare(
        `SELECT 
           COALESCE(SUM(total_amount), 0) as revenue,
           COUNT(id) as tx_count
         FROM transactions
         WHERE status = 'lunas'`
      )
      .first<{ revenue: number, tx_count: number }>()

    // 2. Penghasilan Bulan Ini (Berdasarkan bulan & tahun berjalan)
    const monthlyRow = await this.db
      .prepare(
        `SELECT 
           COALESCE(SUM(total_amount), 0) as revenue,
           COUNT(id) as tx_count
         FROM transactions
         WHERE status = 'lunas'
           AND strftime('%Y-%m', COALESCE(paid_at, created_at)) = strftime('%Y-%m', 'now')`
      )
      .first<{ revenue: number, tx_count: number }>()

    // 3. Transaksi Pending
    const pendingRow = await this.db
      .prepare(`SELECT COUNT(id) as count FROM transactions WHERE status = 'pending'`)
      .first<{ count: number }>()

    // 4. Antrean Custom Gmail
    const customGmailRow = await this.db
      .prepare(
        `SELECT COUNT(id) as count 
         FROM transactions 
         WHERE status = 'lunas' AND custom_gmail_status = 'waiting_admin'`
      )
      .first<{ count: number }>()

    return {
      totalRevenueLunas: Number(revenueRow?.revenue ?? 0),
      totalTransactionsLunas: Number(revenueRow?.tx_count ?? 0),
      monthlyRevenueLunas: Number(monthlyRow?.revenue ?? 0),
      monthlyTransactionsLunas: Number(monthlyRow?.tx_count ?? 0),
      totalPendingTransactions: Number(pendingRow?.count ?? 0),
      waitingCustomGmailCount: Number(customGmailRow?.count ?? 0)
    }
  }

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

    return results || []
  }
}
