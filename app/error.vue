<!-- ==========================================================================
 FILE: app/error.vue
 DESKRIPSI: Halaman Error & 404 Bergaya Swiss Editorial Minimalis
=========================================================================== -->
<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{
  error: NuxtError
}>()

const handleClearError = () => clearError({ redirect: '/' })
</script>

<template>
  <UApp>
    <div class="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0A0A0A] text-[#111827] dark:text-[#FAFAFA] p-6">
      <div class="max-w-md w-full border border-[#E5E7EB] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#111111] p-10 space-y-6">
        <span class="font-mono text-xs uppercase tracking-[0.2em] text-[#6B7280] dark:text-[#737373] block">
          Kode Status / {{ error.statusCode || 404 }}
        </span>

        <h1 class="text-3xl font-black tracking-[-0.04em]">
          {{ error.statusCode === 404 ? 'Halaman Tidak Ditemukan.' : 'Terjadi Kesalahan Sistem.' }}
        </h1>

        <p class="text-xs sm:text-sm text-[#4B5563] dark:text-[#9CA3AF] leading-relaxed">
          {{ error.statusMessage || 'Halaman yang Anda tuju tidak tersedia atau telah dipindahkan dari indeks katalog.' }}
        </p>

        <button
          type="button"
          class="w-full py-3.5 px-6 text-xs font-bold uppercase tracking-[0.14em] bg-[#111827] text-[#FFFFFF] dark:bg-[#FAFAFA] dark:text-[#0A0A0A] hover:opacity-85 transition-opacity cursor-pointer"
          @click="handleClearError"
        >
          Kembali ke Katalog Utama
        </button>
      </div>
    </div>
  </UApp>
</template>
