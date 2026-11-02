<!-- ==========================================================================
 FILE: app/components/storefront/PackageSelectorSection.vue
 DESKRIPSI: Komponen Lego Pilih Paket (Menampilkan Icon Aplikasi dengan
            USkeleton Berdenyut & Default Placeholder Otomatis).
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

const currentProduct = computed(() =>
  props.catalog.find(p => p.id === selectedProductId.value) || props.catalog[0] || null
)

function selectProduct(prodId: string) {
  selectedProductId.value = prodId
  selectedVariant.value = null
}

function selectVariantCard(variant: PublicVariantItem) {
  if (variant.available_stock <= 0) {
    toast.add({
      title: 'Stok Habis',
      description: 'Maaf, stok untuk paket ini sedang kosong. Silakan pilih paket lain.',
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
    toast.add({ title: 'Pilih Paket', description: 'Klik salah satu kartu paket terlebih dahulu.', color: 'warning' })
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
    class="scroll-mt-20 py-14"
  >
    <UContainer class="space-y-8">
      <!-- JUDUL SECTION -->
      <div class="text-center max-w-2xl mx-auto space-y-2">
        <UBadge
          color="primary"
          variant="subtle"
          size="md"
        >
          Katalog Resmi & Instan
        </UBadge>
        <h2 class="text-2xl sm:text-3xl font-extrabold text-highlighted">
          Pilih Aplikasi & Paket Langganan
        </h2>
        <p class="text-sm text-muted">
          Klik aplikasi yang Anda inginkan, pilih kartu paket durasi, lalu masukkan Gmail Anda untuk menerima Invoice & Akun secara otomatis.
        </p>
      </div>

      <!-- STEP 1: TAB PILIH APLIKASI DENGAN USKELETON PULSE & DEFAULT ICON -->
      <div class="flex flex-wrap items-center justify-center gap-3">
        <button
          v-for="prod in catalog"
          :key="prod.id"
          type="button"
          class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border font-bold text-sm transition-all cursor-pointer focus:outline-none"
          :class="
            selectedProductId === prod.id
              ? 'bg-primary text-white border-primary shadow-md scale-[1.02]'
              : 'bg-elevated/60 text-highlighted border-default hover:border-primary/50'
          "
          @click="selectProduct(prod.id)"
        >
          <CommonAppIconImage
            :src="prod.image_url"
            :alt="prod.name"
            size-class="w-7 h-7"
            rounded-class="rounded-lg"
          />

          <span>{{ prod.name }}</span>

          <UBadge
            v-if="prod.promo_badge"
            color="warning"
            size="xs"
            variant="solid"
          >
            {{ prod.promo_badge }}
          </UBadge>
        </button>
      </div>

      <!-- STEP 2: GRID KARTU PAKET DARI APLIKASI TERPILIH -->
      <div
        v-if="currentProduct"
        class="space-y-6"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <UCard
            v-for="variant in currentProduct.variants"
            :key="variant.id"
            class="cursor-pointer transition-all"
            :class="[
              selectedVariant?.id === variant.id
                ? 'ring-2 ring-primary bg-primary/5 shadow-lg'
                : 'hover:border-primary/50',
              variant.available_stock <= 0 ? 'opacity-60' : ''
            ]"
            @click="selectVariantCard(variant)"
          >
            <div class="space-y-4">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  <CommonAppIconImage
                    :src="currentProduct.image_url"
                    :alt="currentProduct.name"
                    size-class="w-10 h-10"
                    rounded-class="rounded-xl"
                  />
                  <div>
                    <h3 class="font-bold text-base text-highlighted">
                      {{ variant.name }}
                    </h3>
                    <span class="text-xs text-muted flex items-center gap-1 mt-0.5">
                      <UIcon
                        name="i-lucide-clock"
                        class="w-3.5 h-3.5"
                      />
                      Durasi: {{ variant.duration }}
                    </span>
                  </div>
                </div>

                <UBadge
                  :color="variant.is_custom_gmail ? 'warning' : (variant.available_stock > 0 ? 'success' : 'error')"
                  variant="subtle"
                  size="sm"
                >
                  {{ variant.is_custom_gmail ? 'Custom Gmail' : (variant.available_stock > 0 ? `Stok: ${variant.available_stock}` : 'Habis') }}
                </UBadge>
              </div>

              <div class="pt-2 border-t border-default flex items-baseline justify-between">
                <div>
                  <div
                    v-if="variant.is_promo_active"
                    class="text-xs text-muted line-through"
                  >
                    {{ formatRupiah(variant.original_price) }}
                  </div>
                  <div class="text-2xl font-extrabold text-primary">
                    {{ formatRupiah(variant.effective_price) }}
                  </div>
                </div>

                <UIcon
                  :name="selectedVariant?.id === variant.id ? 'i-lucide-check-circle-2' : 'i-lucide-circle'"
                  class="w-6 h-6"
                  :class="selectedVariant?.id === variant.id ? 'text-primary' : 'text-muted'"
                />
              </div>
            </div>
          </UCard>
        </div>

        <!-- STEP 3: FORM INPUT GMAIL PEMBELI -->
        <UCard
          v-if="selectedVariant"
          class="max-w-2xl mx-auto border-2 border-primary/40 shadow-xl"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="p-2 rounded-lg bg-primary/10 text-primary">
                  <UIcon
                    name="i-lucide-mail-plus"
                    class="w-5 h-5"
                  />
                </div>
                <div>
                  <h3 class="font-bold text-base text-highlighted">
                    Lengkapi Form Pengiriman Invoice
                  </h3>
                  <p class="text-xs text-muted">
                    Paket Terpilih: <strong>{{ currentProduct.name }} — {{ selectedVariant.name }}</strong>
                  </p>
                </div>
              </div>
              <span class="font-mono font-bold text-lg text-primary">
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
              help="Invoice resmi dan detail akun akan dikirim otomatis ke alamat Gmail ini."
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

            <div class="p-3 rounded-lg bg-elevated text-xs text-muted space-y-1">
              <div class="font-semibold text-highlighted flex items-center gap-1.5">
                <UIcon
                  name="i-lucide-shield-alert"
                  class="w-4 h-4 text-warning"
                />
                Aturan Pemakaian {{ currentProduct.name }}:
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
              label="Lanjut ke Halaman Pembayaran QRIS"
              :loading="isCreatingInvoice"
            />
          </UForm>
        </UCard>
      </div>

      <CommonConfirmDialog
        v-model:open="isConfirmCheckoutOpen"
        title="Konfirmasi Pemesanan & Kunci Stok"
        :description="`Sistem akan mengunci stok paket '${selectedVariant?.name}' selama 10 menit dan mengirimkan Invoice ke '${formState.customer_email}'. Lanjutkan ke pembayaran QRIS?`"
        confirm-label="Ya, Buat QRIS Sekarang"
        confirm-color="primary"
        :loading="isCreatingInvoice"
        @confirm="handleProceedToPayment"
      />
    </UContainer>
  </section>
</template>
