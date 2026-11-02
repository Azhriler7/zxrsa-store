<!-- ==========================================================================
 FILE: app/components/common/AppIconImage.vue
 DESKRIPSI: Komponen Lego Gambar Icon Aplikasi dengan USkeleton Berdenyut
            Saat Loading & Fallback Default Placeholder Otomatis.
=========================================================================== -->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    src?: string | null
    alt?: string
    sizeClass?: string
    roundedClass?: string
  }>(),
  {
    src: null,
    alt: 'App Icon',
    sizeClass: 'w-10 h-10',
    roundedClass: 'rounded-xl'
  }
)

// Default Image SVG (Data URI instan) jika belum dipilih dari Admin
const DEFAULT_ICON_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" rx="28" fill="#0f172a"/>
    <rect x="6" y="6" width="108" height="108" rx="22" stroke="#38bdf8" stroke-width="3" stroke-opacity="0.45"/>
    <path d="M60 30L84 44V76L60 90L36 76V44L60 30Z" stroke="#38bdf8" stroke-width="6" stroke-linejoin="round"/>
    <circle cx="60" cy="60" r="10" fill="#38bdf8"/>
  </svg>`
)}`

const imgRef = ref<HTMLImageElement | null>(null)
const isLoading = ref(true)
const hasError = ref(false)

const resolvedSrc = computed(() => {
  const clean = props.src?.trim()
  if (!clean || hasError.value) {
    return DEFAULT_ICON_DATA_URI
  }
  return clean
})

// Jika menggunakan data:image/svg+xml default, tidak perlu menunggu network load
watch(
  () => props.src,
  (newVal) => {
    hasError.value = false
    const clean = newVal?.trim()
    if (!clean || clean.startsWith('data:image/')) {
      isLoading.value = false
    } else {
      isLoading.value = true
    }
  },
  { immediate: true }
)

onMounted(() => {
  // Jika gambar sudah ada di cache browser saat komponen dipasang
  if (imgRef.value?.complete) {
    isLoading.value = false
  }
})

function handleLoad() {
  isLoading.value = false
}

function handleError() {
  hasError.value = true
  isLoading.value = false
}
</script>

<template>
  <div
    class="relative overflow-hidden shrink-0 border border-default bg-elevated flex items-center justify-center"
    :class="[sizeClass, roundedClass]"
  >
    <!-- USKELETON BERDENYUT SAAT GAMBAR ICON SEDANG LOADING -->
    <USkeleton
      v-if="isLoading"
      class="absolute inset-0 w-full h-full animate-pulse bg-primary/15"
      :class="roundedClass"
    />

    <!-- GAMBAR ICON (OTOMATIS FALLBACK KE DEFAULT IMAGE JIKA KOSONG/ERROR) -->
    <img
      ref="imgRef"
      :src="resolvedSrc"
      :alt="alt"
      class="w-full h-full object-cover transition-opacity duration-300"
      :class="isLoading ? 'opacity-0' : 'opacity-100'"
      @load="handleLoad"
      @error="handleError"
    >
  </div>
</template>
