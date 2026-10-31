# 🛡️ ZXRSA Store — Secure Game Account & Custom Gmail Webstore

Platform webstore penjualan akun game dan layanan *Custom Gmail Premium* berkeamanan tinggi (**Zero-Trust Admin, Anti-Fraud, Atomic Stock Locking, & Encrypted Credentials**). Dibangun dengan arsitektur **Modular Component ("Lego")** dan prinsip **Object-Oriented Programming (OOP)** menggunakan **Nuxt 4.6.3**, **Nuxt UI 4.12.0**, dan **Cloudflare Workers + D1**.

---

## 🔒 Arsitektur Keamanan Berlapis (Defense in Depth)

1. **Subdomain Isolation (`domain.com` vs `admin.domain.com`)**
   - Pemisahan trafik secara ketat menggunakan *Global Host Middleware*.
   - Percobaan mengakses rute `/admin/*` dari domain publik (`domain.com`) akan langsung melempar **404 Not Found**.
2. **Double-Layer Admin Authentication**
   - **Layer 1 (Edge):** Dilindungi oleh **Cloudflare Access (Zero Trust)** pada subdomain `admin.domain.com` (OTP Email / SSO Google hanya untuk email pemilik).
   - **Layer 2 (Application):** Autentikasi sesi terenkripsi (`nuxt-auth-utils`) dengan akun yang dibuat secara manual di database D1 (tanpa fitur registrasi publik) + verifikasi token JWT Cloudflare Access (`Cf-Access-Jwt-Assertion`).
3. **Dynamic QRIS + Kode Unik & HMAC-SHA256 Webhook**
   - Mengubah QRIS Statis menjadi QRIS Dinamis dengan *CRC16-CCITT Checksum* dan kode unik nominal.
   - Pelacakan mutasi otomatis via *Webhook* yang diamankan dengan tanda tangan kriptografi **HMAC-SHA256**.
4. **Atomic Stock Locking (Anti-Race Condition)**
   - Mengunci stok (`reserved`) selama 10 menit menggunakan query *Atomic Single-Statement `UPDATE ... RETURNING`* di Cloudflare D1 sehingga mustahil 2 pembeli mendapatkan 1 akun yang sama di detik yang bersamaan.
5. **AES-256-GCM Encryption at Rest**
   - Seluruh kredensial akun dari file `.txt` dienkripsi dengan **AES-256-GCM** sebelum disimpan ke database D1.

---

## 🌿 Standar Version Control & Git Workflow

Proyek ini menerapkan **Feature Branch Workflow** dan **Conventional Commits**. Setiap fitur wajib dikerjakan di *branch* terpisah sebelum digabungkan (*merge*) ke `main`.

### Format Penamaan Branch:
- `chore/<nama-setup>` — Konfigurasi proyek, library, atau tooling.
- `ci/<nama-pipeline>` — Konfigurasi CI/CD GitHub Actions.
- `feat/<nama-fitur>` — Penambahan fitur baru (Database, Service, UI, API).
- `fix/<nama-bug>` — Perbaikan bug atau celah keamanan.

### Contoh Alur Kerja 1 Fitur:
```bash
# 1. Buat branch fitur baru dari main
git checkout -b feat/auth

# 2. Kerjakan fitur, lalu cek kualitas kode sebelum commit
npm run lint
npm run typecheck

# 3. Commit dengan format Conventional Commits
git add .
git commit -m "feat(auth): add login page and cloudflare access verification for admin"

# 4. Push branch ke GitHub untuk dicek oleh CI atau merge ke main
git push origin feat/auth