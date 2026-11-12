<!-- ==========================================================================
 FILE: app/pages/index.vue
 DESKRIPSI: Halaman Utama Pembeli (Urutan: Hero -> Testimoni -> Pilih Paket -> FAQ)
=========================================================================== -->
<script setup lang="ts">
const { data: catalogData } = await useFetch('/api/store/catalog')

useSeoMeta({
  title: 'ZXRSA Store — Toko Akun & Aplikasi Premium Otomatis 24 Jam',
  description: 'Beli akun aplikasi premium bergaransi dengan pengiriman instan via QRIS Dinamis otomatis 24/7.'
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-default">
    <StorefrontStickyNavbar />
    <StorefrontActiveInvoiceBanner />

    <main class="flex-1">
      <!-- 1. HERO SECTION -->
      <StorefrontHeroSection />

      <!-- 2. TESTIMONI PEMBELI (DIPINDAHKAN KE AWAL SETELAH HERO SECTION) -->
      <StorefrontTestimonySection
        :testimonials="catalogData?.testimonials || []"
      />

      <!-- 3. PILIH APLIKASI & PAKET (PRODUK BER-BADGE OTOMATIS DI URUTAN PERTAMA) -->
      <StorefrontPackageSelectorSection
        :catalog="catalogData?.catalog || []"
      />

      <!-- 4. FAQ SECTION -->
      <StorefrontFaqSection
        :faqs="catalogData?.faqs || []"
      />
    </main>

    <StorefrontFooterContact />
    <CommonFloatingWhatsApp />
  </div>
</template>
