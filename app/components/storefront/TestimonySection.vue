<!-- ==========================================================================
 FILE: app/components/storefront/TestimonySection.vue
 DESKRIPSI: Ulasan Pembeli Terverifikasi dengan Variasi Ukuran Bento Grid
            (Kompatibel 100% dengan Tipe DbTestimonial Database D1).
=========================================================================== -->
<script setup lang="ts">
import type { DbTestimonial } from '~~/server/types/database'

defineProps<{
  testimonials: DbTestimonial[]
}>()

function getBentoSpanClass(index: number): string {
  // Variasi Bento Grid 12 Kolom: Kartu ke-1 dan ke-4 berukuran 6 kolom (lebar), lainnya 3 kolom
  const mod = index % 4
  if (mod === 0 || mod === 3) {
    return 'lg:col-span-6'
  }
  return 'lg:col-span-3'
}
</script>

<template>
  <section
    id="testimoni"
    class="scroll-mt-14 w-full bg-[#FAFAFA] dark:bg-[#0A0A0A] border-b border-[#E5E7EB] dark:border-[#262626] py-16 sm:py-24"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
      <!-- HEADER SECTION EDITORIAL -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5E7EB] dark:border-[#262626] pb-6">
        <div class="space-y-2">
          <span class="font-mono text-xs uppercase tracking-[0.2em] text-[#6B7280] dark:text-[#737373] block">
            02 / Arsip Transaksi Terverifikasi
          </span>
          <h2 class="text-3xl sm:text-4xl font-black tracking-[-0.04em] text-[#111827] dark:text-[#FAFAFA]">
            Ulasan Pembeli Resmi.
          </h2>
        </div>
        <p class="text-xs font-mono uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">
          Total {{ testimonials.length }} Ulasan Tercatat
        </p>
      </div>

      <div
        v-if="!testimonials.length"
        class="p-12 border border-[#E5E7EB] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#111111] text-center text-xs font-mono uppercase tracking-widest text-[#6B7280]"
      >
        Belum ada ulasan yang ditampilkan.
      </div>

      <!-- VARIASI BENTO GRID 12 KOLOM -->
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-px bg-[#E5E7EB] dark:bg-[#262626] border border-[#E5E7EB] dark:border-[#262626]"
      >
        <article
          v-for="(item, idx) in testimonials.slice(0, 8)"
          :key="item.id"
          class="bg-[#FFFFFF] dark:bg-[#111111] p-6 sm:p-8 flex flex-col justify-between space-y-6 transition-colors hover:bg-[#FAFAFA] dark:hover:bg-[#171717]"
          :class="getBentoSpanClass(idx)"
        >
          <div class="space-y-4">
            <div class="flex items-center justify-between gap-2">
              <span class="font-mono text-xs font-bold tracking-widest text-[#111827] dark:text-[#FAFAFA]">
                {{ '★'.repeat(Math.max(1, Math.min(5, item.rating || 5))) }}
              </span>
              <span class="font-mono text-[10px] uppercase tracking-widest text-[#6B7280] dark:text-[#737373]">
                {{ item.rating }}.0 / 5.0
              </span>
            </div>

            <p class="text-sm sm:text-base text-[#111827] dark:text-[#FAFAFA] leading-relaxed font-normal">
              "{{ item.comment }}"
            </p>
          </div>

          <div class="pt-4 border-t border-[#E5E7EB] dark:border-[#262626] flex items-end justify-between gap-4">
            <div class="min-w-0">
              <div class="font-mono text-xs font-bold text-[#111827] dark:text-[#FAFAFA] truncate">
                {{ item.masked_email }}
              </div>
              <div class="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 truncate">
                {{ item.product_package_name }}
              </div>
            </div>
            <span class="font-mono text-[10px] text-[#6B7280] dark:text-[#737373] shrink-0">
              {{ String(item.created_at || '').slice(0, 10) }}
            </span>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
