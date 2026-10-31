// ============================================================================
// FILE: server/services/QrisDynamicService.ts
// DESKRIPSI: Service OOP Open-Source untuk mengonversi String QRIS Statis
//            menjadi QRIS Dinamis beserta perhitungan Checksum CRC16-CCITT.
// ============================================================================

export class QrisDynamicService {
  private readonly staticQris: string

  constructor(staticQrisString: string) {
    if (!staticQrisString || staticQrisString.length < 50) {
      throw new Error('[QRIS_CONFIG_ERROR] String QRIS Statis belum dikonfigurasi dengan benar.')
    }
    this.staticQris = staticQrisString.trim()
  }

  // --------------------------------------------------------------------------
  // [SECTION: GENERATE UNIQUE PAYMENT CODE]
  // Menghasilkan angka unik (1 s/d 299) agar mutasi QRIS tidak tertukar
  // --------------------------------------------------------------------------
  public static generateUniqueCode(min = 1, max = 299): number {
    const randomBuffer = crypto.getRandomValues(new Uint32Array(1))
    const randomValue = randomBuffer[0] ?? 1
    return (randomValue % (max - min + 1)) + min
  }

  // --------------------------------------------------------------------------
  // [SECTION: CONVERT STATIC QRIS TO DYNAMIC QRIS]
  // Menyuntikkan nominal transaksi (INTEGER Rupiah) ke dalam payload EMVCo QRIS
  // --------------------------------------------------------------------------
  public generateDynamicString(totalAmount: number): string {
    const amountInt = Math.floor(totalAmount)
    if (amountInt <= 0) {
      throw new Error('[QRIS_AMOUNT_ERROR] Nominal pembayaran harus lebih besar dari 0.')
    }

    // 1. Hapus 4 karakter checksum CRC16 lama di ujung belakang (setelah Tag 6304)
    const qrisWithoutCrc = this.staticQris.slice(0, -4)

    // 2. Ubah indikator QRIS Statis (010211) menjadi QRIS Dinamis (010212)
    const step1 = qrisWithoutCrc.replace('010211', '010212')

    // 3. Pisahkan string pada kode negara "5802ID" untuk menyisipkan Tag 54 (Nominal)
    const splitParts = step1.split('5802ID')
    if (splitParts.length !== 2) {
      throw new Error('[QRIS_FORMAT_ERROR] Tag 5802ID tidak ditemukan pada string QRIS Statis.')
    }

    const amountStr = amountInt.toString()
    const amountLength = amountStr.length.toString().padStart(2, '0')
    const tag54Nominal = `54${amountLength}${amountStr}`

    // 4. Gabungkan kembali dengan Tag 54 tepat sebelum 5802ID
    const payloadToHash = `${splitParts[0]}${tag54Nominal}5802ID${splitParts[1]}`

    // 5. Hitung ulang Checksum CRC16-CCITT (0xFFFF) dan tempelkan di akhir
    const newCrc16 = this.calculateCrc16(payloadToHash)
    return `${payloadToHash}${newCrc16}`
  }

  // --------------------------------------------------------------------------
  // [SECTION: ALGORITMA CHECKSUM CRC16-CCITT STANDAR EMVCO QRIS]
  // --------------------------------------------------------------------------
  private calculateCrc16(str: string): string {
    let crc = 0xFFFF
    for (let c = 0; c < str.length; c++) {
      crc ^= str.charCodeAt(c) << 8
      for (let i = 0; i < 8; i++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021
        } else {
          crc = crc << 1
        }
      }
    }
    const hex = (crc & 0xFFFF).toString(16).toUpperCase()
    return hex.padStart(4, '0')
  }
}
