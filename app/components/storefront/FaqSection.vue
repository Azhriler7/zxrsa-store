<!-- ==========================================================================
 FILE: app/components/storefront/FaqSection.vue
 DESKRIPSI: FAQ Section dengan Tata Letak Split Swiss Grid & Garis 1px Solid
=========================================================================== -->
<script setup lang="ts">
export interface PublicFaqItem {
  id: number | string
  question: string
  answer: string
  sort_order?: number
  is_active?: number
}

defineProps<{
  faqs: PublicFaqItem[]
}>()

const openFaqId = ref<number | string | null>(null)

function toggleFaq(id: number | string) {
  openFaqId.value = openFaqId.value === id ? null : id
}
</script>

<template>
  <section
    id="faq"
    class="scroll-mt-14 w-full bg-[#FAFAFA] dark:bg-[#0A0A0A] border-b border-[#E5E7EB] dark:border-[#262626] py-16 sm:py-24"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <!-- KOLOM KIRI (4 KOLOM): JUDUL EDITORIAL -->
        <div class="lg:col-span-4 space-y-3">
          <span class="font-mono text-xs uppercase tracking-[0.2em] text-[#6B7280] dark:text-[#737373] block">
            03 / Pusat Informasi
          </span>
          <h2 class="text-3xl sm:text-4xl font-black tracking-[-0.04em] text-[#111827] dark:text-[#FAFAFA]">
            Pertanyaan Umum &amp; Prosedur.
          </h2>
          <p class="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
            Dokumentasi singkat mengenai alur pembelian otomatis, verifikasi QRIS Dinamis, dan klaim garansi.
          </p>
        </div>

        <!-- KOLOM KANAN (8 KOLOM): DAFTAR AKORDEON GARIS 1PX -->
        <div class="lg:col-span-8 border-t border-[#E5E7EB] dark:border-[#262626] divide-y divide-[#E5E7EB] dark:divide-[#262626]">
          <div
            v-if="!faqs.length"
            class="py-8 text-xs font-mono uppercase tracking-widest text-[#6B7280]"
          >
            Belum ada daftar pertanyaan umum.
          </div>

          <div
            v-for="(faq, idx) in faqs"
            :key="faq.id"
            class="py-5"
          >
            <button
              type="button"
              class="w-full flex items-baseline justify-between gap-6 text-left cursor-pointer focus:outline-none group"
              @click="toggleFaq(faq.id)"
            >
              <div class="flex items-baseline gap-4">
                <span class="font-mono text-xs text-[#6B7280] dark:text-[#737373]">
                  {{ String(idx + 1).padStart(2, '0') }}
                </span>
                <span class="text-base font-bold tracking-tight text-[#111827] dark:text-[#FAFAFA] group-hover:opacity-75 transition-opacity">
                  {{ faq.question }}
                </span>
              </div>
              <span class="font-mono text-sm font-bold text-[#111827] dark:text-[#FAFAFA] shrink-0">
                {{ openFaqId === faq.id ? '—' : '+' }}
              </span>
            </button>

            <div
              v-if="openFaqId === faq.id"
              class="mt-3 pl-8 pr-4 text-xs sm:text-sm text-[#4B5563] dark:text-[#A3A3A3] leading-relaxed whitespace-pre-line"
            >
              {{ faq.answer }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
