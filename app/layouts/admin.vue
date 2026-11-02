<!-- ==========================================================================
 FILE: app/layouts/admin.vue
 DESKRIPSI: Layout Utama Panel Admin dengan Sidebar Menu & ConfirmDialog Logout
=========================================================================== -->
<script setup lang="ts">
const { user, clear: clearSession } = useUserSession()
const toast = useToast()
const route = useRoute()

const isLogoutDialogOpen = ref(false)
const isLoggingOut = ref(false)

// Daftar Navigasi Menu Admin sesuai spesifikasi alur bisnis
const navItems = [
  { label: 'Dashboard & Log', icon: 'i-lucide-layout-dashboard', to: '/admin' },
  { label: 'Produk, Paket & Promo', icon: 'i-lucide-package', to: '/admin/products' },
  { label: 'Input Stok (.txt)', icon: 'i-lucide-file-spreadsheet', to: '/admin/stocks' },
  { label: 'Antrean Custom Gmail', icon: 'i-lucide-mail-check', to: '/admin/custom-gmail' },
  { label: 'CRUD Invoice & History', icon: 'i-lucide-receipt-text', to: '/admin/invoices' },
  { label: 'CRUD Testimoni & Rating', icon: 'i-lucide-message-square-quote', to: '/admin/testimonials' },
  { label: 'CRUD FAQ', icon: 'i-lucide-circle-help', to: '/admin/faqs' }
]

// ----------------------------------------------------------------------------
// [SECTION: HANDLER LOGOUT DENGAN DIALOG KONFIRMASI]
// ----------------------------------------------------------------------------
async function confirmLogout() {
  isLoggingOut.value = true
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await clearSession()
    isLogoutDialogOpen.value = false

    toast.add({
      title: 'Sesi Diakhiri',
      description: 'Anda telah keluar dari Panel Admin dengan aman.',
      color: 'neutral',
      icon: 'i-lucide-log-out'
    })

    await navigateTo('/admin/login')
  } finally {
    isLoggingOut.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col lg:flex-row bg-default">
    <!-- SIDEBAR NAVIGASI ADMIN -->
    <aside class="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-default bg-elevated/40 shrink-0 flex flex-col justify-between">
      <div class="p-4 space-y-6">
        <!-- Brand Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-lg bg-primary text-white">
              <UIcon
                name="i-lucide-shield-check"
                class="w-5 h-5"
              />
            </div>
            <div>
              <span class="font-bold text-base text-highlighted block leading-none">
                ZXRSA Admin
              </span>
              <span class="text-xs text-muted">
                Premium App Store
              </span>
            </div>
          </div>
          <UColorModeButton size="sm" />
        </div>

        <!-- Menu Links -->
        <nav class="space-y-1">
          <UButton
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :icon="item.icon"
            :label="item.label"
            :color="route.path === item.to ? 'primary' : 'neutral'"
            :variant="route.path === item.to ? 'subtle' : 'ghost'"
            block
            class="justify-start"
          />
        </nav>
      </div>

      <!-- Footer Profil Admin & Tombol Logout -->
      <div class="p-4 border-t border-default space-y-3">
        <div class="text-xs">
          <p class="text-muted">
            Login sebagai:
          </p>
          <p class="font-semibold text-highlighted truncate">
            {{ user?.email || 'Administrator' }}
          </p>
        </div>

        <UButton
          color="error"
          variant="subtle"
          icon="i-lucide-log-out"
          label="Keluar Panel"
          block
          size="sm"
          @click="isLogoutDialogOpen = true"
        />
      </div>
    </aside>

    <!-- KONTEN UTAMA HALAMAN ADMIN -->
    <main class="flex-1 p-6 lg:p-8 overflow-y-auto">
      <slot />
    </main>

    <!-- KOMPONEN LEGO: DIALOG KONFIRMASI LOGOUT -->
    <CommonConfirmDialog
      v-model:open="isLogoutDialogOpen"
      title="Konfirmasi Keluar"
      description="Apakah Anda yakin ingin mengakhiri sesi administrator saat ini?"
      confirm-label="Ya, Keluar"
      confirm-color="error"
      :loading="isLoggingOut"
      @confirm="confirmLogout"
    />
  </div>
</template>
