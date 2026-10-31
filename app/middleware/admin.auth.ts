// ============================================================================
// FILE: app/middleware/admin-auth.ts
// DESKRIPSI: Route Middleware untuk memastikan Admin sudah Login sebelum
//            mengakses halaman Dashboard & CRUD.
// ============================================================================

export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  if (!loggedIn.value && to.path !== '/admin/login') {
    return navigateTo('/admin/login')
  }

  if (loggedIn.value && to.path === '/admin/login') {
    return navigateTo('/admin')
  }
})
