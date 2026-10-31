<!-- ==========================================================================
 FILE: app/error.vue
 DESKRIPSI: Halaman Penanganan Error & 404 Not Found menggunakan Nuxt UI
=========================================================================== -->
<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{
  error: NuxtError
}>()

// Fungsi kembali ke beranda dan bersihkan state error
const handleClearError = () => clearError({ redirect: '/' })
</script>

<template>
  <UApp>
    <div class="min-h-screen flex items-center justify-center bg-default p-6">
      <UCard class="max-w-md w-full text-center shadow-lg">
        <div class="flex flex-col items-center gap-4 py-6">
          <div class="p-4 rounded-full bg-error/10 text-error">
            <UIcon
              name="i-lucide-shield-alert"
              class="w-12 h-12"
            />
          </div>

          <UBadge
            color="error"
            variant="subtle"
            size="lg"
          >
            Error {{ error.statusCode || 404 }}
          </UBadge>

          <h1 class="text-2xl font-bold text-highlighted">
            {{ error.statusCode === 404 ? 'Halaman Tidak Ditemukan' : 'Terjadi Kesalahan' }}
          </h1>

          <p class="text-sm text-muted">
            {{ error.statusMessage || 'Maaf, halaman yang Anda tuju tidak tersedia atau telah dipindahkan.' }}
          </p>

          <UButton
            icon="i-lucide-home"
            color="primary"
            size="lg"
            class="mt-4"
            label="Kembali ke Beranda"
            @click="handleClearError"
          />
        </div>
      </UCard>
    </div>
  </UApp>
</template>
