<!-- ==========================================================================
 FILE: app/components/storefront/StickyNavbar.vue
 DESKRIPSI: Header Sticky Ramping Bergaya Swiss Grid dengan Garis Bawah 1px
=========================================================================== -->
<script setup lang="ts">
const { activeInvoice } = useActiveInvoiceSession()
const isMobileNavOpen = ref(false)
</script>

<template>
  <header class="sticky top-0 z-50 w-full bg-[#FAFAFA]/95 dark:bg-[#0A0A0A]/95 backdrop-blur-xs border-b border-[#E5E7EB] dark:border-[#262626] transition-colors">
    <div class="max-w-7xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between gap-6">
      <!-- IDENTITAS BRAND EDITORIAL -->
      <NuxtLink
        to="/"
        class="flex items-center gap-3 group focus:outline-none"
      >
        <img
          src="/logo.png"
          alt="ZXRSA"
          class="w-6 h-6 object-contain grayscale contrast-125"
        >
        <div class="flex items-baseline gap-2">
          <span class="text-sm font-black tracking-[-0.04em] uppercase text-[#111827] dark:text-[#FAFAFA]">
            ZXRSA
          </span>
          <span class="text-[10px] font-mono uppercase tracking-[0.2em] text-[#6B7280] dark:text-[#737373] hidden sm:inline">
            Digital Archive
          </span>
        </div>
      </NuxtLink>

      <!-- NAVIGASI TENGAH MINIMALIS -->
      <nav class="hidden md:flex items-center gap-8 text-xs font-medium tracking-tight text-[#4B5563] dark:text-[#A3A3A3]">
        <a
          href="#pilih-paket"
          class="hover:text-[#111827] dark:hover:text-[#FAFAFA] transition-colors uppercase tracking-[0.08em]"
        >
          01 / Katalog
        </a>
        <a
          href="#testimoni"
          class="hover:text-[#111827] dark:hover:text-[#FAFAFA] transition-colors uppercase tracking-[0.08em]"
        >
          02 / Ulasan
        </a>
        <a
          href="#faq"
          class="hover:text-[#111827] dark:hover:text-[#FAFAFA] transition-colors uppercase tracking-[0.08em]"
        >
          03 / Ketentuan
        </a>
      </nav>

      <!-- AKSI KANAN & TOGGLE DARK MODE -->
      <div class="flex items-center gap-3">
        <NuxtLink
          v-if="activeInvoice"
          :to="`/invoice/${activeInvoice.invoiceToken}`"
          class="hidden sm:inline-block px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider border border-[#111827] dark:border-[#FAFAFA] text-[#111827] dark:text-[#FAFAFA] hover:bg-[#111827] hover:text-[#FFFFFF] dark:hover:bg-[#FAFAFA] dark:hover:text-[#0A0A0A] transition-colors"
        >
          Invoice ({{ activeInvoice.invoiceId }})
        </NuxtLink>

        <UColorModeButton
          size="sm"
          variant="ghost"
          color="neutral"
        />

        <a
          href="#pilih-paket"
          class="hidden sm:inline-block px-4 py-1.5 text-xs font-semibold tracking-tight bg-[#111827] text-[#FFFFFF] dark:bg-[#FAFAFA] dark:text-[#0A0A0A] hover:opacity-85 transition-opacity"
        >
          Pesan Sekarang
        </a>

        <button
          type="button"
          class="md:hidden px-2.5 py-1 text-xs font-mono uppercase tracking-wider border border-[#E5E7EB] dark:border-[#262626] text-[#111827] dark:text-[#FAFAFA]"
          aria-label="Toggle Menu"
          @click="isMobileNavOpen = !isMobileNavOpen"
        >
          {{ isMobileNavOpen ? 'Tutup' : 'Menu' }}
        </button>
      </div>
    </div>

    <!-- MENU MOBILE SWISS GRID -->
    <div
      v-if="isMobileNavOpen"
      class="md:hidden border-t border-[#E5E7EB] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#111111] px-4 py-4 space-y-3"
    >
      <nav class="flex flex-col divide-y divide-[#E5E7EB] dark:divide-[#262626] text-xs font-mono uppercase tracking-wider">
        <a
          href="#pilih-paket"
          class="py-2.5 text-[#111827] dark:text-[#FAFAFA]"
          @click="isMobileNavOpen = false"
        >
          01 / Katalog Produk
        </a>
        <a
          href="#testimoni"
          class="py-2.5 text-[#111827] dark:text-[#FAFAFA]"
          @click="isMobileNavOpen = false"
        >
          02 / Ulasan Pembeli
        </a>
        <a
          href="#faq"
          class="py-2.5 text-[#111827] dark:text-[#FAFAFA]"
          @click="isMobileNavOpen = false"
        >
          03 / Pertanyaan Umum
        </a>
      </nav>
    </div>
  </header>
</template>
