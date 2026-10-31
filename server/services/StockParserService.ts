// ============================================================================
// FILE: server/services/StockParserService.ts
// DESKRIPSI: Penerapan OOP Polymorphism (Strategy Pattern) untuk membaca,
//            memvalidasi, dan memisahkan stok akun dari berbagai format .txt.
// ============================================================================

import type { StockFormatType } from '../types/database'

export interface ParsedStockItem {
  email: string
  password: string
  extraInfoLink: string | null
  normalizedRawString: string // Format seragam yang akan dienkripsi ke D1
  formatType: StockFormatType
}

export interface BulkParseResult {
  validItems: ParsedStockItem[]
  invalidLines: { lineNumber: number, content: string, reason: string }[]
}

// ----------------------------------------------------------------------------
// [INTERFACE POLYMORPHISM: KONTRAK PARSER BARIS .TXT]
// ----------------------------------------------------------------------------
export interface IStockLineParser {
  canParse(parts: string[]): boolean
  parse(parts: string[]): ParsedStockItem
}

// ----------------------------------------------------------------------------
// [STRATEGY 1: PARSER FORMAT 2 KOLOM]
// Contoh: 62vy1o0l@acqf.poj.me|masuk123
// ----------------------------------------------------------------------------
export class TwoColumnStockParser implements IStockLineParser {
  public canParse(parts: string[]): boolean {
    return parts.length === 2
  }

  public parse(parts: string[]): ParsedStockItem {
    const email = (parts[0] || '').trim()
    const password = (parts[1] || '').trim()

    if (!email.includes('@') || !password) {
      throw new Error('Format email atau password pada 2 kolom tidak valid.')
    }

    return {
      email,
      password,
      extraInfoLink: null,
      normalizedRawString: `${email}|${password}`,
      formatType: 'two_columns'
    }
  }
}

// ----------------------------------------------------------------------------
// [STRATEGY 2: PARSER FORMAT 3 KOLOM DENGAN LINK GENERATOR]
// Contoh: hifidxhen672@ydah.me | Masuk12345- | https://generator.email/...
// ----------------------------------------------------------------------------
export class ThreeColumnStockParser implements IStockLineParser {
  public canParse(parts: string[]): boolean {
    return parts.length >= 3
  }

  public parse(parts: string[]): ParsedStockItem {
    const email = (parts[0] || '').trim()
    const password = (parts[1] || '').trim()
    const extraInfoLink = parts.slice(2).join('|').trim()

    if (!email.includes('@') || !password || !extraInfoLink) {
      throw new Error('Format email, password, atau link generator pada 3 kolom tidak lengkap.')
    }

    return {
      email,
      password,
      extraInfoLink,
      normalizedRawString: `${email}|${password}|${extraInfoLink}`,
      formatType: 'three_columns'
    }
  }
}

// ----------------------------------------------------------------------------
// [MAIN ORCHESTRATOR CLASS: STOCK PARSER SERVICE]
// ----------------------------------------------------------------------------
export class StockParserService {
  private readonly strategies: IStockLineParser[]

  constructor() {
    // Daftarkan semua strategi parser polymorphic
    this.strategies = [
      new TwoColumnStockParser(),
      new ThreeColumnStockParser()
    ]
  }

  // --------------------------------------------------------------------------
  // [SECTION: PARSE SELURUH ISI FILE .TXT]
  // Memisahkan baris demi baris dan mendeteksi formatnya secara otomatis
  // --------------------------------------------------------------------------
  public parseTxtContent(rawTxtContent: string): BulkParseResult {
    const lines = rawTxtContent
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0)

    const validItems: ParsedStockItem[] = []
    const invalidLines: { lineNumber: number, content: string, reason: string }[] = []

    lines.forEach((line, index) => {
      const lineNumber = index + 1
      const parts = line.split('|').map(p => p.trim())

      const matchedStrategy = this.strategies.find(strategy => strategy.canParse(parts))

      if (!matchedStrategy) {
        invalidLines.push({
          lineNumber,
          content: line,
          reason: 'Jumlah kolom tidak dikenali (harus dipisah tanda "|" menjadi 2 atau 3 bagian).'
        })
        return
      }

      try {
        const parsedItem = matchedStrategy.parse(parts)
        validItems.push(parsedItem)
      } catch (err) {
        invalidLines.push({
          lineNumber,
          content: line,
          reason: err instanceof Error ? err.message : 'Gagal memproses baris.'
        })
      }
    })

    return { validItems, invalidLines }
  }

  // --------------------------------------------------------------------------
  // [SECTION: FORMAT DATA AKUN UNTUK DITAMPILKAN DI INVOICE / EMAIL]
  // Mengubah string hasil dekripsi kembali menjadi objek terstruktur
  // --------------------------------------------------------------------------
  public parseSingleDecryptedString(decryptedString: string): ParsedStockItem {
    const parts = decryptedString.split('|').map(p => p.trim())
    const matchedStrategy = this.strategies.find(strategy => strategy.canParse(parts))

    if (!matchedStrategy) {
      throw new Error('[STOCK_PARSE_ERROR] Data stok terdekripsi tidak sesuai format.')
    }

    return matchedStrategy.parse(parts)
  }
}
