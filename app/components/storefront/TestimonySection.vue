<!-- ==========================================================================
 FILE: app/components/storefront/TestimonySection.vue
 DESKRIPSI: Komponen Lego Section Testimoni Pembeli
=========================================================================== -->
<script setup lang="ts">
const testimonies = [
  {
    name: 'Rizky Pratama',
    app: 'Alight Motion Pro (1 Tahun)',
    comment: 'Bayar pakai QRIS gak sampai 3 detik langsung berubah Lunas dan akun langsung masuk ke Gmail. Anti ribet!',
    rating: 5
  },
  {
    name: 'Nadia Putri',
    app: 'Wink VIP Premium',
    comment: 'Awalnya ragu, ternyata beneran otomatis tengah malam pun langsung dikirim akunnya. Fitur HD Enhancer jalan lancar.',
    rating: 5
  },
  {
    name: 'Dimas Anggara',
    app: 'CapCut Pro (Custom Gmail)',
    comment: 'Pesan paket Custom Gmail buat akun pribadi, adminnya gercep banget konfirmasinya dan langsung dapat email invoice resmi.',
    rating: 5
  }
]
</script>

<template>
  <section
    id="testimoni"
    class="scroll-mt-20 py-14 bg-elevated/40 border-y border-default"
  >
    <UContainer class="space-y-8">
      <div class="text-center max-w-xl mx-auto space-y-2">
        <UBadge
          color="success"
          variant="subtle"
        >
          100% Transaksi Terverifikasi
        </UBadge>
        <h2 class="text-2xl sm:text-3xl font-extrabold text-highlighted">
          Apa Kata Pelanggan Kami?
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UCard
          v-for="(item, idx) in testimonies"
          :key="idx"
          class="shadow-sm"
        >
          <div class="space-y-3">
            <div class="flex items-center gap-1 text-warning">
              <UIcon
                v-for="n in item.rating"
                :key="n"
                name="i-lucide-star"
                class="w-4 h-4 fill-current"
              />
            </div>
            <p class="text-sm text-highlighted leading-relaxed">
              "{{ item.comment }}"
            </p>
            <div class="pt-2 border-t border-default">
              <div class="font-bold text-sm text-highlighted">
                {{ item.name }}
              </div>
              <div class="text-xs text-primary">
                {{ item.app }}
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </UContainer>
  </section>
</template>
