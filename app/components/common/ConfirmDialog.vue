<!-- ==========================================================================
 FILE: app/components/common/ConfirmDialog.vue
 DESKRIPSI: Komponen Lego Dialog Konfirmasi untuk Aksi Krusial (Delete, Logout,
            Konfirmasi Custom Gmail, dll).
=========================================================================== -->
<script setup lang="ts">
defineProps<{
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  confirmColor?: 'primary' | 'error' | 'warning' | 'success'
  loading?: boolean
}>()

const isOpen = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  confirm: []
}>()

function handleConfirm() {
  emit('confirm')
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :description="description"
  >
    <template #body>
      <div class="flex items-start gap-3">
        <div class="p-2.5 rounded-full bg-warning/10 text-warning shrink-0">
          <UIcon
            name="i-lucide-triangle-alert"
            class="w-6 h-6"
          />
        </div>
        <p class="text-sm text-muted leading-relaxed">
          {{ description }}
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton
          color="neutral"
          variant="subtle"
          :label="cancelLabel || 'Batal'"
          :disabled="loading"
          @click="isOpen = false"
        />
        <UButton
          :color="confirmColor || 'primary'"
          :label="confirmLabel || 'Ya, Lanjutkan'"
          :loading="loading"
          @click="handleConfirm"
        />
      </div>
    </template>
  </UModal>
</template>
