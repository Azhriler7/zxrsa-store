<!-- ==========================================================================
 FILE: app/components/common/FloatingWhatsApp.vue
 DESKRIPSI: Tombol Bantuan WhatsApp Minimalis Bergaya Swiss Editorial
=========================================================================== -->
<script setup lang="ts">
const config = useRuntimeConfig()

const whatsappUrl = computed(() => {
  const rawPhone = String(config.public.whatsappNumber || '')
  const phone = rawPhone.replace(/[^0-9]/g, '')
  const text = encodeURIComponent('Halo Admin ZXRSA Store, saya butuh bantuan terkait pembelian akun premium.')
  return `https://wa.me/${phone}?text=${text}`
})
</script>

<template>
  <div class="fixed bottom-6 right-6 z-50">
    <a
      :href="whatsappUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-block px-4 py-2.5 text-[11px] font-mono font-bold uppercase tracking-[0.15em] bg-[#111827] text-[#FFFFFF] dark:bg-[#FAFAFA] dark:text-[#0A0A0A] border border-[#111827] dark:border-[#FAFAFA] hover:opacity-85 transition-opacity"
    >
      Bantuan WA
    </a>
  </div>
</template>
