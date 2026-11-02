<!-- ==========================================================================
 FILE: app/components/common/StarRating.vue
 DESKRIPSI: Komponen Lego Bintang Rating (Gabungan Bintang Isi & Bintang Kosong)
            Mendukung mode Read-Only maupun Interactive Input.
=========================================================================== -->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: number
    interactive?: boolean
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    interactive: false,
    size: 'md'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const hoverRating = ref(0)

const activeStars = computed(() => hoverRating.value || props.modelValue)

function selectStar(star: number) {
  if (!props.interactive) return
  emit('update:modelValue', star)
}

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'w-4 h-4'
  if (props.size === 'lg') return 'w-8 h-8'
  return 'w-5 h-5'
})
</script>

<template>
  <div
    class="inline-flex items-center gap-1"
    @mouseleave="hoverRating = 0"
  >
    <button
      v-for="star in 5"
      :key="star"
      type="button"
      :disabled="!interactive"
      class="focus:outline-none transition-transform"
      :class="interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'"
      @mouseenter="interactive ? (hoverRating = star) : undefined"
      @click="selectStar(star)"
    >
      <!-- SVG Bintang: Terisi penuh jika star <= activeStars, Kosong dengan garis tepi jika > activeStars -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        stroke-width="1.8"
        stroke="currentColor"
        :class="[
          sizeClass,
          star <= activeStars
            ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
            : 'fill-transparent text-slate-300 dark:text-slate-600'
        ]"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
        />
      </svg>
    </button>
  </div>
</template>
