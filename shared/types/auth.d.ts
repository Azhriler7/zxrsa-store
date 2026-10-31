// ============================================================================
// FILE: shared/types/auth.d.ts
// DESKRIPSI: Augmentasi Tipe Data Session Admin (Terbaca di App & Server Nuxt 4)
// ============================================================================

declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    role: 'admin' | 'staff'
  }

  interface UserSession {
    loggedInAt?: string
  }
}

export { }
