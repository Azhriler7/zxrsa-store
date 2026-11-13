<!-- ==========================================================================
 FILE: app/components/admin/SystemLogViewer.vue
 DESKRIPSI: Komponen Lego Tabel System Audit Log dengan Scroll View (max-h-80)
=========================================================================== -->
<script setup lang="ts">
export interface SystemLogItem {
  id: number | string
  level: string
  module: string
  message: string
  metadata?: string | null
  created_at: string
}

defineProps<{
  logs: SystemLogItem[]
}>()

function getBadgeColor(level: string): 'error' | 'warning' | 'info' {
  if (level === 'error') return 'error'
  if (level === 'warn') return 'warning'
  return 'info'
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-terminal"
            class="w-5 h-5 text-primary"
          />
          <div>
            <h2 class="text-base font-bold text-highlighted">
              System Audit Log (Aktivitas &amp; Webhook)
            </h2>
            <p class="text-xs text-muted">
              Rekaman otomatis dalam wadah scroll view ({{ logs.length }} catatan terbaru).
            </p>
          </div>
        </div>
        <UBadge
          color="neutral"
          variant="subtle"
          size="xs"
          icon="i-lucide-scroll-text"
        >
          Scroll View
        </UBadge>
      </div>
    </template>

    <div
      v-if="!logs.length"
      class="py-8 text-center text-xs text-muted"
    >
      Belum ada rekaman log aktivitas sistem.
    </div>

    <div
      v-else
      class="max-h-80 overflow-y-auto overflow-x-auto pr-1 border border-default rounded-xl"
    >
      <table class="w-full text-left border-collapse text-xs">
        <thead class="sticky top-0 z-10 bg-elevated border-b border-default text-muted uppercase">
          <tr>
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
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr
            v-for="log in logs"
            :key="log.id"
            class="hover:bg-elevated/40"
          >
            <td class="py-2.5 px-3 font-mono text-muted whitespace-nowrap">
              {{ log.created_at }}
            </td>
            <td class="py-2.5 px-3 whitespace-nowrap">
              <UBadge
                :color="getBadgeColor(log.level)"
                variant="subtle"
                size="xs"
                class="uppercase"
              >
                {{ log.level }}
              </UBadge>
            </td>
            <td class="py-2.5 px-3 font-mono font-semibold text-highlighted whitespace-nowrap">
              {{ log.module }}
            </td>
            <td class="py-2.5 px-3 text-highlighted">
              <div>{{ log.message }}</div>
              <pre
                v-if="log.metadata"
                class="mt-1 p-1.5 rounded bg-elevated font-mono text-[10px] text-muted overflow-x-auto max-w-md"
              >{{ log.metadata }}</pre>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>
