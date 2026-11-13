<!-- ==========================================================================
 FILE: app/components/common/InvoiceStatusBadge.vue
 DESKRIPSI: Tag Status Pembayaran Invoice Bergaya Swiss Monospace
=========================================================================== -->
<script setup lang="ts">
const props = defineProps<{
  status: 'lunas' | 'pending' | 'expired' | 'dibatalkan' | 'failed'
}>()

const badgeStyle = computed(() => {
  switch (props.status) {
    case 'lunas':
      return {
        label: 'LUNAS',
        classes: 'bg-[#111827] text-[#FFFFFF] border-[#111827] dark:bg-[#FAFAFA] dark:text-[#0A0A0A] dark:border-[#FAFAFA]'
      }
    case 'pending':
      return {
        label: 'PENDING',
        classes: 'bg-transparent text-[#111827] dark:text-[#FAFAFA] border-[#111827] dark:border-[#FAFAFA]'
      }
    case 'expired':
      return {
        label: 'EXPIRED',
        classes: 'bg-transparent text-[#6B7280] dark:text-[#737373] border-[#E5E7EB] dark:border-[#262626]'
      }
    case 'dibatalkan':
      return {
        label: 'DIBATALKAN',
        classes: 'bg-transparent text-red-600 dark:text-red-400 border-red-500/40'
      }
    default:
      return {
        label: 'FAILED',
        classes: 'bg-transparent text-red-600 dark:text-red-400 border-red-500/40'
      }
  }
})
</script>

<template>
  <span
    class="inline-block px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.15em] border"
    :class="badgeStyle.classes"
  >
    {{ badgeStyle.label }}
  </span>
</template>
