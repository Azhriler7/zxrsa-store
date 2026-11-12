// ============================================================================
// FILE: server/services/StockParserService.ts
// DESKRIPSI: Service OOP Parser Stok Akun (Mendukung Email+Password,
//            Email+Link Tanpa Password, & Email+Password+Link).
// ============================================================================

export interface ParsedStockItem {
  email: string
  password: string
  extraInfoLink: string | null
  formatType: 'two_col' | 'three_col'
  rawNormalized: string
}

export interface StockParseSummary {
  validItems: ParsedStockItem[]
  invalidLines: string[]
}

export class StockParserService {
  public parseSingleDecryptedString(rawLine: string): ParsedStockItem {
    const trimmed = (rawLine || '').trim()
    const parts = trimmed.split('|').map(p => p.trim())

    const email = parts[0] || ''
    let password = ''
    let extraInfoLink: string | null = null

    if (parts.length >= 3) {
      // Format 3 kolom: email | password (bisa kosong) | link
      password = parts[1] || ''
      const joinedLink = parts.slice(2).join('|').trim()
      extraInfoLink = joinedLink.length > 0 ? joinedLink : null
    } else if (parts.length === 2) {
      const secondCol = parts[1] || ''
      // Jika kolom ke-2 langsung berupa URL (http:// atau https://), maka itu adalah Link (tanpa password)
      if (/^https?:\/\//i.test(secondCol)) {
        password = ''
        extraInfoLink = secondCol
      } else {
        password = secondCol
        extraInfoLink = null
      }
    }

    const formatType: 'two_col' | 'three_col' = extraInfoLink ? 'three_col' : 'two_col'
    const rawNormalized = extraInfoLink
      ? `${email}|${password}|${extraInfoLink}`
      : `${email}|${password}`

    return {
      email,
      password,
      extraInfoLink,
      formatType,
      rawNormalized
    }
  }

  public parseTxtContent(rawContent: string): StockParseSummary {
    const lines = (rawContent || '')
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0)

    const validItems: ParsedStockItem[] = []
    const invalidLines: string[] = []

    for (const line of lines) {
      const parsed = this.parseSingleDecryptedString(line)
      if (parsed.email.length >= 3 && (parsed.password.length > 0 || Boolean(parsed.extraInfoLink))) {
        validItems.push(parsed)
      } else {
        invalidLines.push(line)
      }
    }

    return {
      validItems,
      invalidLines
    }
  }
}
