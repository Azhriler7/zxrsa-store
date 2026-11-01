<!-- ==========================================================================
 FILE: app/components/storefront/FooterContact.vue
 DESKRIPSI: Komponen Lego Kontak & Footer Terpadu
=========================================================================== -->
<script setup lang="ts">
const config = useRuntimeConfig()
</script>

<template>
  <footer
    id="kontak"
    class="scroll-mt-20 border-t border-default bg-elevated/60 py-12"
  >
    <UContainer class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-zap"
            class="w-5 h-5 text-primary"
          />
          <span class="font-extrabold text-lg text-highlighted">ZXRSA STORE</span>
        </div>
        <p class="text-xs text-muted leading-relaxed">
          Platform penyedia layanan akun aplikasi premium otomatis dengan sistem keamanan enkripsi AES-256-GCM dan validasi pembayaran QRIS Dinamis.
        </p>
      </div>

      <div class="space-y-2">
        <h3 class="text-sm font-bold text-highlighted uppercase tracking-wider">
          Jam Operasional & Layanan
        </h3>
        <p class="text-xs text-muted">
          • Pengiriman Akun Stok: <strong>Otomatis 24 Jam Nonstop</strong>
        </p>
        <p class="text-xs text-muted">
          • Konfirmasi Custom Gmail & CS: <strong>08.00 – 22.00 WIB</strong>
        </p>
      </div>

      <div class="space-y-3">
        <h3 class="text-sm font-bold text-highlighted uppercase tracking-wider">
          Hubungi Kami
        </h3>
        <p class="text-xs text-muted">
          Butuh bantuan kendala pembayaran atau klaim garansi? Hubungi WhatsApp resmi kami:
        </p>
        <UButton
          :to="`https://wa.me/${config.public.whatsappNumber}`"
          target="_blank"
          color="success"
          variant="subtle"
          icon="i-lucide-message-circle"
          :label="`WhatsApp: +${config.public.whatsappNumber}`"
          size="sm"
        />
      </div>
    </UContainer>

    <UContainer class="mt-8 pt-6 border-t border-default text-center text-xs text-muted">
      © {{ new Date().getFullYear() }} ZXRSA Store. All rights reserved.
    </UContainer>
  </footer>
</template>
