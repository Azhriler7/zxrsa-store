<!-- ==========================================================================
 FILE: app/pages/index.vue
 DESKRIPSI: Halaman Utama Pembeli (Merakit seluruh komponen Lego Storefront)
=========================================================================== -->
<script setup lang="ts">
useSeoMeta({
  title: 'ZXRSA Store — Jual Akun Aplikasi Premium Otomatis 24 Jam',
  description: 'Beli akun Alight Motion Pro, Wink VIP, dan CapCut Pro resmi bergaransi dengan pembayaran QRIS Dinamis instan.'
})

const { data } = await useFetch('/api/store/catalog')
</script>

<template>
  <div class="min-h-screen flex flex-col bg-default">
    <!-- LEGO 1: STICKY NAVBAR SMOOTH SCROLL -->
    <StorefrontStickyNavbar />

    <!-- LEGO 2: HERO SECTION -->
    <main class="flex-1">
      <StorefrontHeroSection />

      <!-- LEGO 3: PILIH PAKET + FORM GMAIL + TOMBOL BAYAR -->
      <StorefrontPackageSelectorSection :catalog="data?.catalog || []" />

      <!-- LEGO 4: TESTIMONY SECTION -->
      <StorefrontTestimonySection />

      <!-- LEGO 5: FAQ SECTION -->
      <StorefrontFaqSection />
    </main>

    <!-- LEGO 6: KONTAK & FOOTER DIGABUNG -->
    <StorefrontFooterContact />

    <!-- LEGO 7: FLOATING WHATSAPP BUTTON (FAB) -->
    <CommonFloatingWhatsApp />
  </div>
</template>
