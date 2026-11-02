<!-- ==========================================================================
 FILE: app/components/storefront/FaqSection.vue
 DESKRIPSI: Komponen Lego Pertanyaan Umum (FAQ) Dinamis dari Database D1
=========================================================================== -->
<script setup lang="ts">
import type { DbFaq } from '~~/server/types/database'

const props = defineProps<{
  faqs: DbFaq[]
}>()

const accordionItems = computed(() =>
  props.faqs.map(f => ({
    label: f.question,
    content: f.answer
  }))
)
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

      <UAccordion :items="accordionItems" />
    </UContainer>
  </section>
</template>
