// ============================================================================
// FILE: nuxt.config.ts
// DESKRIPSI: Konfigurasi Utama Nuxt 4, Nuxt UI, dan Cloudflare Workers Preset
// ============================================================================
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    'nuxt-auth-utils',
    'nitro-cloudflare-dev'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Private Keys (Hanya bisa diakses di server/)
    encryptionKey: process.env.NUXT_ENCRYPTION_KEY || '',
    qrisStaticString: process.env.NUXT_QRIS_STATIC_STRING || '',
    webhookHmacSecret: process.env.NUXT_WEBHOOK_HMAC_SECRET || '',
    mailApiKey: process.env.NUXT_MAIL_API_KEY || '',
    mailFrom: process.env.NUXT_MAIL_FROM || '',
    cfAccessTeamDomain: process.env.NUXT_CF_ACCESS_TEAM_DOMAIN || '',
    cfAccessAud: process.env.NUXT_CF_ACCESS_AUD || '',

    // Public Keys (Bisa diakses di client & server)
    public: {
      mainDomain: process.env.NUXT_PUBLIC_MAIN_DOMAIN || 'localhost:3000',
      adminDomain: process.env.NUXT_PUBLIC_ADMIN_DOMAIN || 'admin.localhost:3000',
      whatsappNumber: process.env.NUXT_PUBLIC_WHATSAPP_NUMBER || '6281234567890'
    }
  },

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
