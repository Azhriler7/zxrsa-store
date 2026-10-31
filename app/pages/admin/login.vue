<!-- ==========================================================================
 FILE: app/pages/admin/login.vue
 DESKRIPSI: Halaman Login Khusus Admin (admin.domain.com/admin/login)
            Dilengkapi Zod Validation Bubble, Toast Notification & Tooltip.
=========================================================================== -->
<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  middleware: ['admin-auth'],
  layout: false
})

useSeoMeta({
  title: 'Admin Login — ZXRSA Store',
  robots: 'noindex, nofollow'
})

const toast = useToast()
const { fetch: refreshSession } = useUserSession()

// Skema Validasi Form untuk memunculkan Validation Bubble otomatis di Nuxt UI
const loginFormSchema = z.object({
  email: z.string().email('Masukkan format email admin yang valid'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter')
})

type LoginFormSchema = z.output<typeof loginFormSchema>

const formState = reactive<LoginFormSchema>({
  email: '',
  password: ''
})

const isSubmitting = ref(false)
const showPassword = ref(false)

// ----------------------------------------------------------------------------
// [SECTION: HANDLER SUBMIT LOGIN ADMIN]
// ----------------------------------------------------------------------------
async function onSubmitLogin(event: FormSubmitEvent<LoginFormSchema>) {
  isSubmitting.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: event.data
    })

    await refreshSession()

    toast.add({
      title: 'Autentikasi Berhasil',
      description: 'Selamat datang kembali di Panel Kontrol Admin ZXRSA Store.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    await navigateTo('/admin')
  } catch (err: unknown) {
    const errorMessage = (err as { data?: { statusMessage?: string } })?.data?.statusMessage
      || 'Gagal melakukan autentikasi. Periksa kembali email dan password Anda.'

    toast.add({
      title: 'Akses Ditolak',
      description: errorMessage,
      color: 'error',
      icon: 'i-lucide-octagon-alert'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-elevated px-4">
    <UCard class="w-full max-w-md shadow-xl">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-lg bg-primary/10 text-primary">
              <UIcon
                name="i-lucide-lock-keyhole"
                class="w-6 h-6"
              />
            </div>
            <div>
              <h1 class="text-lg font-bold text-highlighted">
                ZXRSA Admin Portal
              </h1>
              <p class="text-xs text-muted">
                Brute-Force Protected Control Panel
              </p>
            </div>
          </div>

          <UTooltip text="Dilindungi Enkripsi Sesi AES-GCM & Auto IP Lockout (Maks 5x Percobaan)">
            <UBadge
              color="success"
              variant="subtle"
              size="sm"
              icon="i-lucide-shield-check"
            >
              Protected
            </UBadge>
          </UTooltip>
        </div>
      </template>

      <!-- FORM LOGIN DENGAN VALIDATION BUBBLE OTOMATIS -->
      <UForm
        :schema="loginFormSchema"
        :state="formState"
        class="space-y-4"
        @submit="onSubmitLogin"
      >
        <UFormField
          label="Email Administrator"
          name="email"
          required
        >
          <UInput
            v-model="formState.email"
            type="email"
            placeholder="admin@zxrsa.store"
            icon="i-lucide-mail"
            class="w-full"
            autocomplete="username"
          />
        </UFormField>

        <UFormField
          label="Kata Sandi"
          name="password"
          required
        >
          <UInput
            v-model="formState.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••••••"
            icon="i-lucide-key-round"
            class="w-full"
            autocomplete="current-password"
          >
            <template #trailing>
              <UTooltip :text="showPassword ? 'Sembunyikan Sandi' : 'Lihat Sandi'">
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :padded="false"
                  @click="showPassword = !showPassword"
                />
              </UTooltip>
            </template>
          </UInput>
        </UFormField>

        <div class="pt-2">
          <UButton
            type="submit"
            color="primary"
            size="lg"
            block
            icon="i-lucide-log-in"
            :loading="isSubmitting"
            label="Masuk ke Dashboard"
          />
        </div>
      </UForm>

      <template #footer>
        <div class="flex items-center justify-between text-xs text-muted">
          <span>Tanpa Registrasi Publik</span>
          <span>Semua aktivitas tercatat di Audit Log</span>
        </div>
      </template>
    </UCard>
  </div>
</template>
