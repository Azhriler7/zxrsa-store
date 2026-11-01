<!-- ==========================================================================
 FILE: app/components/storefront/StickyNavbar.vue
 DESKRIPSI: Komponen Lego Sticky Navbar dengan fitur Smooth Scroll ke Section
=========================================================================== -->
<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const navSections = [
  { label: 'Beranda', id: 'hero-section', icon: 'i-lucide-sparkles' },
  { label: 'Pilih Paket', id: 'pilih-paket', icon: 'i-lucide-shopping-bag' },
  { label: 'Testimoni', id: 'testimoni', icon: 'i-lucide-message-square-heart' },
  { label: 'FAQ', id: 'faq', icon: 'i-lucide-circle-help' },
  { label: 'Kontak', id: 'kontak', icon: 'i-lucide-headset' }
]

// Smooth scroll tanpa menghalangi judul section (diimbangi scroll-mt-20 di section)
async function scrollToSection(sectionId: string) {
  if (route.path !== '/') {
    await router.push('/')
  }
  const el = document.getElementById(sectionId)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<template>
  <header class="sticky top-0 z-40 h-16 w-full backdrop-blur-md bg-default/85 border-b border-default">
    <UContainer class="h-full flex items-center justify-between gap-4">
      <!-- LOGO BRAND -->
      <button
        type="button"
        class="flex items-center gap-2.5 text-left cursor-pointer focus:outline-none"
        @click="scrollToSection('hero-section')"
      >
        <div class="p-2 rounded-xl bg-primary text-white shadow-sm">
          <UIcon
            name="i-lucide-zap"
            class="w-5 h-5"
          />
        </div>
        <div>
          <span class="font-extrabold text-base text-highlighted tracking-tight block leading-none">
            ZXRSA STORE
          </span>
          <span class="text-[11px] text-muted">
            Instant Premium App Accounts
          </span>
        </div>
      </button>

      <!-- MENU SMOOTH SCROLL DESKTOP -->
      <nav class="hidden md:flex items-center gap-1">
        <UButton
          v-for="sec in navSections"
          :key="sec.id"
          color="neutral"
          variant="ghost"
          size="sm"
          :icon="sec.icon"
          :label="sec.label"
          @click="scrollToSection(sec.id)"
        />
      </nav>

      <!-- ACTION KANAN -->
      <div class="flex items-center gap-2">
        <UColorModeButton size="sm" />
        <UButton
          color="primary"
          size="sm"
          icon="i-lucide-shopping-cart"
          label="Beli Sekarang"
          @click="scrollToSection('pilih-paket')"
        />
      </div>
    </UContainer>
  </header>
</template>
