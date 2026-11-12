<!-- ==========================================================================
 FILE: app/components/invoice/CredentialDeliverCard.vue
 DESKRIPSI: Komponen Lego Kotak Detail Akun (Email Wajib, Password & Link
            Tampil Otomatis Sesuai Ketersediaan di Stok).
=========================================================================== -->
<script setup lang="ts">
defineProps<{
  isCustomGmail: boolean
  customGmailStatus: 'not_applicable' | 'waiting_admin' | 'completed'
  customGmailTarget: string | null
  deliveredAccount: {
    email: string
    password: string
    extraInfoLink: string | null
  } | null
}>()

const toast = useToast()

async function copyText(label: string, value: string) {
  await navigator.clipboard.writeText(value)
  toast.add({
    title: `${label} Disalin!`,
    description: `${value} berhasil disalin ke clipboard.`,
    color: 'success',
    icon: 'i-lucide-copy-check'
  })
}
</script>

<template>
  <UCard class="border-2 border-success/50 bg-success/5">
    <template #header>
      <div class="flex items-center gap-2 text-success font-bold">
        <UIcon
          name="i-lucide-party-popper"
          class="w-5 h-5"
        />
        <span>Pembayaran Lunas Terverifikasi!</span>
      </div>
    </template>

    <div
      v-if="isCustomGmail"
      class="space-y-3 text-sm"
    >
      <div
        v-if="customGmailStatus === 'waiting_admin'"
        class="p-4 rounded-lg bg-warning/10 border border-warning/30 space-y-2"
      >
        <div class="font-bold text-warning flex items-center gap-2">
          <UIcon
            name="i-lucide-hourglass"
            class="w-5 h-5"
          />
          <span>Mohon Tunggu Admin Memproses Pesanan Custom Gmail Anda</span>
        </div>
        <p class="text-xs text-highlighted leading-relaxed">
          Pembayaran Anda telah kami terima. Saat ini Admin sedang memproses upgrade Premium untuk akun Gmail Anda (<strong>{{ customGmailTarget }}</strong>). Begitu selesai dikonfirmasi oleh Admin, Invoice resmi akan langsung terkirim ke Gmail Anda.
        </p>
      </div>

      <div
        v-else
        class="p-4 rounded-lg bg-success/10 border border-success/30 space-y-2"
      >
        <div class="font-bold text-success flex items-center gap-2">
          <UIcon
            name="i-lucide-check-check"
            class="w-5 h-5"
          />
          <span>Akun Custom Gmail Anda Sudah Aktif!</span>
        </div>
        <p class="text-xs text-highlighted">
          Upgrade premium untuk <strong>{{ customGmailTarget }}</strong> telah selesai dikonfirmasi oleh Admin dan dikirim ke email Anda.
        </p>
      </div>
    </div>

    <div
      v-else-if="deliveredAccount"
      class="space-y-3"
    >
      <p class="text-xs text-muted">
        Salin kredensial akun di bawah ini (juga telah dikirim otomatis ke Gmail Anda):
      </p>

      <!-- 1. EMAIL / USERNAME -->
      <div class="p-3 rounded-lg bg-default border border-default flex items-center justify-between gap-2">
        <div class="font-mono text-xs truncate">
          <span class="text-muted block">Email / Username:</span>
          <strong class="text-sm text-highlighted">{{ deliveredAccount.email }}</strong>
        </div>
        <UButton
          size="xs"
          color="primary"
          variant="subtle"
          icon="i-lucide-copy"
          label="Salin Email"
          @click="copyText('Email', deliveredAccount.email)"
        />
      </div>

      <!-- 2. PASSWORD AKUN (OPSIONAL: HANYA MUNCUL JIKA ADA PASSWORD DI STOK) -->
      <div
        v-if="deliveredAccount.password && deliveredAccount.password.trim().length > 0"
        class="p-3 rounded-lg bg-default border border-default flex items-center justify-between gap-2"
      >
        <div class="font-mono text-xs truncate">
          <span class="text-muted block">Password Akun:</span>
          <strong class="text-sm text-highlighted">{{ deliveredAccount.password }}</strong>
        </div>
        <UButton
          size="xs"
          color="primary"
          variant="subtle"
          icon="i-lucide-copy"
          label="Salin Sandi"
          @click="copyText('Password', deliveredAccount.password)"
        />
      </div>

      <!-- 3. LINK (OPSIONAL: HANYA MUNCUL JIKA ADA LINK DI STOK) -->
      <div
        v-if="deliveredAccount.extraInfoLink"
        class="p-3 rounded-lg bg-default border border-primary/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
      >
        <div class="font-mono text-xs min-w-0">
          <span class="text-muted block">Link:</span>
          <a
            :href="deliveredAccount.extraInfoLink"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm font-bold text-primary underline break-all"
          >
            {{ deliveredAccount.extraInfoLink }}
          </a>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <UButton
            size="xs"
            color="neutral"
            variant="subtle"
            icon="i-lucide-copy"
            label="Salin Link"
            @click="copyText('Link', deliveredAccount.extraInfoLink)"
          />
          <UButton
            size="xs"
            color="primary"
            variant="solid"
            icon="i-lucide-external-link"
            label="Buka Link"
            :to="deliveredAccount.extraInfoLink"
            target="_blank"
          />
        </div>
      </div>
    </div>
  </UCard>
</template>
