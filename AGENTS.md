# AGENTS.md

## Arsitektur
- `public/index.html` — planner satu halaman (vanilla JS). State ada di variabel global `state`; setiap mutasi memanggil `saveState()`, yang (debounce 400ms) menghitung diff terhadap snapshot terakhir dan mengirim hanya item yang berubah ke `/api/data`. Polling tiap 5 detik menarik perubahan orang lain (dilewati saat user sedang mengetik / modal terbuka).
- `public/js/planner-sync.js` — helper bersama: konversi state ⇄ record, diff, fetch/push.
- `public/data.html` — "Semua Data": tabel editable dari record database. Setiap edit mengambil record terbaru dulu, lalu menulis satu record.
- `netlify/functions/data.ts` — `GET /api/data` (semua record), `POST /api/data` `{ upserts, deletes }` dalam satu transaksi.
- `db/schema.ts` — tabel `records` (PK `collection` + `item_id`, `data` jsonb, `position`, `updated_at`).

## Model data
- `settings` → itemId = `groomName|brideName|weddingDate|maxBudget`, data = `{ value }`
- `vendors` → itemId = key kategori, data = objek kategori lengkap dengan `options`
- `seserahan`, `checklist`, `guests` → itemId = `id` item, data = item

Penyimpanan per-item membuat edit dari banyak orang pada item berbeda tidak saling menimpa. Posisi item lama dipertahankan saat diff agar penghapusan tidak menulis ulang item lain.

## Konvensi
- Tidak ada autentikasi — siapa pun yang punya link boleh edit/hapus (permintaan pemilik).
- Perubahan skema: edit `db/schema.ts` lalu `npx drizzle-kit generate --name <nama>`; migrasi ada di `netlify/database/migrations/`.
- Teks UI dalam Bahasa Indonesia.
