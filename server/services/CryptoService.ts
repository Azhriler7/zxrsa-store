// ============================================================================
// FILE: server/services/CryptoService.ts
// DESKRIPSI: Service OOP Kriptografi (AES-256-GCM, SHA-256 Password Verification,
//            & Webhook HMAC) — 100% Kompatibel dengan AuthRepository & TypeScript.
// ============================================================================

export class CryptoService {
  private readonly rawKeyString: string

  constructor(encryptionKey?: string) {
    this.rawKeyString = (encryptionKey || 'zxrsa-default-32byte-secret-key!').trim()
  }

  private async getAesKey(): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const keyMaterial = encoder.encode(this.rawKeyString)
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyMaterial as BufferSource)

    return await crypto.subtle.importKey(
      'raw',
      hashBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    )
  }

  private static bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  private static hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
    const cleanHex = hex.trim()
    const buffer = new ArrayBuffer(cleanHex.length / 2)
    const bytes = new Uint8Array(buffer)
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16)
    }
    return bytes
  }

  public async encryptAccountData(plainText: string): Promise<string> {
    const key = await this.getAesKey()
    const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)))
    const encoded = new TextEncoder().encode(plainText)

    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      encoded as BufferSource
    )

    const ivHex = CryptoService.bytesToHex(iv)
    const cipherHex = CryptoService.bytesToHex(new Uint8Array(cipherBuffer))
    return `${ivHex}:${cipherHex}`
  }

  public async decryptAccountData(encryptedPayload: string): Promise<string> {
    if (!encryptedPayload || !encryptedPayload.includes(':')) {
      return encryptedPayload
    }

    const parts = encryptedPayload.split(':')
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return encryptedPayload
    }

    try {
      const key = await this.getAesKey()
      const iv = CryptoService.hexToBytes(parts[0])
      const cipherBytes = CryptoService.hexToBytes(parts[1])

      const plainBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as BufferSource },
        key,
        cipherBytes as BufferSource
      )

      return new TextDecoder().decode(plainBuffer)
    } catch {
      try {
        const paddedKey = this.rawKeyString.padEnd(32, '0').slice(0, 32)
        const legacyKey = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(paddedKey) as BufferSource,
          { name: 'AES-GCM' },
          false,
          ['decrypt']
        )
        const iv = CryptoService.hexToBytes(parts[0])
        const cipherBytes = CryptoService.hexToBytes(parts[1])
        const plainBuffer = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: iv as BufferSource },
          legacyKey,
          cipherBytes as BufferSource
        )
        return new TextDecoder().decode(plainBuffer)
      } catch {
        return encryptedPayload
      }
    }
  }

  // Dipanggil oleh AuthRepository.ts baris 73
  public static async verifyPassword(plainPassword: string, storedHash: string): Promise<boolean> {
    const parts = storedHash.split(':')
    if (parts.length !== 2 || !parts[0] || !parts[1]) return false

    const salt = parts[0]
    const targetHex = parts[1]

    const data = new TextEncoder().encode(`${salt}:${plainPassword}`)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data as BufferSource)
    const computedHex = CryptoService.bytesToHex(new Uint8Array(hashBuffer))

    return computedHex.toLowerCase() === targetHex.toLowerCase()
  }

  // Alias agar kompatibel jika dipanggil dengan nama verifyPasswordHash
  public static async verifyPasswordHash(plainPassword: string, storedHash: string): Promise<boolean> {
    return await CryptoService.verifyPassword(plainPassword, storedHash)
  }

  public static async hashPassword(plainPassword: string, customSalt?: string): Promise<string> {
    const salt = customSalt || CryptoService.bytesToHex(crypto.getRandomValues(new Uint8Array(new ArrayBuffer(8))))
    const data = new TextEncoder().encode(`${salt}:${plainPassword}`)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data as BufferSource)
    const hashHex = CryptoService.bytesToHex(new Uint8Array(hashBuffer))
    return `${salt}:${hashHex}`
  }

  public static async verifyWebhookHmac(payload: string, signatureHex: string, secret: string): Promise<boolean> {
    try {
      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret) as BufferSource,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload) as BufferSource)
      const computedHex = CryptoService.bytesToHex(new Uint8Array(sigBuffer))
      return computedHex.toLowerCase() === signatureHex.toLowerCase()
    } catch {
      return false
    }
  }

  public static generateInvoiceToken(): string {
    const uuid = crypto.randomUUID()
    const randomBytes = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(24)))
    const hexPart = CryptoService.bytesToHex(randomBytes)
    return `${uuid}-${hexPart}`
  }
}
