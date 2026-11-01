<!-- ==========================================================================
 FILE: app/components/storefront/HeroSection.vue
 DESKRIPSI: Komponen Lego Hero Section di Homepage Pembeli
=========================================================================== -->
<script setup lang="ts">
function scrollToPackages() {
  document.getElementById('pilih-paket')?.scrollIntoView({ behavior: 'smooth' })
}

function scrollToFaq() {
  document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <section
    id="hero-section"
    class="scroll-mt-20 py-14 lg:py-20 border-b border-default bg-linear-to-b from-primary/5 to-transparent"
  >
    <UContainer class="text-center max-w-3xl space-y-6">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
        <UIcon
          name="i-lucide-shield-check"
          class="w-4 h-4"
        />
        <span>Otomatis 24 Jam • QRIS Instan • Bergaransi Penuh</span>
      </div>

      <h1 class="text-3xl sm:text-5xl font-extrabold text-highlighted tracking-tight leading-tight">
        Upgrade Aplikasi Favoritmu ke <span class="text-primary">Versi Pro & VIP</span> dalam Hitungan Detik
      </h1>

      <p class="text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
        Dapatkan akun premium resmi untuk <strong>Alight Motion Pro, Wink VIP, CapCut Pro</strong>, dan aplikasi kreator lainnya. Pembayaran otomatis via QRIS langsung kirim ke Gmail Anda!
      </p>

      <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
        <UButton
          size="xl"
          color="primary"
          icon="i-lucide-rocket"
          label="Pilih Paket Sekarang"
          @click="scrollToPackages"
        />
        <UButton
          size="xl"
          color="neutral"
          variant="subtle"
          icon="i-lucide-circle-help"
          label="Cara Pembelian"
          @click="scrollToFaq"
        />
      </div>
    </UContainer>
  </section>
</template>
