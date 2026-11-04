// ============================================================================
// FILE: server/emails/InvoiceEmail.ts
// DESKRIPSI: Komponen Vue-Email dengan Dukungan Kolom Ke-3 "Link" (Optional)
// ============================================================================

import { defineComponent, h } from 'vue'
import type { PropType } from 'vue'
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
  Button,
  Link
} from '@vue-email/components'

export default defineComponent({
  name: 'InvoiceEmail',
  props: {
    invoiceId: { type: String, required: true },
    productName: { type: String, required: true },
    variantName: { type: String, required: true },
    duration: { type: String, required: true },
    totalAmountFormatted: { type: String, required: true },
    isCustomGmail: { type: Boolean, required: true },
    customGmailTarget: { type: [String, null] as PropType<string | null>, default: null },
    accountEmail: { type: [String, null] as PropType<string | null>, default: null },
    accountPassword: { type: [String, null] as PropType<string | null>, default: null },
    accountExtraLink: { type: [String, null] as PropType<string | null>, default: null },
    usageRules: { type: String, required: true },
    invoiceUrl: { type: String, required: true }
  },
  setup(props) {
    return () =>
      h(Html, { lang: 'id' }, () => [
        h(Head),
        h(Preview, null, () => `Invoice Resmi ${props.invoiceId} — ${props.productName} (${props.variantName})`),
        h(
          Body,
          {
            style: {
              backgroundColor: '#0f172a',
              fontFamily: 'sans-serif',
              padding: '24px 12px',
              color: '#f8fafc'
            }
          },
          () => [
            h(
              Container,
              {
                style: {
                  maxWidth: '560px',
                  margin: '0 auto',
                  backgroundColor: '#1e293b',
                  borderRadius: '12px',
                  padding: '28px',
                  border: '1px solid #334155'
                }
              },
              () => [
                h(Section, null, () => [
                  h(
                    Heading,
                    { as: 'h2', style: { color: '#38bdf8', margin: '0 0 4px 0', fontSize: '20px' } },
                    () => 'ZXRSA Store — Official Invoice'
                  ),
                  h(
                    Text,
                    { style: { color: '#94a3b8', margin: '0', fontSize: '13px' } },
                    () => `Nomor Transaksi: ${props.invoiceId} • Status: LUNAS`
                  )
                ]),

                h(Hr, { style: { borderColor: '#334155', margin: '20px 0' } }),

                h(Section, null, () => [
                  h(
                    Text,
                    { style: { margin: '0 0 8px 0', fontSize: '14px', color: '#e2e8f0' } },
                    () => `Aplikasi Premium: ${props.productName}`
                  ),
                  h(
                    Text,
                    { style: { margin: '0 0 8px 0', fontSize: '14px', color: '#e2e8f0' } },
                    () => `Paket & Durasi: ${props.variantName} (${props.duration})`
                  ),
                  h(
                    Text,
                    { style: { margin: '0', fontSize: '15px', color: '#4ade80', fontWeight: 'bold' } },
                    () => `Total Pembayaran: ${props.totalAmountFormatted}`
                  )
                ]),

                h(Hr, { style: { borderColor: '#334155', margin: '20px 0' } }),

                h(
                  Section,
                  {
                    style: {
                      backgroundColor: '#0f172a',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid #0284c7'
                    }
                  },
                  () =>
                    props.isCustomGmail
                      ? [
                          h(
                            Heading,
                            { as: 'h3', style: { color: '#38bdf8', margin: '0 0 8px 0', fontSize: '15px' } },
                            () => 'Akun Custom Gmail Anda Telah Diaktifkan!'
                          ),
                          h(
                            Text,
                            { style: { margin: '0', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' } },
                            () =>
                              `Paket premium untuk alamat Gmail Anda (${props.customGmailTarget || '-'}) telah selesai diproses dan dikonfirmasi oleh Admin kami.`
                          )
                        ]
                      : [
                          h(
                            Heading,
                            { as: 'h3', style: { color: '#38bdf8', margin: '0 0 10px 0', fontSize: '15px' } },
                            () => 'Detail Kredensial Akun Anda'
                          ),
                          h(
                            Text,
                            { style: { margin: '0 0 6px 0', fontSize: '13px', color: '#f8fafc', fontFamily: 'monospace' } },
                            () => `Email / Akun: ${props.accountEmail || '-'}`
                          ),
                          h(
                            Text,
                            { style: { margin: '0 0 6px 0', fontSize: '13px', color: '#f8fafc', fontFamily: 'monospace' } },
                            () => `Password: ${props.accountPassword || '-'}`
                          ),
                          ...(props.accountExtraLink
                            ? [
                                h(
                                  Text,
                                  { style: { margin: '6px 0 0 0', fontSize: '13px', color: '#38bdf8', fontFamily: 'monospace' } },
                                  () => [
                                    'Link: ',
                                    h(
                                      Link,
                                      { href: props.accountExtraLink || '#', style: { color: '#38bdf8', textDecoration: 'underline' } },
                                      () => props.accountExtraLink
                                    )
                                  ]
                                )
                              ]
                            : [])
                        ]
                ),

                h(Section, { style: { marginTop: '20px' } }, () => [
                  h(
                    Heading,
                    { as: 'h4', style: { color: '#fbbf24', margin: '0 0 6px 0', fontSize: '14px' } },
                    () => 'Aturan Pemakaian & Ketentuan Garansi:'
                  ),
                  h(
                    Text,
                    { style: { margin: '0', fontSize: '12px', color: '#cbd5e1', whiteSpace: 'pre-line', lineHeight: '1.6' } },
                    () => props.usageRules
                  )
                ]),

                h(Section, { style: { marginTop: '24px', textAlign: 'center' } }, () => [
                  h(
                    Button,
                    {
                      href: props.invoiceUrl,
                      style: {
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        padding: '12px 22px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        textDecoration: 'none'
                      }
                    },
                    () => 'Buka Halaman Invoice Resmi'
                  )
                ])
              ]
            )
          ]
        )
      ])
  }
})
