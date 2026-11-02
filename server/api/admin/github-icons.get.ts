// ============================================================================
// FILE: server/api/admin/github-icons.get.ts
// DESKRIPSI: Endpoint Otomatis Membaca Daftar Icon dari Repo Public Terpisah
//            dan Mengubahnya Menjadi URL jsDelivr CDN.
// ============================================================================

interface GithubContentItem {
  name: string
  path: string
  type: 'file' | 'dir'
}

export interface IconDropdownOption {
  label: string
  filename: string
  url: string
}

export const DEFAULT_APP_ICON_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" rx="28" fill="#0f172a"/>
    <rect x="4" y="4" width="112" height="112" rx="24" stroke="#38bdf8" stroke-width="2" stroke-opacity="0.4"/>
    <path d="M60 32L82 45V75L60 88L38 75V45L60 32Z" stroke="#38bdf8" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="60" cy="60" r="8" fill="#38bdf8"/>
  </svg>`
)}`

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const config = useRuntimeConfig(event)
  const query = getQuery(event)

  const githubRepo = String(query.repo || config.public.githubIconRepo || '').trim()
  const githubBranch = String(query.branch || 'main').trim()
  const githubFolder = String(query.folder || config.public.githubIconFolder || 'icons')
    .trim()
    .replace(/^\/+|\/+$/g, '')

  const icons: IconDropdownOption[] = [
    {
      label: '🔹 Default Placeholder Icon (Bawaan Toko)',
      filename: 'default-placeholder.svg',
      url: DEFAULT_APP_ICON_PLACEHOLDER
    }
  ]

  if (githubRepo && githubRepo.includes('/') && !githubRepo.startsWith('username-anda/')) {
    try {
      const apiUrl = githubFolder
        ? `https://api.github.com/repos/${githubRepo}/contents/${githubFolder}?ref=${githubBranch}`
        : `https://api.github.com/repos/${githubRepo}/contents?ref=${githubBranch}`

      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'ZXRSA-Store-Worker'
        }
      })

      if (response.ok) {
        const items = (await response.json()) as GithubContentItem[]
        const imageRegex = /\.(png|webp|svg|jpg|jpeg)$/i

        for (const item of items) {
          if (item.type === 'file' && imageRegex.test(item.name)) {
            const jsDelivrUrl = `https://cdn.jsdelivr.net/gh/${githubRepo}@${githubBranch}/${item.path}`
            const cleanLabel = item.name
              .replace(/\.(png|webp|svg|jpg|jpeg)$/i, '')
              .replace(/[-_]+/g, ' ')
              .replace(/\b\w/g, c => c.toUpperCase())

            icons.push({
              label: `📦 ${cleanLabel} (${item.name})`,
              filename: item.name,
              url: jsDelivrUrl
            })
          }
        }
      }
    } catch {
      // Tetap kembalikan placeholder default jika repo belum memiliki file
    }
  }

  return {
    defaultPlaceholder: DEFAULT_APP_ICON_PLACEHOLDER,
    icons
  }
})
