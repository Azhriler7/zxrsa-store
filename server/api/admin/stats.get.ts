// ============================================================================
// FILE: server/api/admin/stats.get.ts
// DESKRIPSI: Endpoint GET Statistik Dashboard, Grafik Arus Uang, & System Logs
// ============================================================================

import { AdminDashboardRepository } from '../../services/AdminDashboardRepository'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const repo = new AdminDashboardRepository(event)

  const [stats, dailyCashflow, logs] = await Promise.all([
    repo.getSummaryStats(),
    repo.getDailyCashflowSeries(),
    repo.getRecentSystemLogs(100)
  ])

  return {
    stats,
    dailyCashflow,
    logs
  }
})
