// ============================================================================
// FILE: app/middleware/01.domain-guard.global.ts
// DESKRIPSI: Global Middleware untuk mengisolasi subdomain admin.domain.com
//            dan domain.com (Pembeli).
// ============================================================================

export default defineNuxtRouteMiddleware((to) => {
  const config = useRuntimeConfig()
  const adminDomain = config.public.adminDomain.toLowerCase()

  // Ambil hostname baik saat Server-Side Rendering (SSR) maupun Client-Side
  const headers = import.meta.server ? useRequestHeaders(['host', 'x-forwarded-host']) : {}
  const currentHost = import.meta.server
    ? (headers['x-forwarded-host'] || headers.host || '').toLowerCase()
    : window.location.host.toLowerCase()

  const isSubdomainAdmin = currentHost === adminDomain || currentHost.startsWith('admin.')
  const isAccessingAdminPath = to.path.startsWith('/admin')

  // KASUS 1: Pengunjung di domain pembeli (domain.com) mencoba membuka /admin/*
  if (!isSubdomainAdmin && isAccessingAdminPath) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Halaman yang Anda cari tidak ditemukan.',
      fatal: true
    })
  }

  // KASUS 2: Admin membuka admin.domain.com/ (tanpa prefix /admin)
  if (isSubdomainAdmin && !isAccessingAdminPath) {
    return navigateTo('/admin', { replace: true })
  }
})
