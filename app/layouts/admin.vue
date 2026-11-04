<!-- ==========================================================================
 FILE: app/layouts/admin.vue
 DESKRIPSI: Layout Dashboard Admin (Menggunakan /logo.png di Sidebar & Mobile)
=========================================================================== -->
<script setup lang="ts">
const { user, clear } = useUserSession()
const route = useRoute()
const isMobileMenuOpen = ref(false)

const navItems = [
  { label: 'Dashboard & Log', icon: 'i-lucide-layout-dashboard', to: '/admin' },
  { label: 'Produk, Paket & Promo', icon: 'i-lucide-package', to: '/admin/products' },
  { label: 'Input Stok (.txt)', icon: 'i-lucide-file-spreadsheet', to: '/admin/stocks' },
  { label: 'Antrean Custom Gmail', icon: 'i-lucide-mail-check', to: '/admin/custom-gmail' },
  { label: 'CRUD Invoice & History', icon: 'i-lucide-receipt-text', to: '/admin/invoices' },
  { label: 'CRUD Testimoni & Rating', icon: 'i-lucide-message-square-quote', to: '/admin/testimonials' },
  { label: 'CRUD FAQ', icon: 'i-lucide-circle-help', to: '/admin/faqs' }
]

watch(() => route.fullPath, () => {
  isMobileMenuOpen.value = false
})

async function handleLogout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  await navigateTo('/admin/login')
}
</script>

<template>
  <div class="min-h-screen flex flex-col lg:flex-row bg-default">
    <!-- SIDEBAR DESKTOP ADMIN -->
    <aside class="w-64 border-r border-default bg-elevated/50 hidden lg:flex flex-col justify-between p-4 shrink-0">
      <div class="space-y-6">
        <!-- BRAND LOGO DARI /logo.png -->
        <NuxtLink
          to="/admin"
          class="flex items-center gap-3 px-2 py-1.5 group"
        >
          <img
            src="/logo.png"
            alt="ZXRSA Store Logo"
            class="w-9 h-9 rounded-xl object-contain bg-default border border-default p-0.5 shadow-xs shrink-0"
          >
          <div class="min-w-0">
            <span class="font-extrabold text-base tracking-tight text-highlighted block truncate">
              ZXRSA Admin
            </span>
            <span class="text-[11px] text-muted block truncate">
              Control Center v4
            </span>
          </div>
        </NuxtLink>

        <nav class="space-y-1">
          <UButton
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :icon="item.icon"
            :label="item.label"
            variant="ghost"
            color="neutral"
            class="w-full justify-start font-medium"
            active-class="bg-primary/10 text-primary font-semibold"
          />
        </nav>
      </div>

      <div class="border-t border-default pt-4 space-y-3">
        <div class="px-2 text-xs text-muted truncate">
          Login sebagai: <br>
          <strong class="text-highlighted">{{ user?.email || 'Admin' }}</strong>
        </div>
        <div class="flex items-center gap-2">
          <UColorModeButton size="sm" />
          <UButton
            icon="i-lucide-log-out"
            label="Keluar"
            color="error"
            variant="subtle"
            size="sm"
            class="flex-1 justify-center"
            @click="handleLogout"
          />
        </div>
      </div>
    </aside>

    <!-- HEADER MOBILE ADMIN (RAMAH HP / TABLET) -->
    <header class="lg:hidden sticky top-0 z-40 h-16 border-b border-default bg-default/90 backdrop-blur-md px-4 flex items-center justify-between">
      <NuxtLink
        to="/admin"
        class="flex items-center gap-2.5"
      >
        <img
          src="/logo.png"
          alt="ZXRSA Store Logo"
          class="w-8 h-8 rounded-lg object-contain bg-elevated border border-default p-0.5"
        >
        <span class="font-extrabold text-sm text-highlighted">ZXRSA Admin</span>
      </NuxtLink>

      <div class="flex items-center gap-2">
        <UColorModeButton size="sm" />
        <UButton
          icon="i-lucide-menu"
          color="neutral"
          variant="outline"
          size="sm"
          aria-label="Menu Admin"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
        />
      </div>
    </header>

    <!-- DRAWER NAVIGASI MOBILE ADMIN -->
    <div
      v-if="isMobileMenuOpen"
      class="lg:hidden border-b border-default bg-elevated px-4 py-3 space-y-2"
    >
      <nav class="grid grid-cols-1 sm:grid-cols-2 gap-1">
        <UButton
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :icon="item.icon"
          :label="item.label"
          variant="ghost"
          color="neutral"
          class="w-full justify-start text-xs"
          active-class="bg-primary/10 text-primary font-bold"
        />
      </nav>
      <div class="pt-2 border-t border-default flex items-center justify-between">
        <span class="text-xs text-muted truncate">{{ user?.email || 'Admin' }}</span>
        <UButton
          icon="i-lucide-log-out"
          label="Keluar"
          color="error"
          variant="subtle"
          size="xs"
          @click="handleLogout"
        />
      </div>
    </div>

    <!-- MAIN CONTENT AREA -->
    <div class="flex-1 flex flex-col min-w-0">
      <main class="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
