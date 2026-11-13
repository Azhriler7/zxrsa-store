<!-- ==========================================================================
 FILE: app/components/storefront/HeroSection.vue
 DESKRIPSI: Hero Section Split-Screen Asimetris & Bento Grid (Swiss Editorial)
=========================================================================== -->
<script setup lang="ts">
import type { PublicProductCatalog } from '~~/server/services/StorefrontRepository'

defineProps<{
  catalog?: PublicProductCatalog[]
}>()
</script>

<template>
  <section class="w-full bg-[#FAFAFA] dark:bg-[#0A0A0A] border-b border-[#E5E7EB] dark:border-[#262626]">
    <div class="max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-24 lg:py-28">
      <!-- SPLIT-SCREEN ASIMETRIS (KIRI: TIPOGRAFI BESAR, KANAN: BENTO VISUAL PRODUK) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-stretch">
        <!-- KOLOM KIRI (7 KOLOM): TIPOGRAFI EDITORIAL BESAR -->
        <div class="lg:col-span-7 flex flex-col justify-between space-y-10 pr-0 lg:pr-8">
          <div class="space-y-6">
            <div class="inline-block border border-[#E5E7EB] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#111111] px-3 py-1">
              <span class="font-mono text-[11px] uppercase tracking-[0.2em] text-[#4B5563] dark:text-[#A3A3A3]">
                Edisi Katalog 2026 — Pengiriman Otomatis 24/7
              </span>
            </div>

            <h1 class="text-4xl sm:text-6xl lg:text-[64px] font-black tracking-[-0.045em] leading-[1.02] text-[#111827] dark:text-[#FAFAFA]">
              Akses Lisensi &amp; Aplikasi Digital Tanpa Kompromi.
            </h1>

            <p class="text-base sm:text-lg text-[#4B5563] dark:text-[#9CA3AF] max-w-xl leading-relaxed font-normal">
              Distribusi akun premium terkurasi dengan sistem verifikasi QRIS Dinamis otomatis. Kredensial dikirim seketika ke layar dan email Anda dalam hitungan detik setelah pembayaran.
            </p>
          </div>

          <div class="space-y-8 pt-2">
            <!-- TOMBOL AKSI MINIMALIS TANPA IKON DEKORATIF -->
            <div class="flex flex-wrap items-center gap-4">
              <a
                href="#pilih-paket"
                class="px-7 py-4 text-xs sm:text-sm font-bold uppercase tracking-[0.12em] bg-[#111827] text-[#FFFFFF] dark:bg-[#FAFAFA] dark:text-[#0A0A0A] hover:opacity-85 transition-opacity"
              >
                Eksplorasi Katalog
              </a>
              <a
                href="#testimoni"
                class="px-7 py-4 text-xs sm:text-sm font-semibold uppercase tracking-[0.12em] bg-[#FFFFFF] dark:bg-[#111111] text-[#111827] dark:text-[#FAFAFA] border border-[#E5E7EB] dark:border-[#262626] hover:border-[#111827] dark:hover:border-[#FAFAFA] transition-colors"
              >
                Arsip Ulasan
              </a>
            </div>

            <!-- METRIK SWISS GRID -->
            <div class="grid grid-cols-3 border-t border-[#E5E7EB] dark:border-[#262626] pt-6 gap-6">
              <div>
                <span class="block font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] dark:text-[#FAFAFA]">
                  &lt; 3 dtk
                </span>
                <span class="block text-[11px] font-mono uppercase tracking-wider text-[#6B7280] dark:text-[#737373] mt-1">
                  Pengiriman Instan
                </span>
              </div>
              <div class="border-l border-[#E5E7EB] dark:border-[#262626] pl-6">
                <span class="block font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] dark:text-[#FAFAFA]">
                  AES-256
                </span>
                <span class="block text-[11px] font-mono uppercase tracking-wider text-[#6B7280] dark:text-[#737373] mt-1">
                  Stok Terenkripsi
                </span>
              </div>
              <div class="border-l border-[#E5E7EB] dark:border-[#262626] pl-6">
                <span class="block font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] dark:text-[#FAFAFA]">
                  100%
                </span>
                <span class="block text-[11px] font-mono uppercase tracking-wider text-[#6B7280] dark:text-[#737373] mt-1">
                  Garansi Durasi
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- KOLOM KANAN (5 KOLOM): VISUAL PRODUK BENTO GRID BERSIH -->
        <div class="lg:col-span-5 grid grid-cols-2 grid-rows-2 border border-[#E5E7EB] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#111111]">
          <!-- BENTO CELL 1 (SPAN 2 KOLOM ATAS): VISUAL PRODUK UTAMA -->
          <div class="col-span-2 p-6 sm:p-8 border-b border-[#E5E7EB] dark:border-[#262626] flex flex-col justify-between gap-6">
            <div class="flex items-start justify-between gap-4">
              <div class="space-y-1">
                <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280] dark:text-[#737373] block">
                  01 / Produk Unggulan
                </span>
                <h2 class="text-xl font-bold tracking-[-0.03em] text-[#111827] dark:text-[#FAFAFA]">
                  Suite Kreatif &amp; Produktivitas
                </h2>
              </div>
              <span class="font-mono text-[11px] px-2.5 py-0.5 border border-[#E5E7EB] dark:border-[#262626] text-[#111827] dark:text-[#FAFAFA]">
                READY STOCK
              </span>
            </div>

            <div class="flex items-center gap-5 py-2">
              <img
                src="/logo.png"
                alt="ZXRSA Visual"
                class="w-20 h-20 object-contain p-3 border border-[#E5E7EB] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A]"
              >
              <div class="space-y-1.5">
                <p class="text-xs text-[#4B5563] dark:text-[#A3A3A3] leading-relaxed">
                  Akses penuh fitur pro tanpa batas watermark, mendukung akun privat maupun upgrade langsung pada Gmail pribadi Anda.
                </p>
                <a
                  href="#pilih-paket"
                  class="inline-block text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-[#FAFAFA] underline underline-offset-4"
                >
                  Lihat Spesifikasi Harga
                </a>
              </div>
            </div>
          </div>

          <!-- BENTO CELL 2 (KIRI BAWAH): QRIS DINAMIS -->
          <div class="p-6 border-r border-[#E5E7EB] dark:border-[#262626] flex flex-col justify-between space-y-4">
            <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280] dark:text-[#737373]">
              02 / Pembayaran
            </span>
            <div class="space-y-1">
              <div class="text-base font-bold tracking-tight text-[#111827] dark:text-[#FAFAFA]">
                QRIS Dinamis Otomatis
              </div>
              <p class="text-xs text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
                Mendukung seluruh m-Banking dan E-Wallet dengan nominal terisi otomatis.
              </p>
            </div>
          </div>

          <!-- BENTO CELL 3 (KANAN BAWAH): PENGIRIMAN GMAIL -->
          <div class="p-6 flex flex-col justify-between space-y-4">
            <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280] dark:text-[#737373]">
              03 / Arsip Resmi
            </span>
            <div class="space-y-1">
              <div class="text-base font-bold tracking-tight text-[#111827] dark:text-[#FAFAFA]">
                Sinkronisasi Gmail
              </div>
              <p class="text-xs text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
                Salinan kredensial, panduan login, dan garansi tersimpan permanen di email Anda.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
