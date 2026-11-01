<!-- ==========================================================================
 FILE: app/components/admin/SystemLogViewer.vue
 DESKRIPSI: Komponen Lego Tabel Pemantau System Audit Logs (Keamanan & Aktivitas)
=========================================================================== -->
<script setup lang="ts">
export interface SystemLogItem {
  id: number
  level: 'info' | 'warn' | 'error' | 'security'
  module: string
  message: string
  metadata: string | null
  ip_address: string | null
  created_at: string
}

defineProps<{
  logs: SystemLogItem[]
  loading?: boolean
}>()

const emit = defineEmits<{
  refresh: []
}>()

function getBadgeColor(level: SystemLogItem['level']) {
  switch (level) {
    case 'security': return 'error'
    case 'error': return 'error'
    case 'warn': return 'warning'
    default: return 'primary'
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-terminal"
            class="w-5 h-5 text-primary"
          />
          <div>
            <h2 class="text-base font-bold text-highlighted">
              System & Security Audit Logs
            </h2>
            <p class="text-xs text-muted">
              Rekaman otomatis aktivitas login, webhook mutasi QRIS, dan perubahan stok
            </p>
          </div>
        </div>

        <UTooltip text="Muat ulang data log terbaru">
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="subtle"
            size="sm"
            label="Refresh Log"
            :loading="loading"
            @click="emit('refresh')"
          />
        </UTooltip>
      </div>
    </template>

    <div
      v-if="logs.length === 0"
      class="py-8 text-center text-sm text-muted"
    >
      Belum ada catatan log sistem.
    </div>

    <div
      v-else
      class="overflow-x-auto"
    >
      <table class="w-full text-left border-collapse text-sm">
        <thead>
          <tr class="border-b border-default text-xs text-muted uppercase">
            <th class="py-2.5 px-3">
              Waktu (UTC)
            </th>
            <th class="py-2.5 px-3">
              Level
            </th>
            <th class="py-2.5 px-3">
              Modul
            </th>
            <th class="py-2.5 px-3">
              Pesan Aktivitas
            </th>
            <th class="py-2.5 px-3">
              IP Address
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr
            v-for="log in logs"
            :key="log.id"
            class="hover:bg-elevated/50"
          >
            <td class="py-2.5 px-3 whitespace-nowrap text-xs text-muted font-mono">
              {{ log.created_at }}
            </td>
            <td class="py-2.5 px-3 whitespace-nowrap">
              <UBadge
                :color="getBadgeColor(log.level)"
                variant="subtle"
                size="sm"
              >
                {{ log.level.toUpperCase() }}
              </UBadge>
            </td>
            <td class="py-2.5 px-3 whitespace-nowrap font-mono text-xs font-semibold">
              {{ log.module }}
            </td>
            <td class="py-2.5 px-3 text-highlighted">
              <div>{{ log.message }}</div>
              <div
                v-if="log.metadata"
                class="text-xs text-muted font-mono mt-0.5 truncate max-w-md"
              >
                {{ log.metadata }}
              </div>
            </td>
            <td class="py-2.5 px-3 whitespace-nowrap font-mono text-xs text-muted">
              {{ log.ip_address || '-' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>
