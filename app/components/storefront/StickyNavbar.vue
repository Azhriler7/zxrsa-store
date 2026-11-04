<!-- ==========================================================================
 FILE: app/components/storefront/StickyNavbar.vue
 DESKRIPSI: Sticky Navbar Modern SaaS dengan Logo /logo.png & Menu Mobile
=========================================================================== -->
<script setup lang="ts">
const isMobileNavOpen = ref(false)

const navLinks = [
  { label: 'Beranda', href: '#beranda' },
  { label: 'Katalog & Paket', href: '#pilih-paket' },
  { label: 'Testimoni', href: '#testimoni' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Kontak', href: '#kontak' }
]
</script>

<template>
  <header class="sticky top-0 z-40 w-full backdrop-blur-xl bg-default/80 border-b border-default/80 transition-colors">
    <UContainer class="h-16 flex items-center justify-between gap-4">
      <!-- BRAND LOGO DARI /logo.png -->
      <a
        href="#beranda"
        class="flex items-center gap-3 group focus:outline-none"
      >
        <img
          src="/logo.png"
          alt="ZXRSA Store"
          class="w-9 h-9 rounded-xl object-contain bg-elevated border border-default p-0.5 shadow-xs group-hover:scale-105 transition-transform"
        >
        <div class="flex flex-col">
          <span class="font-extrabold text-base tracking-tight text-highlighted leading-none">
            ZXRSA<span class="text-primary">.STORE</span>
          </span>
          <span class="text-[10px] font-medium text-muted tracking-wider uppercase mt-0.5">
            Automated Digital SaaS
          </span>
        </div>
      </a>

      <!-- DESKTOP NAVIGATION LINKS -->
      <nav class="hidden md:flex items-center gap-1 rounded-full border border-default bg-elevated/60 px-2 py-1">
        <a
          v-for="item in navLinks"
          :key="item.href"
          :href="item.href"
          class="px-3.5 py-1.5 rounded-full text-xs font-semibold text-muted hover:text-highlighted hover:bg-default transition-all"
        >
          {{ item.label }}
        </a>
      </nav>

      <!-- ACTION BUTTONS (DESKTOP & MOBILE) -->
      <div class="flex items-center gap-2">
        <UColorModeButton size="sm" />

        <UButton
          href="#pilih-paket"
          color="primary"
          size="sm"
          icon="i-lucide-zap"
          label="Beli Instan"
          class="hidden sm:inline-flex font-semibold rounded-lg shadow-xs"
        />

        <!-- TOMBOL HAMBURGER KHUSUS LAYAR HP -->
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          :icon="isMobileNavOpen ? 'i-lucide-x' : 'i-lucide-menu'"
          class="md:hidden"
          aria-label="Toggle Menu"
          @click="isMobileNavOpen = !isMobileNavOpen"
        />
      </div>
    </UContainer>

    <!-- DROPDOWN MENU MOBILE (RESPONSIF UNTUK LAYAR HP) -->
    <div
      v-if="isMobileNavOpen"
      class="md:hidden border-t border-default bg-default/95 backdrop-blur-xl px-4 py-4 space-y-3"
    >
      <nav class="flex flex-col space-y-1">
        <a
          v-for="item in navLinks"
          :key="item.href"
          :href="item.href"
          class="px-3 py-2.5 rounded-lg text-sm font-semibold text-highlighted hover:bg-elevated transition-colors"
          @click="isMobileNavOpen = false"
        >
          {{ item.label }}
        </a>
      </nav>
      <UButton
        href="#pilih-paket"
        color="primary"
        block
        size="md"
        icon="i-lucide-zap"
        label="Pilih Paket Sekarang"
        @click="isMobileNavOpen = false"
      />
    </div>
  </header>
</template>
