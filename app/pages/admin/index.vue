<!-- ==========================================================================
 FILE: app/pages/admin/index.vue
 DESKRIPSI: Halaman Utama Dashboard Admin (Akan dilengkapi komponen Lego CRUD
            pada branch fitur berikutnya).
=========================================================================== -->
<script setup lang="ts">
definePageMeta({
  middleware: ['admin-auth']
})

const { user, clear: clearSession } = useUserSession()
const toast = useToast()
const isLoggingOut = ref(false)

async function handleLogout() {
  isLoggingOut.value = true
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await clearSession()
    toast.add({
      title: 'Berhasil Keluar',
      description: 'Sesi administrator Anda telah diakhiri dengan aman.',
      color: 'neutral',
      icon: 'i-lucide-log-out'
    })
    await navigateTo('/admin/login')
  } finally {
    isLoggingOut.value = false
  }
}
</script>

<template>
  <UContainer class="py-10">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-bold text-highlighted">
              Dashboard Admin ZXRSA Store
            </h1>
            <p class="text-sm text-muted">
              Login sebagai: <strong>{{ user?.email }}</strong> ({{ user?.role }})
            </p>
          </div>

          <UButton
            color="error"
            variant="subtle"
            icon="i-lucide-log-out"
            label="Keluar"
            :loading="isLoggingOut"
            @click="handleLogout"
          />
        </div>
      </template>

      <p class="text-sm text-muted">
        Autentikasi Admin dan Domain Guard telah aktif. Siap menyusun komponen Lego Admin pada tahap selanjutnya.
      </p>
    </UCard>
  </UContainer>
</template>
