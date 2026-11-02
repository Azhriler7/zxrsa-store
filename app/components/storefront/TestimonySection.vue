<!-- ==========================================================================
 FILE: app/components/storefront/TestimonySection.vue
 DESKRIPSI: Komponen Lego Section Testimoni dengan Infinite Marquee +
            Dukungan Geser Manual (Touch Swipe & Mouse Drag Kanan-Kiri).
=========================================================================== -->
<script setup lang="ts">
import { useRafFn } from '@vueuse/core'
import type { DbTestimonial } from '~~/server/types/database'

const props = defineProps<{
  testimonials: DbTestimonial[]
}>()

const viewportRef = ref<HTMLElement | null>(null)
const isHovered = ref(false)
const isDragging = ref(false)
const startX = ref(0)
const startScrollLeft = ref(0)

// Akumulator pecahan piksel agar gerakan lambat tetap mulus di semua layar
let subPixelAccumulator = 0

const baseTrackItems = computed(() => {
  const list = props.testimonials || []
  if (list.length === 0) return []
  if (list.length >= 4) return list
  return [...list, ...list, ...list]
})

// Menjaga posisi scroll selalu berada di dalam lingkaran tanpa batas (Infinite Wrap)
function normalizeInfiniteScroll(el: HTMLElement) {
  const halfWidth = el.scrollWidth / 2
  if (halfWidth <= 0) return

  if (el.scrollLeft >= halfWidth) {
    el.scrollLeft -= halfWidth
  } else if (el.scrollLeft <= 0) {
    el.scrollLeft += halfWidth
  }
}

// Loop Otomatis 60fps ketika tidak sedang di-hover / digeser manual
useRafFn(() => {
  const el = viewportRef.value
  if (!el || isHovered.value || isDragging.value || baseTrackItems.value.length === 0) return

  subPixelAccumulator += 0.65
  if (subPixelAccumulator >= 1) {
    const step = Math.floor(subPixelAccumulator)
    el.scrollLeft += step
    subPixelAccumulator -= step
    normalizeInfiniteScroll(el)
  }
})

// Handler Geser Manual dengan Mouse (Desktop Drag Kanan-Kiri)
function onMouseDown(e: MouseEvent) {
  const el = viewportRef.value
  if (!el) return
  isDragging.value = true
  startX.value = e.pageX - el.offsetLeft
  startScrollLeft.value = el.scrollLeft
}

function onMouseMove(e: MouseEvent) {
  const el = viewportRef.value
  if (!isDragging.value || !el) return
  e.preventDefault()
  const x = e.pageX - el.offsetLeft
  const walk = (x - startX.value) * 1.2
  el.scrollLeft = startScrollLeft.value - walk
  normalizeInfiniteScroll(el)
}

function stopDragging() {
  isDragging.value = false
}

// Saat digeser dengan jari di layar sentuh (Touch Scroll Native), jaga agar tetap loop
function onTouchScroll() {
  const el = viewportRef.value
  if (el) {
    normalizeInfiniteScroll(el)
  }
}
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
          Sentuh atau geser kartu ke kanan/kiri untuk membaca ulasan pelanggan kami.
        </p>
      </div>
    </UContainer>

    <div
      v-if="baseTrackItems.length === 0"
      class="text-center text-xs text-muted py-6"
    >
      Belum ada ulasan yang ditampilkan.
    </div>

    <!-- VIEWPORT INFINITE MARQUEE + DRAGGABLE / SWIPEABLE -->
    <div
      v-else
      ref="viewportRef"
      class="relative w-full overflow-x-auto py-2 select-none scrollbar-none [&::-webkit-scrollbar]:hidden"
      :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false; stopDragging()"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="stopDragging"
      @touchstart.passive="isHovered = true"
      @touchend.passive="isHovered = false"
      @scroll.passive="onTouchScroll"
    >
      <div class="flex w-max">
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
