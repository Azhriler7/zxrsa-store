<!-- ==========================================================================
 FILE: app/components/storefront/TestimonySection.vue
 DESKRIPSI: Komponen Lego Section Testimoni dengan Auto-Slide Carousel,
            Gabungan Bintang Isi & Kosong, serta Masking Privasi Email.
=========================================================================== -->
<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import type { DbTestimonial } from '~~/server/types/database'

const props = defineProps<{
  testimonials: DbTestimonial[]
}>()

const sliderRef = ref<HTMLElement | null>(null)
const isPaused = ref(false)

// Auto-slide halus setiap 3.2 detik
useIntervalFn(() => {
  if (isPaused.value || !sliderRef.value || props.testimonials.length <= 1) return

  const container = sliderRef.value
  const maxScroll = container.scrollWidth - container.clientWidth

  if (container.scrollLeft >= maxScroll - 10) {
    container.scrollTo({ left: 0, behavior: 'smooth' })
  } else {
    container.scrollBy({ left: 340, behavior: 'smooth' })
  }
}, 3200)
</script>

<template>
  <section
    id="testimoni"
    class="scroll-mt-20 py-14 bg-elevated/40 border-y border-default overflow-hidden"
  >
    <UContainer class="space-y-8">
      <div class="text-center max-w-xl mx-auto space-y-2">
        <UBadge
          color="success"
          variant="subtle"
          icon="i-lucide-badge-check"
        >
          100% Transaksi Terverifikasi
        </UBadge>
        <h2 class="text-2xl sm:text-3xl font-extrabold text-highlighted">
          Ulasan & Testimoni Pembeli
        </h2>
        <p class="text-xs text-muted">
          Ulasan asli dari pelanggan kami (Alamat email disamarkan otomatis untuk menjaga privasi).
        </p>
      </div>

      <!-- AUTO-SLIDE CONTAINER -->
      <div
        ref="sliderRef"
        class="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-none scroll-smooth"
        @mouseenter="isPaused = true"
        @mouseleave="isPaused = false"
        @touchstart="isPaused = true"
        @touchend="isPaused = false"
      >
        <UCard
          v-for="item in testimonials"
          :key="item.id"
          class="min-w-75 sm:min-w-87.5 max-w-87.5 shrink-0 snap-center shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="flex flex-col justify-between h-full space-y-4">
            <div class="space-y-3">
              <!-- GABUNGAN BINTANG ISI & BINTANG KOSONG -->
              <div class="flex items-center justify-between">
                <CommonStarRating
                  :model-value="item.rating"
                  size="sm"
                />
                <span class="text-xs font-bold text-amber-500">{{ item.rating }}.0 / 5.0</span>
              </div>

              <p class="text-sm text-highlighted leading-relaxed italic">
                "{{ item.comment }}"
              </p>
            </div>

            <div class="pt-3 border-t border-default flex items-center justify-between gap-2">
              <div class="truncate">
                <div class="font-mono font-bold text-xs text-highlighted flex items-center gap-1.5">
                  <UIcon
                    name="i-lucide-user-check"
                    class="w-3.5 h-3.5 text-success shrink-0"
                  />
                  <span>{{ item.masked_email }}</span>
                </div>
                <div class="text-xs text-primary font-medium truncate mt-0.5">
                  {{ item.product_package_name }}
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </UContainer>
  </section>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
