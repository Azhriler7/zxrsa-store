<!-- ==========================================================================
 FILE: app/components/storefront/FooterContact.vue
 DESKRIPSI: Footer & Kontak Resmi ZXRSA Store dengan Logo /logo.png
=========================================================================== -->
<script setup lang="ts">
const config = useRuntimeConfig()
const waUrl = computed(() => `https://wa.me/${config.public.whatsappNumber}`)
</script>

<template>
  <footer
    id="kontak"
    class="scroll-mt-20 border-t border-default bg-elevated/40 py-14"
  >
    <UContainer class="max-w-3xl space-y-8 text-center">
      <!-- BRAND LOGO /logo.png -->
      <div class="flex flex-col items-center space-y-3">
        <img
          src="/logo.png"
          alt="ZXRSA Store Logo"
          class="w-12 h-12 rounded-2xl object-contain bg-default border border-default p-1 shadow-xs"
        >
        <div class="space-y-1">
          <span class="font-extrabold text-lg text-highlighted tracking-tight block">
            ZXRSA<span class="text-primary">.STORE</span>
          </span>
          <p class="text-xs sm:text-sm text-muted max-w-md mx-auto leading-relaxed">
            Layanan penjualan akun aplikasi premium otomatis 24 jam dengan sistem pembayaran QRIS Dinamis dan enkripsi stok tingkat lanjut.
          </p>
        </div>
      </div>

      <!-- CONTACT CTA LINEAR BAR -->
      <div class="flex flex-wrap items-center justify-center gap-3">
        <UButton
          :to="waUrl"
          target="_blank"
          color="success"
          variant="subtle"
          size="md"
          icon="i-lucide-message-circle"
          label="Hubungi WhatsApp CS Resmi"
        />
        <UButton
          href="#pilih-paket"
          color="neutral"
          variant="outline"
          size="md"
          icon="i-lucide-arrow-up"
          label="Kembali ke Katalog Paket"
        />
      </div>

      <div class="pt-6 border-t border-default flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted">
        <span>© {{ new Date().getFullYear() }} ZXRSA Store. Seluruh hak cipta dilindungi.</span>
        <span class="font-mono">Secured by AES-256-GCM & Cloudflare Edge</span>
      </div>
    </UContainer>
  </footer>
</template>
