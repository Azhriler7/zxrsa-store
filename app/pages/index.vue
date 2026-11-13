<!-- ==========================================================================
 FILE: app/pages/index.vue
 DESKRIPSI: Kanvas Utama Webstore Bergaya Editorial Minimalis / Swiss Grid
=========================================================================== -->
<script setup lang="ts">
const { data: catalogData } = await useFetch('/api/store/catalog')

useSeoMeta({
  title: 'ZXRSA Store — Katalog Akun & Lisensi Aplikasi Digital Otomatis 24/7',
  description: 'Distribusi akun aplikasi premium bergaransi dengan pengiriman instan via QRIS Dinamis otomatis 24/7.'
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#FAFAFA] dark:bg-[#0A0A0A] text-[#111827] dark:text-[#FAFAFA] transition-colors">
    <StorefrontStickyNavbar />
    <StorefrontActiveInvoiceBanner />

    <main class="flex-1">
      <StorefrontHeroSection
        :catalog="catalogData?.catalog || []"
      />

      <StorefrontTestimonySection
        :testimonials="catalogData?.testimonials || []"
      />

      <StorefrontPackageSelectorSection
        :catalog="catalogData?.catalog || []"
      />

      <StorefrontFaqSection
        :faqs="catalogData?.faqs || []"
      />
    </main>

    <StorefrontFooterContact />
    <CommonFloatingWhatsApp />
  </div>
</template>
