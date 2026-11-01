<!-- ==========================================================================
 FILE: app/components/common/InvoiceStatusBadge.vue
 DESKRIPSI: Komponen Lego Badge Status Pembayaran Invoice
=========================================================================== -->
<script setup lang="ts">
const props = defineProps<{
  status: 'lunas' | 'pending' | 'expired' | 'dibatalkan' | 'failed'
}>()

const badgeConfig = computed(() => {
  switch (props.status) {
    case 'lunas':
      return { label: 'LUNAS', color: 'success' as const, icon: 'i-lucide-check-circle-2' }
    case 'pending':
      return { label: 'PENDING', color: 'warning' as const, icon: 'i-lucide-clock' }
    case 'expired':
      return { label: 'EXPIRED', color: 'neutral' as const, icon: 'i-lucide-timer-off' }
    case 'dibatalkan':
      return { label: 'DIBATALKAN', color: 'error' as const, icon: 'i-lucide-ban' }
    default:
      return { label: 'FAILED', color: 'error' as const, icon: 'i-lucide-alert-octagon' }
  }
})
</script>

<template>
  <UBadge
    :color="badgeConfig.color"
    :icon="badgeConfig.icon"
    variant="subtle"
    size="sm"
    class="font-semibold"
  >
    {{ badgeConfig.label }}
  </UBadge>
</template>
