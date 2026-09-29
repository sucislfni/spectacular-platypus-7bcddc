# Pixel Love & Matcha — Wedding Planner

Wedding planner bergaya retro pixel (vendor, seserahan, budget, checklist, tamu & RSVP) yang datanya tersimpan di server dan tersinkron untuk semua orang yang memiliki link — termasuk saat ditanam (embed) di Google Sites.

## Halaman
- `/` — Planner utama (frontend). Semua perubahan tersimpan otomatis dan perubahan orang lain muncul dalam ±5 detik.
- `/data.html` — **Semua Data**: tabel semua data di database per jenis (Vendor, Seserahan, Checklist, Tamu, Pengaturan) dengan pencarian, tambah, edit, dan hapus.
- `/api/data` — API backend (GET semua data, POST perubahan/hapus).

## Teknologi
- HTML + Tailwind (CDN), Three.js, Chart.js
- Netlify Functions (`netlify/functions/data.ts`)
- Netlify Database (Postgres) + Drizzle ORM (`db/schema.ts`)

## Menjalankan secara lokal
```bash
npm install
netlify dev
```

## Embed di Google Sites
Di Google Sites pilih **Sisipkan → Sematkan → Menurut URL** lalu tempel URL situs Netlify. Header `frame-ancestors *` di `netlify.toml` mengizinkan halaman ditanam.
