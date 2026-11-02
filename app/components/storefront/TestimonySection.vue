<!-- ==========================================================================
 FILE: app/components/storefront/TestimonySection.vue
 DESKRIPSI: Komponen Lego Section Testimoni dengan Teknik Infinite Marquee
            60fps (useRafFn) Tanpa Custom Class CSS agar 100% Lulus Linter.
=========================================================================== -->
<script setup lang="ts">
import { useRafFn } from '@vueuse/core'
import type { DbTestimonial } from '~~/server/types/database'

const props = defineProps<{
  testimonials: DbTestimonial[]
}>()

const trackRef = ref<HTMLElement | null>(null)
const isPaused = ref(false)
const offsetPx = ref(0)

// Pastikan item cukup panjang sebelum digandakan menjadi 2 set identik
const baseTrackItems = computed(() => {
  const list = props.testimonials || []
  if (list.length === 0) return []
  if (list.length >= 4) return list
  return [...list, ...list, ...list]
})

// Animasi Infinite Marquee 60fps dari kanan ke kiri tanpa putus
useRafFn(() => {
  if (isPaused.value || !trackRef.value || baseTrackItems.value.length === 0) return

  const halfWidth = trackRef.value.scrollWidth / 2
  if (halfWidth <= 0) return

  // Kecepatan gerak lambat & mulus (0.55 pixel per frame)
  offsetPx.value += 0.55

  // Begitu set pertama habis terlewati, kembalikan ke 0 tanpa terlihat melompat
  if (offsetPx.value >= halfWidth) {
    offsetPx.value = 0
  }
})
</script>

<template>
  <section
    id="testimoni"
    class="scroll-mt-20 py-14 bg-elevated/40 border-y border-default overflow-hidden"
  >
    <UContainer class="space-y-8 mb-8">
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
    </UContainer>

    <div
      v-if="baseTrackItems.length === 0"
      class="text-center text-xs text-muted py-6"
    >
      Belum ada ulasan yang ditampilkan.
    </div>

    <!-- INFINITE MARQUEE VIEWPORT (MURNI TAILWIND UTILITY CLASSES) -->
    <div
      v-else
      class="relative w-full overflow-hidden py-2"
      @mouseenter="isPaused = true"
      @mouseleave="isPaused = false"
      @touchstart="isPaused = true"
      @touchend="isPaused = false"
    >
      <!-- TRACK BERISI 2 SET IDENTIK UNTUK CONTINUOUS LOOP -->
      <div
        ref="trackRef"
        class="flex w-max will-change-transform"
        :style="{ transform: `translate3d(-${offsetPx}px, 0, 0)` }"
      >
        <div
          v-for="setIndex in 2"
          :key="`set-${setIndex}`"
          class="flex items-stretch gap-5 pr-5 shrink-0"
          :aria-hidden="setIndex === 2 ? 'true' : undefined"
        >
          <UCard
            v-for="(item, idx) in baseTrackItems"
            :key="`${setIndex}-${item.id}-${idx}`"
            class="w-77.5 sm:w-87.5 shrink-0 shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex flex-col justify-between h-full space-y-4">
              <div class="space-y-3">
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
      </div>
    </div>
  </section>
</template>
