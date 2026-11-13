<!-- ==========================================================================
 FILE: app/components/invoice/CredentialDeliverCard.vue
 DESKRIPSI: Dokumen Kredensial Akun Lunas Bergaya Swiss Editorial Grid
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
    title: `${label} Disalin`,
    description: `${value} berhasil disalin ke clipboard.`,
    color: 'success'
  })
}
</script>

<template>
  <div class="border border-[#111827] dark:border-[#FAFAFA] bg-[#FFFFFF] dark:bg-[#111111] divide-y divide-[#E5E7EB] dark:divide-[#262626]">
    <!-- HEADER STATUS LUNAS -->
    <div class="p-6 flex items-center justify-between gap-4">
      <div>
        <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280] dark:text-[#9CA3AF] block">
          Status Verifikasi Pembayaran
        </span>
        <h2 class="text-lg font-black tracking-tight text-[#111827] dark:text-[#FAFAFA] mt-0.5">
          Pembayaran Lunas Terverifikasi.
        </h2>
      </div>
      <span class="px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest bg-[#111827] text-[#FFFFFF] dark:bg-[#FAFAFA] dark:text-[#0A0A0A]">
        Delivered
      </span>
    </div>

    <!-- JIKA PAKET CUSTOM GMAIL -->
    <div
      v-if="isCustomGmail"
      class="p-6 space-y-2 text-xs leading-relaxed"
    >
      <template v-if="customGmailStatus === 'waiting_admin'">
        <div class="font-mono text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-[#FAFAFA]">
          Menunggu Aktivasi Manual Administrator
        </div>
        <p class="text-[#4B5563] dark:text-[#A3A3A3]">
          Pembayaran telah diterima. Saat ini Administrator sedang mengaktifkan paket pada akun Gmail Anda (<strong class="font-mono text-[#111827] dark:text-[#FAFAFA]">{{ customGmailTarget }}</strong>). Notifikasi selesai akan dikirimkan otomatis ke Gmail Anda.
        </p>
      </template>
      <template v-else>
        <div class="font-mono text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-[#FAFAFA]">
          Akun Custom Gmail Telah Aktif
        </div>
        <p class="text-[#4B5563] dark:text-[#A3A3A3]">
          Aktivasi premium untuk <strong class="font-mono text-[#111827] dark:text-[#FAFAFA]">{{ customGmailTarget }}</strong> telah selesai dikonfirmasi dan dikirim ke email Anda.
        </p>
      </template>
    </div>

    <!-- JIKA PAKET REGULER (EMAIL WAJIB, PASSWORD & LINK OPSIONAL) -->
    <div
      v-else-if="deliveredAccount"
      class="divide-y divide-[#E5E7EB] dark:divide-[#262626]"
    >
      <!-- 1. EMAIL / USERNAME -->
      <div class="p-5 flex items-center justify-between gap-4">
        <div class="min-w-0">
          <span class="font-mono text-[10px] uppercase tracking-widest text-[#6B7280] dark:text-[#737373] block">
            Email / Username
          </span>
          <strong class="font-mono text-sm text-[#111827] dark:text-[#FAFAFA] block truncate mt-0.5">
            {{ deliveredAccount.email }}
          </strong>
        </div>
        <button
          type="button"
          class="px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider border border-[#E5E7EB] dark:border-[#262626] hover:border-[#111827] dark:hover:border-[#FAFAFA] text-[#111827] dark:text-[#FAFAFA] shrink-0 cursor-pointer"
          @click="copyText('Email', deliveredAccount.email)"
        >
          Salin Email
        </button>
      </div>

      <!-- 2. PASSWORD AKUN (HANYA MUNCUL JIKA ADA PASSWORD) -->
      <div
        v-if="deliveredAccount.password && deliveredAccount.password.trim().length > 0"
        class="p-5 flex items-center justify-between gap-4"
      >
        <div class="min-w-0">
          <span class="font-mono text-[10px] uppercase tracking-widest text-[#6B7280] dark:text-[#737373] block">
            Kata Sandi / Password
          </span>
          <strong class="font-mono text-sm text-[#111827] dark:text-[#FAFAFA] block truncate mt-0.5">
            {{ deliveredAccount.password }}
          </strong>
        </div>
        <button
          type="button"
          class="px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider border border-[#E5E7EB] dark:border-[#262626] hover:border-[#111827] dark:hover:border-[#FAFAFA] text-[#111827] dark:text-[#FAFAFA] shrink-0 cursor-pointer"
          @click="copyText('Password', deliveredAccount.password)"
        >
          Salin Sandi
        </button>
      </div>

      <!-- 3. LINK GENERATOR / AKSES (HANYA MUNCUL JIKA ADA LINK) -->
      <div
        v-if="deliveredAccount.extraInfoLink"
        class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div class="min-w-0">
          <span class="font-mono text-[10px] uppercase tracking-widest text-[#6B7280] dark:text-[#737373] block">
            Tautan Akses / Link
          </span>
          <a
            :href="deliveredAccount.extraInfoLink"
            target="_blank"
            rel="noopener noreferrer"
            class="font-mono text-xs font-bold text-[#111827] dark:text-[#FAFAFA] underline underline-offset-4 break-all block mt-0.5"
          >
            {{ deliveredAccount.extraInfoLink }}
          </a>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            class="px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider border border-[#E5E7EB] dark:border-[#262626] hover:border-[#111827] dark:hover:border-[#FAFAFA] text-[#111827] dark:text-[#FAFAFA] cursor-pointer"
            @click="copyText('Link', deliveredAccount.extraInfoLink)"
          >
            Salin Link
          </button>
          <a
            :href="deliveredAccount.extraInfoLink"
            target="_blank"
            rel="noopener noreferrer"
            class="px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider bg-[#111827] text-[#FFFFFF] dark:bg-[#FAFAFA] dark:text-[#0A0A0A]"
          >
            Buka Link
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
