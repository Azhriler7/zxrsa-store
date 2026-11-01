<!-- ==========================================================================
 FILE: app/components/admin/StatCard.vue
 DESKRIPSI: Komponen Lego Kartu Statistik untuk Dashboard Admin
=========================================================================== -->
<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  subtitle: string
  icon: string
  tooltipText: string
  color?: 'primary' | 'success' | 'warning' | 'error' | 'neutral'
}>()
</script>

<template>
  <UCard class="shadow-sm hover:shadow-md transition-shadow">
    <div class="flex items-start justify-between">
      <div class="space-y-1">
        <div class="flex items-center gap-1.5">
          <span class="text-xs font-medium text-muted uppercase tracking-wider">
            {{ title }}
          </span>
          <UTooltip :text="tooltipText">
            <UIcon
              name="i-lucide-info"
              class="w-3.5 h-3.5 text-muted cursor-help"
            />
          </UTooltip>
        </div>
        <div class="text-2xl font-bold text-highlighted">
          {{ value }}
        </div>
        <p class="text-xs text-muted">
          {{ subtitle }}
        </p>
      </div>

      <div
        class="p-3 rounded-xl"
        :class="{
          'bg-primary/10 text-primary': !color || color === 'primary',
          'bg-success/10 text-success': color === 'success',
          'bg-warning/10 text-warning': color === 'warning',
          'bg-error/10 text-error': color === 'error',
          'bg-elevated text-muted': color === 'neutral'
        }"
      >
        <UIcon
          :name="icon"
          class="w-6 h-6"
        />
      </div>
    </div>
  </UCard>
</template>
