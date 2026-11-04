<!-- ==========================================================================
 FILE: app/components/storefront/HeroSection.vue
 DESKRIPSI: Hero Section Modern SaaS Tech Aesthetic (Strictly Vertical-Linear
            Flow, No Bento Grid, 100% Responsif Desktop & Mobile).
=========================================================================== -->
<script setup lang="ts">
const linearSteps = [
  {
    step: '01',
    title: 'Pilih Aplikasi & Paket',
    desc: 'Klik aplikasi premium dan durasi langganan sesuai kebutuhan Anda.'
  },
  {
    step: '02',
    title: 'Scan QRIS Dinamis',
    desc: 'Nominal dan kode unik otomatis terisi tanpa perlu ketik manual.'
  },
  {
    step: '03',
    title: 'Akun Terkirim Instan',
    desc: 'Detik itu juga tampil di layar Invoice dan masuk ke Gmail Anda.'
  }
]
</script>

<template>
  <section
    id="beranda"
    class="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-default"
  >
    <!-- SUBTLE SAAS RADIAL GLOW BACKGROUND -->
    <div
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-linear-to-b from-primary/10 via-primary/5 to-transparent"
      aria-hidden="true"
    />

    <!-- STRICTLY VERTICAL-LINEAR CONTAINER -->
    <UContainer class="max-w-3xl text-center space-y-8">
      <!-- STATUS PILL -->
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold">
        <span class="w-2 h-2 rounded-full bg-success animate-ping" />
        <span>Sistem Pengiriman Otomatis Aktif 24/7 • Enkripsi AES-256-GCM</span>
      </div>

      <!-- HEADLINE & SUBHEADLINE -->
      <div class="space-y-4">
        <h1 class="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-highlighted leading-[1.12]">
          Infrastruktur Instan untuk
          <span class="text-primary block sm:inline">Akun Aplikasi Premium</span>
        </h1>

        <p class="text-sm sm:text-base lg:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
          Platform penyedia akun premium bergaransi resmi dengan verifikasi pembayaran
          <strong class="text-highlighted font-semibold">QRIS Dinamis Otomatis</strong>.
          Tanpa antre chat manual, kredensial akun langsung dikirim ke layar dan Gmail Anda dalam hitungan detik.
        </p>
      </div>

      <!-- PRIMARY & SECONDARY CTA -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <UButton
          href="#pilih-paket"
          color="primary"
          size="xl"
          icon="i-lucide-arrow-down-right"
          label="Mulai Pilih Paket Sekarang"
          class="w-full sm:w-auto justify-center font-bold px-8 shadow-md"
        />
        <UButton
          href="#testimoni"
          color="neutral"
          variant="subtle"
          size="xl"
          icon="i-lucide-shield-check"
          label="Lihat Ulasan Terverifikasi"
          class="w-full sm:w-auto justify-center font-semibold"
        />
      </div>

      <!-- LINEAR 3-STEP WORKFLOW STRIP (NO BENTO GRID) -->
      <div class="pt-8 border-t border-default">
        <div class="flex flex-col sm:flex-row items-stretch justify-between gap-6 text-left">
          <div
            v-for="item in linearSteps"
            :key="item.step"
            class="flex-1 flex items-start gap-3.5"
          >
            <span class="font-mono text-xs font-extrabold px-2.5 py-1 rounded-md bg-elevated border border-default text-primary shrink-0">
              {{ item.step }}
            </span>
            <div class="space-y-1">
              <h2 class="text-sm font-bold text-highlighted">
                {{ item.title }}
              </h2>
              <p class="text-xs text-muted leading-relaxed">
                {{ item.desc }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </UContainer>
  </section>
</template>
