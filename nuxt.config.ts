// ============================================================================
// FILE: nuxt.config.ts
// DESKRIPSI: Konfigurasi Utama Nuxt 4, Nuxt UI, dan Cloudflare Workers Preset
// ============================================================================
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    'nuxt-auth-utils',
    'nitro-cloudflare-dev'
  ],

  devtools: {
    enabled: false
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    appSecret: process.env.NUXT_APP_SECRET || '',
    encryptionKey: process.env.NUXT_ENCRYPTION_KEY || '',
    qrisStaticString: process.env.NUXT_QRIS_STATIC_STRING || '',
    webhookHmacSecret: process.env.NUXT_WEBHOOK_HMAC_SECRET || '',
    mutasikuApiKey: process.env.NUXT_MUTASIKU_API_KEY || '',
    payhookSecret: process.env.NUXT_PAYHOOK_SECRET || '',
    mailApiKey: process.env.NUXT_MAIL_API_KEY || '',
    mailFrom: process.env.NUXT_MAIL_FROM || '',

    session: {
      maxAge: 60 * 60 * 12,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NUXT_PUBLIC_MAIN_DOMAIN !== 'localhost:3000'
      }
    },

    // Public Keys (Bisa diakses di client & server)
    public: {
      mainDomain: process.env.NUXT_PUBLIC_MAIN_DOMAIN || 'localhost:3000',
      adminDomain: process.env.NUXT_PUBLIC_ADMIN_DOMAIN || 'admin.localhost:3000',
      whatsappNumber: process.env.NUXT_PUBLIC_WHATSAPP_NUMBER || '6281234567890',
      githubIconRepo: process.env.NUXT_PUBLIC_GITHUB_ICON_REPO || 'Azhriler7/Azhriler7-my-public-assets',
      githubIconFolder: process.env.NUXT_PUBLIC_GITHUB_ICON_FOLDER || 'zxrsa-store-asset'
    }
  },

  // PENTING: Jangan gunakan prerender: true pada '/' agar jumlah stok & katalog selalu real-time dari D1
  routeRules: {
    '/**': {
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    }
  },

  compatibilityDate: '2026-06-30',

  nitro: {
    preset: 'cloudflare_module',
    experimental: {
      tasks: true
    }
  },

  vite: {
    optimizeDeps: {
      include: ['zod', 'qrcode', '@vueuse/core']
    },
    server: {
      watch: {
        ignored: ['**/.wrangler/**', '**/.data/**', '**/node_modules/**']
      }
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
