// ============================================================================
// FILE: server/api/admin/stats.get.ts
// DESKRIPSI: Endpoint GET Statistik Dashboard & Log Sistem (Khusus Admin)
// ============================================================================

import { AdminDashboardRepository } from '../../services/AdminDashboardRepository'

export default defineEventHandler(async (event) => {
  // Pastikan hanya Admin yang memiliki sesi valid yang bisa mengakses API ini
  await requireUserSession(event)

  const repo = new AdminDashboardRepository(event)
  const [metrics, recentLogs] = await Promise.all([
    repo.getSummaryMetrics(),
    repo.getRecentLogs(20)
  ])

  return {
    metrics,
    recentLogs
  }
})
