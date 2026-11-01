<!-- ==========================================================================
 FILE: server/emails/InvoiceEmail.vue
 DESKRIPSI: Template Email Invoice Kustom menggunakan @vue-email/components
=========================================================================== -->
<script setup lang="ts">
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
  Button
} from '@vue-email/components'

defineProps<{
  invoiceId: string
  productName: string
  variantName: string
  duration: string
  totalAmountFormatted: string
  isCustomGmail: boolean
  customGmailTarget?: string | null
  accountEmail?: string | null
  accountPassword?: string | null
  accountExtraLink?: string | null
  usageRules: string
  invoiceUrl: string
}>()
</script>

<template>
  <Html lang="id">
    <Head />
    <Preview>Invoice Resmi {{ invoiceId }} — {{ productName }} ({{ variantName }})</Preview>

    <Body :style="{ backgroundColor: '#0f172a', fontFamily: 'sans-serif', padding: '24px 12px', color: '#f8fafc' }">
      <Container :style="{ maxWidth: '560px', margin: '0 auto', backgroundColor: '#1e293b', borderRadius: '12px', padding: '28px', border: '1px solid #334155' }">
        <!-- HEADER EMAIL -->
        <Section>
          <Heading
            as="h2"
            :style="{ color: '#38bdf8', margin: '0 0 4px 0', fontSize: '20px' }"
          >
            ZXRSA Store — Official Invoice
          </Heading>
          <Text :style="{ color: '#94a3b8', margin: '0', fontSize: '13px' }">
            Nomor Transaksi: <strong>{{ invoiceId }}</strong> • Status: <strong style="color: #4ade80;">LUNAS</strong>
          </Text>
        </Section>

        <Hr :style="{ borderColor: '#334155', margin: '20px 0' }" />

        <!-- DETAIL PRODUK & HARGA -->
        <Section>
          <Text :style="{ margin: '0 0 8px 0', fontSize: '14px', color: '#e2e8f0' }">
            <strong>Aplikasi Premium:</strong> {{ productName }}
          </Text>
          <Text :style="{ margin: '0 0 8px 0', fontSize: '14px', color: '#e2e8f0' }">
            <strong>Paket & Durasi:</strong> {{ variantName }} ({{ duration }})
          </Text>
          <Text :style="{ margin: '0', fontSize: '15px', color: '#4ade80' }">
            <strong>Total Pembayaran:</strong> {{ totalAmountFormatted }}
          </Text>
        </Section>

        <Hr :style="{ borderColor: '#334155', margin: '20px 0' }" />

        <!-- KOTAK KREDENSIAL AKUN (PAKET BIASA) ATAU KONFIRMASI CUSTOM GMAIL -->
        <Section
          :style="{
            backgroundColor: '#0f172a',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #0284c7'
          }"
        >
          <template v-if="isCustomGmail">
            <Heading
              as="h3"
              :style="{ color: '#38bdf8', margin: '0 0 8px 0', fontSize: '15px' }"
            >
              ✅ Akun Custom Gmail Anda Telah Diaktifkan!
            </Heading>
            <Text :style="{ margin: '0', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }">
              Paket premium untuk alamat Gmail Anda (<strong>{{ customGmailTarget }}</strong>) telah selesai diproses dan dikonfirmasi oleh Admin kami. Silakan langsung buka aplikasi dan nikmati fitur premiumnya.
            </Text>
          </template>

          <template v-else>
            <Heading
              as="h3"
              :style="{ color: '#38bdf8', margin: '0 0 10px 0', fontSize: '15px' }"
            >
              🔐 Detail Kredensial Akun Anda
            </Heading>
            <Text :style="{ margin: '0 0 6px 0', fontSize: '13px', color: '#f8fafc', fontFamily: 'monospace' }">
              <strong>Email / Akun:</strong> {{ accountEmail }}
            </Text>
            <Text :style="{ margin: '0 0 6px 0', fontSize: '13px', color: '#f8fafc', fontFamily: 'monospace' }">
              <strong>Password:</strong> {{ accountPassword }}
            </Text>
            <Text
              v-if="accountExtraLink"
              :style="{ margin: '0', fontSize: '13px', color: '#38bdf8', fontFamily: 'monospace' }"
            >
              <strong>Link Akses OTP/Inbox:</strong> {{ accountExtraLink }}
            </Text>
          </template>
        </Section>

        <!-- ATURAN PEMAKAIAN & GARANSI DARI ADMIN CRUD -->
        <Section :style="{ marginTop: '20px' }">
          <Heading
            as="h4"
            :style="{ color: '#fbbf24', margin: '0 0 6px 0', fontSize: '14px' }"
          >
            ⚠️ Aturan Pemakaian & Ketentuan Garansi:
          </Heading>
          <Text :style="{ margin: '0', fontSize: '12px', color: '#cbd5e1', whiteSpace: 'pre-line', lineHeight: '1.6' }">
            {{ usageRules }}
          </Text>
        </Section>

        <!-- TOMBOL LIHAT INVOICE DI WEB -->
        <Section :style="{ marginTop: '24px', textAlign: 'center' }">
          <Button
            :href="invoiceUrl"
            :style="{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              padding: '12px 22px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 'bold',
              textDecoration: 'none'
            }"
          >
            Buka Halaman Invoice Resmi
          </Button>
        </Section>
      </Container>
    </Body>
  </Html>
</template>
