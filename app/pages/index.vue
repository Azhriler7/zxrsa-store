<!-- ==========================================================================
 FILE: app/pages/index.vue
 DESKRIPSI: Halaman Utama Pembeli (Menyisipkan ActiveInvoiceBanner di antara
            Section Pilih Paket dan Section Testimoni).
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

    <main class="flex-1">
      <!-- LEGO 2: HERO SECTION -->
      <StorefrontHeroSection />

      <!-- LEGO 3: PILIH PAKET + FORM GMAIL + TOMBOL BAYAR -->
      <StorefrontPackageSelectorSection :catalog="data?.catalog || []" />

      <!-- LEGO 3.5: SECTION CARD PESANAN / QRIS AKTIF PEMBELI (DI ANTARA PILIH PAKET & TESTIMONI) -->
      <StorefrontActiveInvoiceBanner />

      <!-- LEGO 4: TESTIMONY SECTION (INFINITE MARQUEE CONTINUOUS LOOP) -->
      <StorefrontTestimonySection :testimonials="data?.testimonials || []" />

      <!-- LEGO 5: FAQ SECTION -->
      <StorefrontFaqSection :faqs="data?.faqs || []" />
    </main>

    <!-- LEGO 6: KONTAK & FOOTER DIGABUNG -->
    <StorefrontFooterContact />

    <!-- LEGO 7: FLOATING WHATSAPP BUTTON (FAB) -->
    <CommonFloatingWhatsApp />
  </div>
</template>
