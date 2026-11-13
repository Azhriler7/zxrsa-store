<!-- ==========================================================================
 FILE: app/components/storefront/FooterContact.vue
 DESKRIPSI: Footer Kolom Simetris Bergaya Editorial Minimalis / Swiss Grid
=========================================================================== -->
<script setup lang="ts">
const config = useRuntimeConfig()
const currentYear = new Date().getFullYear()

const waUrl = computed(() => {
  const num = config.public.whatsappNumber || '6281234567890'
  return `https://wa.me/${num}`
})
</script>

<template>
  <footer class="w-full bg-[#FAFAFA] dark:bg-[#0A0A0A] text-[#111827] dark:text-[#FAFAFA]">
    <div class="max-w-7xl mx-auto px-4 sm:px-8 py-16">
      <!-- 4 KOLOM SIMETRIS SWISS GRID -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#E5E7EB] dark:border-[#262626]">
        <!-- KOLOM 1: IDENTITAS -->
        <div class="space-y-3">
          <div class="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="ZXRSA"
              class="w-5 h-5 object-contain grayscale contrast-125"
            >
            <span class="text-sm font-black tracking-[-0.04em] uppercase">
              ZXRSA STORE
            </span>
          </div>
          <p class="text-xs text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
            Penyedia lisensi dan akun aplikasi digital terkurasi dengan pengiriman otomatis real-time 24 jam.
          </p>
        </div>

        <!-- KOLOM 2: NAVIGASI -->
        <div class="space-y-3">
          <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280] dark:text-[#737373] block">
            Indeks Halaman
          </span>
          <ul class="space-y-2 text-xs text-[#4B5563] dark:text-[#A3A3A3]">
            <li>
              <a
                href="#pilih-paket"
                class="hover:text-[#111827] dark:hover:text-[#FAFAFA] transition-colors"
              >
                01 / Katalog Produk
              </a>
            </li>
            <li>
              <a
                href="#testimoni"
                class="hover:text-[#111827] dark:hover:text-[#FAFAFA] transition-colors"
              >
                02 / Arsip Ulasan
              </a>
            </li>
            <li>
              <a
                href="#faq"
                class="hover:text-[#111827] dark:hover:text-[#FAFAFA] transition-colors"
              >
                03 / Pertanyaan Umum
              </a>
            </li>
          </ul>
        </div>

        <!-- KOLOM 3: SISTEM PEMBAYARAN -->
        <div class="space-y-3">
          <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280] dark:text-[#737373] block">
            Infrastruktur
          </span>
          <ul class="space-y-2 text-xs text-[#4B5563] dark:text-[#A3A3A3]">
            <li>Verifikasi QRIS Dinamis Otomatis</li>
            <li>Enkripsi Kredensial AES-256-GCM</li>
            <li>Pengiriman Instan ke Gmail</li>
          </ul>
        </div>

        <!-- KOLOM 4: KONTAK DUKUNGAN -->
        <div class="space-y-3">
          <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280] dark:text-[#737373] block">
            Layanan Pelanggan
          </span>
          <p class="text-xs text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
            Butuh bantuan klaim garansi atau kendala transaksi? Hubungi tim dukungan kami.
          </p>
          <a
            :href="waUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-block px-4 py-2 text-xs font-mono uppercase tracking-wider border border-[#E5E7EB] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#111111] hover:border-[#111827] dark:hover:border-[#FAFAFA] transition-colors"
          >
            WhatsApp Support
          </a>
        </div>
      </div>

      <!-- COPYRIGHT BAR -->
      <div class="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-[#6B7280] dark:text-[#737373]">
        <span>© {{ currentYear }} ZXRSA. Seluruh hak cipta dilindungi.</span>
        <span>zxrsa.biz.id — Swiss Editorial Grid System</span>
      </div>
    </div>
  </footer>
</template>
