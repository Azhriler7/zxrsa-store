<!-- ==========================================================================
 FILE: app/components/storefront/FaqSection.vue
 DESKRIPSI: Komponen Lego Pertanyaan Umum (FAQ) di Homepage Pembeli
=========================================================================== -->
<script setup lang="ts">
const faqItems = [
  {
    label: 'Bagaimana cara kerja pembayaran QRIS Dinamis di ZXRSA Store?',
    content: 'Saat Anda menekan tombol bayar, sistem membuat kode QRIS Dinamis yang sudah berisi nominal harga beserta kode unik otomatis. Anda cukup scan dari m-banking atau e-wallet (GoPay, Dana, OVO, ShopeePay, BCA, dll) tanpa perlu mengetik nominal lagi.'
  },
  {
    label: 'Berapa lama akun dikirim setelah saya membayar?',
    content: 'Untuk paket reguler (Stok Toko), akun akan langsung muncul di layar halaman Invoice Anda dan dikirim otomatis ke Gmail Anda detik itu juga setelah status pembayaran berubah menjadi LUNAS. Untuk paket Custom Gmail, Admin akan memproses aktivasi terlebih dahulu lalu mengirimkan email konfirmasi.'
  },
  {
    label: 'Bagaimana jika waktu pembayaran QRIS 10 menit habis (Expired)?',
    content: 'Jika lewat 10 menit belum dibayar, status invoice otomatis berubah menjadi EXPIRED dan stok akun dilepas kembali. Silakan buat pesanan baru di halaman Pilih Paket.'
  },
  {
    label: 'Apakah akun memiliki garansi?',
    content: 'Ya, seluruh akun bergaransi penuh sesuai durasi paket selama Anda mematuhi Aturan Pemakaian yang tertera di halaman Invoice dan Email.'
  }
]
</script>

<template>
  <section
    id="faq"
    class="scroll-mt-20 py-14"
  >
    <UContainer class="max-w-3xl space-y-6">
      <div class="text-center space-y-2">
        <h2 class="text-2xl sm:text-3xl font-extrabold text-highlighted">
          Pertanyaan yang Sering Diajukan (FAQ)
        </h2>
        <p class="text-sm text-muted">
          Informasi lengkap seputar transaksi, pengiriman akun otomatis, dan klaim garansi.
        </p>
      </div>

      <UAccordion :items="faqItems" />
    </UContainer>
  </section>
</template>
