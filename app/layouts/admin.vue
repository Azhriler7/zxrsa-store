<!-- ==========================================================================
 FILE: app/layouts/admin.vue
 DESKRIPSI: Layout Dashboard Admin dengan Kanvas Swiss Grid & Dark Mode Tajam
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
  <div class="min-h-screen flex flex-col lg:flex-row bg-[#FAFAFA] dark:bg-[#0A0A0A] text-[#111827] dark:text-[#FAFAFA]">
    <!-- SIDEBAR DESKTOP ADMIN -->
    <aside class="w-64 border-r border-[#E5E7EB] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#111111] hidden lg:flex flex-col justify-between p-5 shrink-0">
      <div class="space-y-6">
        <NuxtLink
          to="/admin"
          class="flex items-center gap-3 pb-4 border-b border-[#E5E7EB] dark:border-[#262626]"
        >
          <img
            src="/logo.png"
            alt="ZXRSA Store Logo"
            class="w-7 h-7 object-contain grayscale contrast-125 shrink-0"
          >
          <div class="min-w-0">
            <span class="font-black text-sm tracking-[-0.03em] uppercase block truncate">
              ZXRSA ADMIN
            </span>
            <span class="font-mono text-[10px] uppercase tracking-widest text-[#6B7280] dark:text-[#737373] block truncate">
              Control Center
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
            class="w-full justify-start font-medium text-xs"
            active-class="bg-[#111827] text-[#FFFFFF] dark:bg-[#FAFAFA] dark:text-[#0A0A0A] font-bold"
          />
        </nav>
      </div>

      <div class="border-t border-[#E5E7EB] dark:border-[#262626] pt-4 space-y-3">
        <div class="text-xs text-[#6B7280] dark:text-[#9CA3AF] truncate">
          Sesi Aktif:<br>
          <strong class="font-mono text-[#111827] dark:text-[#FAFAFA]">{{ user?.email || 'Admin' }}</strong>
        </div>
        <div class="flex items-center gap-2">
          <UColorModeButton size="sm" />
          <UButton
            label="Keluar"
            color="error"
            variant="subtle"
            size="sm"
            class="flex-1 justify-center font-mono text-xs uppercase"
            @click="handleLogout"
          />
        </div>
      </div>
    </aside>

    <!-- HEADER MOBILE ADMIN -->
    <header class="lg:hidden sticky top-0 z-40 h-14 border-b border-[#E5E7EB] dark:border-[#262626] bg-[#FAFAFA]/95 dark:bg-[#0A0A0A]/95 backdrop-blur-xs px-4 flex items-center justify-between">
      <NuxtLink
        to="/admin"
        class="flex items-center gap-2.5"
      >
        <img
          src="/logo.png"
          alt="ZXRSA Store Logo"
          class="w-6 h-6 object-contain grayscale contrast-125"
        >
        <span class="font-black text-sm tracking-tight uppercase">ZXRSA ADMIN</span>
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
      class="lg:hidden border-b border-[#E5E7EB] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#111111] px-4 py-3 space-y-2"
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
          active-class="bg-[#111827] text-[#FFFFFF] dark:bg-[#FAFAFA] dark:text-[#0A0A0A] font-bold"
        />
      </nav>
      <div class="pt-2 border-t border-[#E5E7EB] dark:border-[#262626] flex items-center justify-between">
        <span class="font-mono text-xs text-[#6B7280] truncate">{{ user?.email || 'Admin' }}</span>
        <UButton
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
