<!-- ==========================================================================
 FILE: app/components/storefront/PackageSelectorSection.vue
 DESKRIPSI: Komponen Lego Pilih Paket Vertical-Linear (Menampilkan Deskripsi
            Tiap Paket & Timer Kunci Stok 5 Menit).
=========================================================================== -->
<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { PublicProductCatalog, PublicVariantItem } from '~~/server/services/StorefrontRepository'

const props = defineProps<{
  catalog: PublicProductCatalog[]
}>()

const toast = useToast()

const selectedProductId = ref<string>(props.catalog[0]?.id || '')
const selectedVariant = ref<PublicVariantItem | null>(null)

watch(
  () => props.catalog,
  (newCatalog) => {
    if (!selectedProductId.value && newCatalog.length > 0 && newCatalog[0]) {
      selectedProductId.value = newCatalog[0].id
    }
  },
  { immediate: true }
)

const currentProduct = computed(() =>
  props.catalog.find(p => p.id === selectedProductId.value) || props.catalog[0] || null
)

function selectProduct(prodId: string) {
  selectedProductId.value = prodId
  selectedVariant.value = null
}

function selectVariantRow(variant: PublicVariantItem) {
  if (variant.available_stock <= 0) {
    toast.add({
      title: 'Stok Sedang Kosong',
      description: 'Maaf, stok untuk paket ini sedang habis. Silakan pilih varian paket lainnya.',
      color: 'warning',
      icon: 'i-lucide-package-x'
    })
    return
  }
  selectedVariant.value = variant
}

const checkoutFormSchema = z.object({
  customer_email: z
    .string()
    .trim()
    .email('Wajib masukkan alamat Gmail yang valid untuk pengiriman Invoice otomatis'),
  custom_gmail_account: z.string().optional()
})

type CheckoutSchema = z.output<typeof checkoutFormSchema>

const formState = reactive<CheckoutSchema>({
  customer_email: '',
  custom_gmail_account: ''
})

const isConfirmCheckoutOpen = ref(false)
const isCreatingInvoice = ref(false)

function onFormValidatedSubmit(_event: FormSubmitEvent<CheckoutSchema>) {
  if (!selectedVariant.value) {
    toast.add({ title: 'Pilih Paket', description: 'Klik salah satu baris paket terlebih dahulu.', color: 'warning' })
    return
  }

  if (selectedVariant.value.is_custom_gmail && !formState.custom_gmail_account?.includes('@')) {
    toast.add({
      title: 'Alamat Custom Gmail Wajib Diisi',
      description: 'Masukkan alamat Gmail Anda yang ingin dijadikan akun Premium.',
      color: 'error'
    })
    return
  }

  isConfirmCheckoutOpen.value = true
}

async function handleProceedToPayment() {
  if (!selectedVariant.value) return
  isCreatingInvoice.value = true

  try {
    const res = await $fetch('/api/store/checkout', {
      method: 'POST',
      body: {
        variant_id: selectedVariant.value.id,
        customer_email: formState.customer_email,
        custom_gmail_account: selectedVariant.value.is_custom_gmail
          ? formState.custom_gmail_account
          : null
      }
    })

    isConfirmCheckoutOpen.value = false

    toast.add({
      title: 'Invoice QRIS Berhasil Dibuat!',
      description: 'Mengalihkan Anda ke halaman pembayaran...',
      color: 'success',
      icon: 'i-lucide-qr-code'
    })

    await navigateTo(`/invoice/${res.invoiceToken}`)
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Gagal membuat invoice pembayaran.'
    toast.add({ title: 'Gagal Checkout', description: msg, color: 'error' })
  } finally {
    isCreatingInvoice.value = false
  }
}

function formatRupiah(val: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}
</script>

<template>
  <section
    id="pilih-paket"
    class="scroll-mt-20 py-16 sm:py-20"
  >
    <UContainer class="max-w-3xl space-y-10">
      <div class="text-center space-y-2.5">
        <UBadge
          color="primary"
          variant="subtle"
          size="sm"
          class="uppercase tracking-wider font-bold"
        >
          Konfigurasi Pesanan Instan
        </UBadge>
        <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-highlighted">
          Pilih Aplikasi & Paket Langganan
        </h2>
        <p class="text-xs sm:text-sm text-muted max-w-xl mx-auto">
          Ikuti langkah berurutan di bawah ini untuk memesan akun premium secara otomatis.
        </p>
      </div>

      <UCard
        v-if="!catalog.length"
        class="text-center py-10"
      >
        <p class="text-sm text-muted">
          Katalog aplikasi sedang diperbarui oleh Administrator. Silakan kembali beberapa saat lagi.
        </p>
      </UCard>

      <div
        v-else
        class="space-y-8"
      >
        <!-- LANGKAH 1: PILIH APLIKASI -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-muted">
              Langkah 1 — Pilih Aplikasi Premium
            </span>
            <span class="text-xs text-muted">
              {{ catalog.length }} Aplikasi Tersedia
            </span>
          </div>

          <div class="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden">
            <button
              v-for="prod in catalog"
              :key="prod.id"
              type="button"
              class="flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer shrink-0 focus:outline-none"
              :class="
                selectedProductId === prod.id
                  ? 'border-primary bg-primary/10 text-highlighted ring-2 ring-primary/30 shadow-xs'
                  : 'border-default bg-elevated/40 text-muted hover:text-highlighted hover:border-primary/40'
              "
              @click="selectProduct(prod.id)"
            >
              <CommonAppIconImage
                :src="prod.image_url"
                :alt="prod.name"
                size-class="w-9 h-9"
                rounded-class="rounded-lg"
              />

              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-sm text-highlighted">{{ prod.name }}</span>
                  <UBadge
                    v-if="prod.promo_badge"
                    color="warning"
                    size="xs"
                    variant="solid"
                  >
                    {{ prod.promo_badge }}
                  </UBadge>
                </div>
                <span class="text-[11px] text-muted block">
                  {{ prod.variants.length }} Pilihan Paket
                </span>
              </div>
            </button>
          </div>
        </div>

        <!-- LANGKAH 2: VERTICAL-LINEAR PACKAGE LIST (DENGAN DESKRIPSI TIAP PAKET) -->
        <div
          v-if="currentProduct"
          class="space-y-3"
        >
          <span class="text-xs font-bold uppercase tracking-wider text-muted block">
            Langkah 2 — Pilih Durasi & Varian Paket ({{ currentProduct.name }})
          </span>

          <div class="space-y-3">
            <div
              v-for="variant in currentProduct.variants"
              :key="variant.id"
              class="p-4 sm:p-5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              :class="[
                selectedVariant?.id === variant.id
                  ? 'border-primary bg-primary/5 ring-2 ring-primary shadow-sm'
                  : 'border-default bg-default hover:border-primary/50',
                variant.available_stock <= 0 ? 'opacity-55' : ''
              ]"
              @click="selectVariantRow(variant)"
            >
              <div class="flex items-start sm:items-center gap-3.5 min-w-0">
                <UIcon
                  :name="selectedVariant?.id === variant.id ? 'i-lucide-circle-check-big' : 'i-lucide-circle'"
                  class="w-5 h-5 shrink-0 mt-1 sm:mt-0 transition-colors"
                  :class="selectedVariant?.id === variant.id ? 'text-primary' : 'text-muted'"
                />

                <CommonAppIconImage
                  :src="currentProduct.image_url"
                  :alt="currentProduct.name"
                  size-class="w-10 h-10"
                  rounded-class="rounded-xl"
                />

                <div class="min-w-0 space-y-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="font-bold text-sm sm:text-base text-highlighted">
                      {{ variant.name }}
                    </h3>
                    <UBadge
                      :color="variant.is_custom_gmail ? 'warning' : (variant.available_stock > 0 ? 'success' : 'error')"
                      variant="subtle"
                      size="xs"
                    >
                      {{ variant.is_custom_gmail ? 'Upgrade Gmail Pribadi' : (variant.available_stock > 0 ? `Tersedia: ${variant.available_stock} Akun` : 'Stok Habis') }}
                    </UBadge>
                    <UBadge
                      v-if="variant.is_promo_active"
                      color="primary"
                      variant="solid"
                      size="xs"
                    >
                      PROMO AKTIF
                    </UBadge>
                  </div>

                  <!-- DESKRIPSI KHUSUS TIAP PAKET -->
                  <p
                    v-if="variant.description"
                    class="text-xs text-highlighted/85 leading-relaxed"
                  >
                    {{ variant.description }}
                  </p>

                  <p class="text-xs text-muted flex items-center gap-1.5">
                    <UIcon
                      name="i-lucide-calendar-clock"
                      class="w-3.5 h-3.5"
                    />
                    <span>Masa Aktif Garansi: <strong>{{ variant.duration }}</strong></span>
                  </p>
                </div>
              </div>

              <div class="flex sm:flex-col items-baseline sm:items-end justify-between border-t sm:border-t-0 pt-2.5 sm:pt-0 border-default shrink-0">
                <span class="text-xs text-muted sm:hidden">Harga Paket:</span>
                <div class="text-right">
                  <div
                    v-if="variant.is_promo_active"
                    class="text-xs text-muted line-through font-mono"
                  >
                    {{ formatRupiah(variant.original_price) }}
                  </div>
                  <div class="text-lg sm:text-xl font-extrabold font-mono text-primary">
                    {{ formatRupiah(variant.effective_price) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- LANGKAH 3: VERTICAL CHECKOUT FORM -->
        <div
          v-if="selectedVariant && currentProduct"
          class="space-y-3 pt-2"
        >
          <span class="text-xs font-bold uppercase tracking-wider text-muted block">
            Langkah 3 — Masukkan Alamat Gmail Penerima & Buat QRIS
          </span>

          <UCard class="border-2 border-primary/50 shadow-lg">
            <template #header>
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  <CommonAppIconImage
                    :src="currentProduct.image_url"
                    :alt="currentProduct.name"
                    size-class="w-8 h-8"
                    rounded-class="rounded-lg"
                  />
                  <div>
                    <h3 class="font-bold text-sm sm:text-base text-highlighted">
                      {{ currentProduct.name }} — {{ selectedVariant.name }}
                    </h3>
                    <p class="text-xs text-muted">
                      Durasi {{ selectedVariant.duration }} • Kunci Stok 10 Menit
                    </p>
                  </div>
                </div>
                <span class="font-mono font-extrabold text-lg text-primary">
                  {{ formatRupiah(selectedVariant.effective_price) }}
                </span>
              </div>
            </template>

            <UForm
              :schema="checkoutFormSchema"
              :state="formState"
              class="space-y-4"
              @submit="onFormValidatedSubmit"
            >
              <UFormField
                label="Alamat Gmail Penerima Invoice & Akun"
                name="customer_email"
                help="Invoice resmi dan kredensial akun dikirim otomatis ke alamat Gmail ini."
                required
              >
                <UInput
                  v-model="formState.customer_email"
                  type="email"
                  placeholder="namaanda@gmail.com"
                  icon="i-lucide-mail"
                  size="lg"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                v-if="selectedVariant.is_custom_gmail"
                label="Alamat Gmail yang Ingin Dijadikan Premium (Custom Gmail)"
                name="custom_gmail_account"
                help="Admin kami akan mengaktifkan fitur premium pada alamat Gmail ini setelah pembayaran lunas."
                required
              >
                <UInput
                  v-model="formState.custom_gmail_account"
                  type="email"
                  placeholder="akun.target.premium@gmail.com"
                  icon="i-lucide-sparkles"
                  size="lg"
                  class="w-full"
                />
              </UFormField>

              <div class="p-3.5 rounded-xl bg-elevated border border-default text-xs text-muted space-y-1.5">
                <div class="font-bold text-highlighted flex items-center gap-1.5">
                  <UIcon
                    name="i-lucide-shield-alert"
                    class="w-4 h-4 text-warning shrink-0"
                  />
                  <span>Ketentuan Pemakaian & Garansi {{ currentProduct.name }}:</span>
                </div>
                <p class="whitespace-pre-line leading-relaxed">
                  {{ currentProduct.usage_rules }}
                </p>
              </div>

              <UButton
                type="submit"
                color="primary"
                size="xl"
                block
                icon="i-lucide-qr-code"
                label="Lanjutkan ke Pembayaran QRIS Dinamis"
                class="font-bold"
                :loading="isCreatingInvoice"
              />
            </UForm>
          </UCard>
        </div>
      </div>

      <CommonConfirmDialog
        v-model:open="isConfirmCheckoutOpen"
        title="Konfirmasi Pemesanan & Kunci Stok (10 Menit)"
        :description="`Sistem akan mengunci stok paket '${selectedVariant?.name}' selama 10 menit dan mengirimkan Invoice ke '${formState.customer_email}'. Lanjutkan ke pembayaran QRIS?`"
        confirm-label="Ya, Buat QRIS Sekarang"
        confirm-color="primary"
        :loading="isCreatingInvoice"
        @confirm="handleProceedToPayment"
      />
    </UContainer>
  </section>
</template>
