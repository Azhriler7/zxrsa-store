// ============================================================================
// FILE: server/api/auth/logout.post.ts
// DESKRIPSI: Endpoint POST Logout Admin & Pencatatan Audit Log
// ============================================================================

import { BaseRepository } from '../../services/BaseRepository'

class LogoutLogger extends BaseRepository {}

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (session?.user) {
    const logger = new LogoutLogger(event)
    await logger.writeSystemLog('info', 'AUTH', 'Admin logout dari sistem', {
      userId: session.user.id,
      email: session.user.email
    })
  }

  await clearUserSession(event)

  return {
    success: true,
    message: 'Sesi berhasil diakhiri.'
  }
})
