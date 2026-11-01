<!-- ==========================================================================
 FILE: app/components/common/FloatingWhatsApp.vue
 DESKRIPSI: Komponen Lego Floating Action Button (FAB) Telepon/WhatsApp CS
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
    <UTooltip
      text="Hubungi Admin via WhatsApp"
      :delay-duration="0"
    >
      <UButton
        :to="whatsappUrl"
        target="_blank"
        color="success"
        size="xl"
        icon="i-lucide-phone-call"
        label="Bantuan WA"
        class="rounded-full shadow-xl hover:scale-105 transition-transform font-bold"
      />
    </UTooltip>
  </div>
</template>
