// ============================================================================
// FILE: server/services/CryptoService.ts
// DESKRIPSI: Service OOP untuk Enkripsi Stok Akun (AES-256-GCM),
//            Validasi Signature Webhook (HMAC-SHA256), & Hash Password Admin.
// ============================================================================

export class CryptoService {
  private readonly secretKeyHex: string

  constructor(secretKeyHex: string) {
    if (!secretKeyHex || secretKeyHex.length < 32) {
      throw new Error('[CRYPTO_INIT_ERROR] NUXT_ENCRYPTION_KEY minimal harus 32 karakter.')
    }
    this.secretKeyHex = secretKeyHex
  }

  // --------------------------------------------------------------------------
  // [SECTION: INTERNAL KEY DERIVATION]
  // Mengubah string key dari .env menjadi CryptoKey standar AES-256-GCM
  // --------------------------------------------------------------------------
  private async getAesKey(): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(this.secretKeyHex)
    )

    return crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    )
  }

  // --------------------------------------------------------------------------
  // [SECTION: ENCRYPT ACCOUNT CREDENTIALS]
  // Mengenkripsi baris akun dari .txt sebelum disimpan ke tabel account_stocks
  // Format output: ivHex:cipherTextHex
  // --------------------------------------------------------------------------
  public async encryptAccountData(plainText: string): Promise<string> {
    const key = await this.getAesKey()
    const iv = crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV standar GCM
    const encodedText = new TextEncoder().encode(plainText)

    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedText
    )

    return `${this.bufferToHex(iv)}:${this.bufferToHex(new Uint8Array(cipherBuffer))}`
  }

  // --------------------------------------------------------------------------
  // [SECTION: DECRYPT ACCOUNT CREDENTIALS]
  // Mendekripsi data akun hanya saat status transaksi sudah LUNAS
  // --------------------------------------------------------------------------
  public async decryptAccountData(encryptedPayload: string): Promise<string> {
    const [ivHex, cipherHex] = encryptedPayload.split(':')
    if (!ivHex || !cipherHex) {
      throw new Error('[CRYPTO_DECRYPT_ERROR] Format data terenkripsi tidak valid.')
    }

    const key = await this.getAesKey()
    const iv = this.hexToBuffer(ivHex)
    const cipherBytes = this.hexToBuffer(cipherHex)

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherBytes
    )

    return new TextDecoder().decode(decryptedBuffer)
  }

  // --------------------------------------------------------------------------
  // [SECTION: HMAC-SHA256 WEBHOOK VERIFICATION]
  // Memastikan payload mutasi QRIS benar-benar berasal dari alat pelacak Anda
  // --------------------------------------------------------------------------
  public static async verifyHmacSignature(
    rawBody: string,
    signatureHex: string,
    hmacSecret: string
  ): Promise<boolean> {
    if (!rawBody || !signatureHex || !hmacSecret) return false

    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(hmacSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(rawBody)
    )

    const expectedHex = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    return expectedHex.toLowerCase() === signatureHex.trim().toLowerCase()
  }

  // --------------------------------------------------------------------------
  // [SECTION: PASSWORD VERIFICATION ADMIN]
  // Memverifikasi password login Admin dengan format salt:sha256_hash di D1
  // --------------------------------------------------------------------------
  public static async verifyPassword(plainPassword: string, storedHash: string): Promise<boolean> {
    const [salt, originalHash] = storedHash.split(':')
    if (!salt || !originalHash) return false

    const encoder = new TextEncoder()
    const data = encoder.encode(`${salt}:${plainPassword}`)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const computedHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    return computedHash === originalHash
  }

  // --------------------------------------------------------------------------
  // [SECTION: GENERATE SECURE INVOICE TOKEN]
  // Menghasilkan token kriptografi 48 karakter + UUID untuk URL Invoice
  // --------------------------------------------------------------------------
  public static generateInvoiceToken(): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(24))
    const hexPart = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    return `${crypto.randomUUID()}-${hexPart}`
  }

  // Helper konversi Byte Array <-> Hex String (Strict ArrayBuffer untuk TS 5.7+ / Node 24)
  private bufferToHex(buffer: Uint8Array): string {
    return Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  private hexToBuffer(hex: string): Uint8Array<ArrayBuffer> {
    const buffer = new ArrayBuffer(hex.length / 2)
    const bytes = new Uint8Array(buffer)
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Number.parseInt(hex.substring(i * 2, i * 2 + 2), 16)
    }
    return bytes
  }
}
