<!-- ==========================================================================
 FILE: app/components/storefront/PackageSelectorSection.vue
 DESKRIPSI: Katalog & Konfigurasi Paket Bergaya Editorial Minimalis / Swiss Grid
            (Fokus Visual Produk Besar, Garis 1px Solid, Tanpa Drop-Shadow).
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

function getStartingPrice(prod: PublicProductCatalog): number {
  if (!prod.variants.length) return 0
  return Math.min(...prod.variants.map(v => v.effective_price))
}

function getTotalAvailableStock(prod: PublicProductCatalog): number {
  return prod.variants.reduce((acc, v) => acc + (v.available_stock || 0), 0)
}

function selectProduct(prodId: string) {
  selectedProductId.value = prodId
  selectedVariant.value = null
}

function selectVariantRow(variant: PublicVariantItem) {
  if (variant.available_stock <= 0) {
    toast.add({
      title: 'Stok Sedang Kosong',
      description: 'Maaf, stok untuk paket ini sedang habis. Silakan pilih varian paket lainnya.',
      color: 'warning'
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
      color: 'success'
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
    class="scroll-mt-14 w-full bg-[#FAFAFA] dark:bg-[#0A0A0A] border-b border-[#E5E7EB] dark:border-[#262626] py-16 sm:py-24"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-8 space-y-16">
      <!-- HEADER KATALOG EDITORIAL -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5E7EB] dark:border-[#262626] pb-6">
        <div class="space-y-2">
          <span class="font-mono text-xs uppercase tracking-[0.2em] text-[#6B7280] dark:text-[#737373] block">
            01 / Indeks Katalog &amp; Konfigurasi Lisensi
          </span>
          <h2 class="text-3xl sm:text-4xl font-black tracking-[-0.04em] text-[#111827] dark:text-[#FAFAFA]">
            Katalog Aplikasi Digital.
          </h2>
        </div>
        <p class="text-xs font-mono uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">
          {{ catalog.length }} Produk Aktif
        </p>
      </div>

      <div
        v-if="!catalog.length"
        class="p-12 border border-[#E5E7EB] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#111111] text-center text-xs font-mono uppercase tracking-widest text-[#6B7280]"
      >
        Katalog sedang diperbarui oleh Administrator.
      </div>

      <div
        v-else
        class="space-y-16"
      >
        <!-- BAGIAN 1: GRID VISUAL PRODUK BESAR & BERSIH TANPA BINGKAI TEBAL -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <article
            v-for="prod in catalog"
            :key="prod.id"
            class="group cursor-pointer flex flex-col justify-between space-y-4 focus:outline-none"
            @click="selectProduct(prod.id)"
          >
            <!-- KANVAS VISUAL PRODUK BESAR -->
            <div
              class="relative aspect-square w-full bg-[#FFFFFF] dark:bg-[#111111] border transition-colors flex items-center justify-center p-10"
              :class="
                selectedProductId === prod.id
                  ? 'border-[#111827] dark:border-[#FAFAFA]'
                  : 'border-[#E5E7EB] dark:border-[#262626] group-hover:border-[#9CA3AF] dark:group-hover:border-[#525252]'
              "
            >
              <!-- BADGE EDITORIAL POJOK KIRI ATAS -->
              <span
                v-if="prod.promo_badge"
                class="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-widest bg-[#111827] text-[#FFFFFF] dark:bg-[#FAFAFA] dark:text-[#0A0A0A]"
              >
                {{ prod.promo_badge }}
              </span>

              <!-- INDIKATOR TERPILIH POJOK KANAN ATAS -->
              <span
                v-if="selectedProductId === prod.id"
                class="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest border border-[#111827] dark:border-[#FAFAFA] text-[#111827] dark:text-[#FAFAFA]"
              >
                Aktif
              </span>

              <CommonAppIconImage
                :src="prod.image_url"
                :alt="prod.name"
                size-class="w-24 h-24 sm:w-28 sm:h-28 transition-transform duration-300 group-hover:scale-105"
                rounded-class="rounded-2xl"
              />
            </div>

            <!-- NAMA PRODUK, HARGA, & TOMBOL AKSI MINIMALIS DI BAWAH GAMBAR -->
            <div class="space-y-3 pt-1">
              <div class="flex items-baseline justify-between gap-2">
                <h3 class="text-base font-bold tracking-[-0.02em] text-[#111827] dark:text-[#FAFAFA]">
                  {{ prod.name }}
                </h3>
                <span class="font-mono text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                  {{ prod.variants.length }} Paket
                </span>
              </div>

              <div class="flex items-baseline justify-between border-t border-[#E5E7EB] dark:border-[#262626] pt-2.5 text-xs">
                <span class="text-[#6B7280] dark:text-[#737373] font-mono uppercase text-[10px] tracking-wider">
                  Mulai Dari
                </span>
                <span class="font-mono font-bold text-sm text-[#111827] dark:text-[#FAFAFA]">
                  {{ formatRupiah(getStartingPrice(prod)) }}
                </span>
              </div>

              <button
                type="button"
                class="w-full py-2.5 text-xs font-bold uppercase tracking-widest border transition-colors cursor-pointer"
                :class="
                  selectedProductId === prod.id
                    ? 'bg-[#111827] text-[#FFFFFF] border-[#111827] dark:bg-[#FAFAFA] dark:text-[#0A0A0A] dark:border-[#FAFAFA]'
                    : 'bg-transparent text-[#111827] dark:text-[#FAFAFA] border-[#E5E7EB] dark:border-[#262626] group-hover:border-[#111827] dark:group-hover:border-[#FAFAFA]'
                "
              >
                {{ selectedProductId === prod.id ? 'Produk Terpilih' : `Pilih Paket (${getTotalAvailableStock(prod)} Stok)` }}
              </button>
            </div>
          </article>
        </div>

        <!-- BAGIAN 2 & 3: SWISS GRID SPLIT (KIRI: DAFTAR VARIAN PAKET, KANAN: CHECKOUT) -->
        <div
          v-if="currentProduct"
          class="grid grid-cols-1 lg:grid-cols-12 border-t border-[#E5E7EB] dark:border-[#262626] pt-12 gap-12"
        >
          <!-- KOLOM KIRI (7 KOLOM): PILIHAN VARIAN PAKET -->
          <div class="lg:col-span-7 space-y-6">
            <div class="space-y-1">
              <span class="font-mono text-[11px] uppercase tracking-[0.2em] text-[#6B7280] dark:text-[#737373] block">
                Tahap 02 — Spesifikasi Varian
              </span>
              <h3 class="text-2xl font-black tracking-[-0.03em] text-[#111827] dark:text-[#FAFAFA]">
                Pilih Paket {{ currentProduct.name }}
              </h3>
            </div>

            <div class="border-t border-[#E5E7EB] dark:border-[#262626] divide-y divide-[#E5E7EB] dark:divide-[#262626]">
              <div
                v-for="variant in currentProduct.variants"
                :key="variant.id"
                class="py-5 px-4 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                :class="[
                  selectedVariant?.id === variant.id
                    ? 'bg-[#FFFFFF] dark:bg-[#111111] border-l-2 border-l-[#111827] dark:border-l-[#FAFAFA]'
                    : 'hover:bg-[#FFFFFF]/60 dark:hover:bg-[#111111]/60',
                  variant.available_stock <= 0 ? 'opacity-45' : ''
                ]"
                @click="selectVariantRow(variant)"
              >
                <div class="space-y-1.5 min-w-0">
                  <div class="flex flex-wrap items-center gap-2.5">
                    <span class="text-base font-bold tracking-tight text-[#111827] dark:text-[#FAFAFA]">
                      {{ variant.name }}
                    </span>
                    <span class="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 border border-[#E5E7EB] dark:border-[#262626] text-[#4B5563] dark:text-[#A3A3A3]">
                      {{ variant.duration }}
                    </span>
                    <span
                      class="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 border"
                      :class="
                        variant.available_stock > 0
                          ? 'border-[#E5E7EB] dark:border-[#262626] text-[#111827] dark:text-[#FAFAFA]'
                          : 'border-red-500/40 text-red-600 dark:text-red-400'
                      "
                    >
                      {{ variant.is_custom_gmail ? 'Upgrade Gmail Pribadi' : (variant.available_stock > 0 ? `Stok: ${variant.available_stock}` : 'Habis') }}
                    </span>
                    <span
                      v-if="variant.is_promo_active"
                      class="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 bg-[#111827] text-[#FFFFFF] dark:bg-[#FAFAFA] dark:text-[#0A0A0A]"
                    >
                      Promo
                    </span>
                  </div>

                  <p
                    v-if="variant.description"
                    class="text-xs text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed max-w-xl"
                  >
                    {{ variant.description }}
                  </p>
                </div>

                <div class="flex sm:flex-col items-baseline sm:items-end justify-between shrink-0">
                  <span
                    v-if="variant.is_promo_active"
                    class="font-mono text-xs text-[#6B7280] line-through"
                  >
                    {{ formatRupiah(variant.original_price) }}
                  </span>
                  <span class="font-mono text-lg font-extrabold text-[#111827] dark:text-[#FAFAFA]">
                    {{ formatRupiah(variant.effective_price) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- KOLOM KANAN (5 KOLOM): PANEL CHECKOUT SWISS GRID -->
          <div class="lg:col-span-5">
            <div class="border border-[#E5E7EB] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#111111] p-6 sm:p-8 space-y-6">
              <div class="border-b border-[#E5E7EB] dark:border-[#262626] pb-4 space-y-1">
                <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280] dark:text-[#737373] block">
                  Tahap 03 — Konfigurasi Pengiriman
                </span>
                <h3 class="text-xl font-bold tracking-[-0.02em] text-[#111827] dark:text-[#FAFAFA]">
                  Ringkasan &amp; Checkout
                </h3>
              </div>

              <div
                v-if="!selectedVariant"
                class="py-12 text-center space-y-2"
              >
                <p class="text-xs font-mono uppercase tracking-widest text-[#6B7280] dark:text-[#737373]">
                  Belum Ada Varian Dipilih
                </p>
                <p class="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                  Pilih salah satu baris varian paket {{ currentProduct.name }} di sebelah kiri untuk melanjutkan pemesanan.
                </p>
              </div>

              <div
                v-else
                class="space-y-6"
              >
                <div class="space-y-2 pb-4 border-b border-[#E5E7EB] dark:border-[#262626] text-xs">
                  <div class="flex justify-between">
                    <span class="text-[#6B7280] dark:text-[#9CA3AF]">Aplikasi</span>
                    <span class="font-bold text-[#111827] dark:text-[#FAFAFA]">{{ currentProduct.name }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-[#6B7280] dark:text-[#9CA3AF]">Varian &amp; Durasi</span>
                    <span class="font-mono text-[#111827] dark:text-[#FAFAFA]">{{ selectedVariant.name }} ({{ selectedVariant.duration }})</span>
                  </div>
                  <div class="flex justify-between pt-2 border-t border-[#E5E7EB] dark:border-[#262626] text-sm">
                    <span class="font-bold text-[#111827] dark:text-[#FAFAFA]">Harga Paket</span>
                    <span class="font-mono font-extrabold text-[#111827] dark:text-[#FAFAFA]">{{ formatRupiah(selectedVariant.effective_price) }}</span>
                  </div>
                </div>

                <UForm
                  :schema="checkoutFormSchema"
                  :state="formState"
                  class="space-y-5"
                  @submit="onFormValidatedSubmit"
                >
                  <UFormField
                    label="Alamat Gmail Penerima Invoice & Akun"
                    name="customer_email"
                    help="Kredensial akun dan invoice resmi dikirim otomatis ke Gmail ini."
                    required
                  >
                    <UInput
                      v-model="formState.customer_email"
                      type="email"
                      placeholder="namaanda@gmail.com"
                      size="lg"
                      class="w-full font-mono"
                    />
                  </UFormField>

                  <UFormField
                    v-if="selectedVariant.is_custom_gmail"
                    label="Alamat Gmail Target Upgrade (Custom Gmail)"
                    name="custom_gmail_account"
                    help="Masukkan alamat Gmail pribadi yang ingin diaktifkan fitur premiumnya."
                    required
                  >
                    <UInput
                      v-model="formState.custom_gmail_account"
                      type="email"
                      placeholder="target.premium@gmail.com"
                      size="lg"
                      class="w-full font-mono"
                    />
                  </UFormField>

                  <button
                    type="submit"
                    :disabled="isCreatingInvoice"
                    class="w-full py-4 px-6 text-xs font-bold uppercase tracking-[0.14em] bg-[#111827] text-[#FFFFFF] dark:bg-[#FAFAFA] dark:text-[#0A0A0A] hover:opacity-85 transition-opacity disabled:opacity-50 cursor-pointer"
                  >
                    {{ isCreatingInvoice ? 'Memproses Invoice...' : 'Lanjutkan Pembayaran QRIS' }}
                  </button>
                </UForm>
              </div>
            </div>
          </div>
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
    </div>
  </section>
</template>
