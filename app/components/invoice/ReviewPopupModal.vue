<!-- ==========================================================================
 FILE: app/components/invoice/ReviewPopupModal.vue
 DESKRIPSI: Pop-up Modal Otomatis Setelah Pembeli Lunas untuk Memberikan
            Rating Bintang & Ulasan yang Masuk ke Halaman Admin.
=========================================================================== -->
<script setup lang="ts">
const props = defineProps<{
  invoiceToken: string
  productName: string
  variantName: string
}>()

const isOpen = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ submitted: [] }>()
const toast = useToast()

const rating = ref(5)
const comment = ref('')
const isSubmitting = ref(false)

async function submitReview() {
  if (comment.value.trim().length < 5) {
    toast.add({
      title: 'Ulasan Terlalu Singkat',
      description: 'Mohon tulis pengalaman singkat Anda minimal 5 karakter.',
      color: 'warning'
    })
    return
  }

  isSubmitting.value = true
  try {
    await $fetch('/api/store/review', {
      method: 'POST',
      body: {
        invoice_token: props.invoiceToken,
        rating: rating.value,
        comment: comment.value
      }
    })

    toast.add({
      title: 'Terima Kasih atas Ulasan Anda!',
      description: 'Ulasan Anda telah dikirim dan akan ditampilkan setelah diverifikasi Admin.',
      color: 'success',
      icon: 'i-lucide-heart-handshake'
    })

    isOpen.value = false
    emit('submitted')
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Gagal mengirim ulasan.'
    toast.add({ title: 'Kesalahan', description: msg, color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Beri Penilaian Transaksi Anda"
    :description="`Terima kasih telah membeli ${productName} (${variantName}). Bagaimana pengalaman transaksi Anda?`"
  >
    <template #body>
      <div class="space-y-5 text-center">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted">
            Klik Bintang Penilaian ({{ rating }} / 5)
          </p>
          <div class="flex justify-center">
            <CommonStarRating
              v-model="rating"
              interactive
              size="lg"
            />
          </div>
        </div>

        <UFormField
          label="Tulis Ulasan Singkat Anda"
          class="text-left"
          required
        >
          <UTextarea
            v-model="comment"
            :rows="3"
            class="w-full"
            placeholder="Contoh: Proses pembayaran QRIS cepat banget, akun langsung masuk ke Gmail!"
          />
          <template #help>
            Alamat Gmail Anda akan disamarkan secara otomatis demi privasi (contoh: <code>abc***@gmail.com</code>).
          </template>
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton
          color="neutral"
          variant="ghost"
          label="Nanti Saja"
          @click="isOpen = false"
        />
        <UButton
          color="primary"
          icon="i-lucide-send"
          label="Kirim Ulasan"
          :loading="isSubmitting"
          @click="submitReview"
        />
      </div>
    </template>
  </UModal>
</template>
