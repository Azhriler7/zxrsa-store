<!-- ==========================================================================
 FILE: app/components/admin/StatCard.vue
 DESKRIPSI: Komponen Lego Kartu Statistik Dashboard Admin
=========================================================================== -->
<script setup lang="ts">
defineProps<{
  title?: string
  label?: string
  value: string | number
  subtitle?: string
  description?: string
  icon?: string
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
}>()
</script>

<template>
  <UCard>
    <div class="flex items-start justify-between gap-3">
      <div class="space-y-1 min-w-0">
        <span class="text-xs font-semibold uppercase tracking-wider text-muted block truncate">
          {{ title || label }}
        </span>
        <div class="text-xl sm:text-2xl font-extrabold font-mono text-highlighted truncate">
          {{ value }}
        </div>
        <p
          v-if="subtitle || description"
          class="text-xs text-muted truncate"
        >
          {{ subtitle || description }}
        </p>
      </div>

      <div
        v-if="icon"
        class="p-2.5 rounded-xl bg-elevated border border-default shrink-0 flex items-center justify-center"
      >
        <UIcon
          :name="icon"
          class="w-5 h-5 text-primary"
        />
      </div>
    </div>
  </UCard>
</template>
