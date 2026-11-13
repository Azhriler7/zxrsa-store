// ============================================================================
// FILE: server/services/AdminDashboardRepository.ts
// DESKRIPSI: Repository OOP Statistik Dashboard Admin, Arus Uang (Cashflow)
//            Harian/Mingguan/Bulanan/Tahunan/Lifetime, & Audit Log.
// ============================================================================

import type { DbSystemLog } from '../types/database'
import { BaseRepository } from './BaseRepository'

export interface DailyCashflowPoint {
  date: string // Format: YYYY-MM-DD (WIB)
  revenue: number
  txCount: number
}

export interface DashboardSummaryStats {
  totalRevenue: number
  lifetimeRevenue: number
  lifetimePaidCount: number
  todayRevenue: number
  thisMonthRevenue: number
  paidTransactionsCount: number
  pendingTransactionsCount: number
  waitingCustomGmailCount: number
  availableStocksCount: number
}

export class AdminDashboardRepository extends BaseRepository {
  public async getSummaryStats(): Promise<DashboardSummaryStats> {
    // Waktu saat ini dalam WIB (UTC+7)
    const nowWib = new Date(Date.now() + 7 * 60 * 60 * 1000)
    const todayYmd = nowWib.toISOString().slice(0, 10)
    const currentYm = todayYmd.slice(0, 7)

    const txSummary = await this.db
      .prepare(
        `SELECT
           COALESCE(SUM(CASE WHEN status = 'lunas' THEN total_amount ELSE 0 END), 0) as lifetime_revenue,
           SUM(CASE WHEN status = 'lunas' THEN 1 ELSE 0 END) as paid_count,
           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
           SUM(CASE WHEN status = 'lunas' AND custom_gmail_status = 'waiting_admin' THEN 1 ELSE 0 END) as waiting_gmail_count,
           COALESCE(SUM(CASE WHEN status = 'lunas' AND date(COALESCE(paid_at, created_at), '+7 hours') = ?1 THEN total_amount ELSE 0 END), 0) as today_revenue,
           COALESCE(SUM(CASE WHEN status = 'lunas' AND strftime('%Y-%m', COALESCE(paid_at, created_at), '+7 hours') = ?2 THEN total_amount ELSE 0 END), 0) as month_revenue
         FROM transactions`
      )
      .bind(todayYmd, currentYm)
      .first<{
      lifetime_revenue: number
      paid_count: number
      pending_count: number
      waiting_gmail_count: number
      today_revenue: number
      month_revenue: number
    }>()

    const stockSummary = await this.db
      .prepare(`SELECT COUNT(id) as ready_stock FROM account_stocks WHERE status = 'available'`)
      .first<{ ready_stock: number }>()

    const lifetimeRev = Number(txSummary?.lifetime_revenue ?? 0)
    const paidCnt = Number(txSummary?.paid_count ?? 0)

    return {
      totalRevenue: lifetimeRev,
      lifetimeRevenue: lifetimeRev,
      lifetimePaidCount: paidCnt,
      todayRevenue: Number(txSummary?.today_revenue ?? 0),
      thisMonthRevenue: Number(txSummary?.month_revenue ?? 0),
      paidTransactionsCount: paidCnt,
      pendingTransactionsCount: Number(txSummary?.pending_count ?? 0),
      waitingCustomGmailCount: Number(txSummary?.waiting_gmail_count ?? 0),
      availableStocksCount: Number(stockSummary?.ready_stock ?? 0)
    }
  }

  // --------------------------------------------------------------------------
  // [SECTION: GET DAILY CASHFLOW SERIES (WIB TIMEZONE)]
  // Mengambil agregasi uang masuk per tanggal kalender (YYYY-MM-DD)
  // --------------------------------------------------------------------------
  public async getDailyCashflowSeries(): Promise<DailyCashflowPoint[]> {
    const { results } = await this.db
      .prepare(
        `SELECT
           date(COALESCE(paid_at, created_at), '+7 hours') as tx_date,
           COALESCE(SUM(total_amount), 0) as revenue,
           COUNT(id) as tx_count
         FROM transactions
         WHERE status = 'lunas'
         GROUP BY tx_date
         ORDER BY tx_date ASC`
      )
      .all<{
      tx_date: string | null
      revenue: number
      tx_count: number
    }>()

    return (results || [])
      .filter(r => Boolean(r.tx_date))
      .map(r => ({
        date: String(r.tx_date),
        revenue: Number(r.revenue || 0),
        txCount: Number(r.tx_count || 0)
      }))
  }

  public async getRecentSystemLogs(limit = 100): Promise<DbSystemLog[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM system_logs ORDER BY id DESC LIMIT ?1')
      .bind(limit)
      .all<DbSystemLog>()

    return results || []
  }
}
