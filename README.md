# Simulasi JLPT N4 — N4 Japanese Practice

Website latihan **70 soal** bergaya JLPT N4: kosakata & kanji, tata bahasa, bacaan,
cerita bergambar, mencocokkan gambar, dan listening berbasis audio bahasa Jepang asli.

> **Simulasi tidak resmi.** Proyek ini dibuat untuk latihan dan tidak berafiliasi dengan JLPT
> atau penyelenggaranya. Halaman hasil memakai skor sederhana (benar / 70), **bukan**
> *scaled score* resmi, jadi tidak menyatakan lulus atau gagal JLPT.

Bahasa antarmuka: **Bahasa Indonesia**. Teks soal dan pilihan: **Bahasa Jepang**.

---

## 1. Ringkasan fitur

- **70 soal** dalam 6 kategori dengan urutan tetap: Kosakata (1–20), Grammar (21–35),
  Reading (36–50), Cerita Bergambar (51–55), Cocokkan Gambar (56–60), Listening (61–70).
- Seluruh soal pilihan **A/B/C/D** dengan tepat satu kunci.
- Countdown **115 menit** berbasis waktu absolut (`deadlineAt`), jadi tidak reset saat refresh.
- Progres, jawaban, dan jumlah pemutaran audio tersimpan di `localStorage` (tanpa data pribadi).
- **5 bacaan** (masing-masing 3 soal) dengan passage tetap terlihat selama kelompok soal tersebut.
- **5 ilustrasi cerita** berisi 4 panel berurutan (SVG vektor, dibuat sendiri).
- **5 soal mencocokkan gambar** × 4 gambar opsi (20 SVG) yang benar-benar berbeda.
- **10 audio MP3** bahasa Jepang asli untuk bagian listening, maksimum **2 kali pemutaran per soal**
  dengan penghitung ancaman play yang jujur (dihitung saat audio benar-benar berbunyi).
- Halaman hasil (benar/salah/kosong, durasi, ringkasan per kategori) dan halaman review
  dengan kunci, pembahasan bahasa Indonesia, transkrip Jepang, serta filter
  Semua / Salah / Belum dijawab / Benar.
- Kunci, pembahasan, dan transkrip **hanya muncul setelah ujian selesai**.
- UI simpel & bersih, responsif 360px / 768px / ≥1280px, navigasi keyboard, dan penghormatan
  pada `prefers-reduced-motion`.

---

## 2. Menjalankan secara lokal (development saja)

```bash
npm install
npm run dev          # http://localhost:5173
```

Build produksi dan pratinjau hasil build:

```bash
npm run build        # tsc --noEmit && vite build  -> dist/
npm run preview      # menyajikan dist/ di port 4173
```

> Hasil build ini adalah SPA statis. Tautan publik yang benar-benar sudah dideploy
> **diverifikasi dan dicatat pada bagian 8**; jangan menganggap perintah di atas
> menghasilkan situs online.

---

## 3. Tes

```bash
npm test              # Vitest: 57 unit/integration test
npm test -- --run     # sekali jalan (dipakai CI)
npm run test:e2e      # build + Playwright (desktop + mobile), dilayani dari dist/
npm run test:e2e:pages # sama, tetapi base path /TestTrialN4/ (verifikasi GitHub Pages)
```

Yang diuji:

| Berkas | Fokus |
|---|---|
| `tests/questions.test.ts` | 70 soal, ID 1..70 unik, 4 opsi A–D non-kosong & tidak duplikat, jawaban A–D, distribusi tipe `[20,15,15,5,5,10]`, referensi `passageId`/`sceneId`/`matchingId`/`audioId` valid, 5 passage × 3 soal |
| `tests/assets-files.test.ts` | 10 MP3 ada + berisi frame MPEG valid, 5 SVG cerita bernomor panel 1–4, 20 SVG opsi matching saling berbeda, setiap soal menunjuk aset yang benar-benar ada |
| `tests/score.test.ts` | Aturan skor (benar +1, salah/kosong +0), persentase 1 desimal, ringkasan per kategori, durasi |
| `tests/persistence.test.ts` | Validasi `localStorage`, penolakan JSON rusak/schema salah, sanitasi jawaban & play count, countdown berbasis deadline |
| `tests/assets.test.ts` | Semua path aset memakai `import.meta.env.BASE_URL` (bukan `/audio/...` absolut) |
| `tests/app.test.tsx` | Alur UI: mulai, jawab, navigasi, dialog konfirmasi, hasil, review, filter, auto-submit, tanpa kebocoran kunci |
| `e2e/exam.spec.ts` | End-to-end di browser nyata (desktop + Pixel 7): 70 soal dijawab, submit, review, 25 gambar & 10 MP3 tanpa 404, audio benar-benar diputar, jawaban bertahan setelah refresh, auto-submit saat waktu habis, layout mobile tanpa scroll horizontal |

Hasil terakhir: **57/57 unit & integration test lulus**, **21/21 E2E lulus**
(1 test layout mobile dilewati otomatis pada proyek desktop).

---

## 4. Struktur proyek

```text
TestTrialN4/
├── .github/workflows/deploy.yml     # deploy otomatis ke GitHub Pages
├── e2e/exam.spec.ts                 # Playwright end-to-end
├── public/
│   ├── audio/q61.mp3 … q70.mp3      # 10 audio listening (MP3 asli)
│   └── images/
│       ├── stories/s1.svg … s5.svg  # 5 cerita × 4 panel
│       └── matching/m1-a.svg … m5-d.svg  # 20 gambar opsi
├── scripts/
│   ├── extract-data.mjs             # ekstrak bank soal dari spesifikasi
│   ├── generate-images.mjs          # produksi 25 SVG (+ validasi XML)
│   ├── check-images.mjs             # validasi SVG dengan parser XML
│   ├── generate-audio.mjs           # produksi 10 MP3 (TTS ja-JP)
│   └── serve-dist.mjs               # server statis untuk E2E
├── src/
│   ├── components/                  # ExamHeader, QuestionPanel, ChoiceCard,
│   │                                # ImageChoiceCard, AudioPlayer, AssetImage,
│   │                                # QuestionNavigator
│   ├── pages/                       # Landing, Exam, Results, Review
│   ├── lib/                         # types, constants, dataset, score,
│   │                                # persistence, timer, assets, labels
│   ├── data/                        # questions, passages, storyScenes,
│   │                                # matchingScenes, listeningScripts (JSON)
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── tests/                           # Vitest
├── index.html
├── vite.config.ts
├── playwright.config.ts
├── tsconfig.json
├── package.json
└── package-lock.json
```

---

## 5. Rincian 70 soal

| Nomor | Kategori (`type`) | Jumlah | Jenis |
|---:|---|---:|---|
| 01–20 | `vocabulary` | 20 | bacaan kanji, penulisan kanji, pemilihan kata, sinonim, pemakaian |
| 21–35 | `grammar` | 15 | partikel, pola N4, bentuk kata, pemilihan kalimat benar |
| 36–50 | `reading` | 15 | 5 bacaan × 3 pertanyaan (`P1`–`P5`) |
| 51–55 | `story_image` | 5 | 4 panel berurutan per soal (`S1`–`S5`) |
| 56–60 | `match_image` | 5 | 1 deskripsi Jepang, 4 gambar A–D (`M1`–`M5`) |
| 61–70 | `listening` | 10 | audio Jepang (`L1`–`L10` → `q61.mp3`–`q70.mp3`) |
| | **TOTAL** | **70** | semua pilihan A–D, tepat 1 jawaban |

### Aturan skor

```ts
const correct = questions.filter(q => answers[q.id] === q.answer).length;
const answered = questions.filter(q => answers[q.id] != null).length;
const wrong = answered - correct;
const unanswered = 70 - answered;
const percent = Number(((correct / 70) * 100).toFixed(1));
```

---

## 6. Cara menambah atau mengubah soal

1. **Bank soal.** Sunting `src/data/questions.json`. Setiap entri wajib memiliki
   `id`, `type`, `prompt`, `options` (A, B, C, D), `answer` (`"A"|"B"|"C"|"D"`, bukan indeks angka),
   dan `explanation`. Untuk tipe tertentu tambahkan referensi:
   - `reading` → `passageId`
   - `story_image` → `sceneId`
   - `match_image` → `matchingId`
   - `listening` → `audioId`
2. **Bacaan/gambar/audio.** Tambahkan entri di `src/data/passages.json`,
   `storyScenes.json`, `matchingScenes.json`, atau `listeningScripts.json`, lalu letakkan
   berkas aset di `public/images/...` atau `public/audio/...`.
3. **Regenerasi aset (opsional).**
   ```bash
   npm run data:extract     # ambil ulang 5 blok JSON dari dokumen spesifikasi
   npm run assets:images    # tulis ulang 25 SVG + validasi parser XML
   npm run assets:audio     # tulis ulang 10 MP3 dari naskah listeningScripts.json
   ```
4. **Jalankan tes.** `npm test` akan menolak data yang tidak lengkap
   (jumlah soal, distribusi tipe, referensi hilang, opsi duplikat, aset tidak ada).

> Jika jumlah soal tidak lagi 70, perbarui `TOTAL_QUESTIONS` dan `percent` di
> `src/lib/constants.ts` serta `src/lib/score.ts` agar konsisten.

---

## 7. Deploy

### 7.1 GitHub Pages (utama)

`vite.config.ts` memakai `base: '/TestTrialN4/'` ketika variabel lingkungan `GITHUB_PAGES=true`,
sehingga aset dibangun dengan prefix yang benar. Semua path audio/gambar di aplikasi dibentuk
dari `import.meta.env.BASE_URL` (`src/lib/assets.ts`), bukan path absolut `/audio/...`.

Workflow `.github/workflows/deploy.yml` menjalankan `npm ci`, `npm test -- --run`,
build dengan `GITHUB_PAGES=true`, lalu mengunggah `dist` ke GitHub Pages.

Langkah aktivasi (sekali saja, setelah repo memiliki commit di branch `main`):

1. Buka **Settings → Pages → Build and deployment**.
2. Pilih **Source = GitHub Actions**.
3. Buka tab **Actions**, tunggu job *Deploy N4 Website to GitHub Pages* hijau.
4. URL target: `https://fayyadh678.github.io/TestTrialN4/`.

Build lokal yang setara: `npm run build:pages`.

### 7.2 Vercel (opsi kedua, repo yang sama)

1. <https://vercel.com/new> → import `fayyadh678/TestTrialN4`.
2. Framework Preset: **Vite**; Root Directory: `./`; Build Command: `npm run build`;
   Output Directory: `dist`; Install Command: `npm ci`.
3. **Jangan** set `GITHUB_PAGES=true` (base harus `/`), lalu Deploy.
4. Catat domain `*.vercel.app` yang benar-benar diterbitkan Vercel.

Aplikasi memakai satu halaman dengan state SPA (tanpa router path), sehingga
refresh pada URL apa pun tidak menghasilkan 404 dan tidak memerlukan rewrite tambahan.

---

## 8. Status & URL publik

| Item | Nilai |
|---|---|
| Kode sumber (workspace lokal) | `TEST TRIAL N4/TestTrialN4/` |
| Repository | <https://github.com/fayyadh678/TestTrialN4> |
| Artefak build | `dist/` (`index.html` + `assets/` + `audio/` + `images/`) |
| GitHub Pages | Belum dideploy — lihat status jujur di bawah |
| Vercel | Belum dideploy |

### Status verifikasi (jujur)

- [x] `npm test` lulus: **57/57** (6 berkas test).
- [x] `npm run build` sukses (TypeScript `--noEmit` + Vite, tanpa error).
- [x] `npm run test:e2e` lulus: **21/21** di browser Chromium nyata
      (desktop Chrome + emulasi Pixel 7), termasuk verifikasi base path `/TestTrialN4/`.
- [x] 70 soal termuat dalam 6 kategori dengan 4 pilihan A–D dan kunci.
- [x] 5 bacaan × 3 soal; 5 SVG cerita empat panel; 5 × 4 SVG opsi matching.
- [x] 10 MP3 listening playable (diverifikasi lewat HTTP 200 + frame MPEG valid + pemutaran nyata di browser).
- [x] Timer berbasis `deadlineAt`, jawaban & play count bertahan setelah refresh, auto-submit saat waktu habis.
- [x] Tidak ada kunci/pembahasan/transkrip di DOM selama ujian (diuji otomatis).
- [x] Responsif: diuji di 360–412px (mobile) dan desktop, tanpa scroll horizontal.

URL publik belum dapat diverifikasi sebagai live karena push/deploy memerlukan
otorisasi akun GitHub/Vercel milik pemilik repo. **Jangan mengklaim situs sudah online
sebelum workflow GitHub Actions berhasil.**

---

## 9. Authoring aset

### Gambar (25 SVG)

- **5 cerita** (`public/images/stories/s1.svg`–`s5.svg`): satu SVG berisi 4 panel 300×300
  bernomor 1–4 dari kiri ke kanan, gaya vektor datar konsisten, tanpa teks yang membocorkan kunci.
- **20 gambar opsi** (`public/images/matching/m1-a.svg`–`m5-d.svg`): setiap set M1–M5
  memiliki empat gambar yang benar-benar berbeda.

Regenerasi: `npm run assets:images` (skrip juga memvalidasi XML dan menolak atribut ganda).

### Audio (10 MP3)

- Naskah ada di `src/data/listeningScripts.json` (label `女の人：`/`男の人：`/`先生：`/`学生：`
  dipakai **hanya** untuk memilih suara, tidak dibacakan).
- Suara TTS: `ja-JP-NanamiNeural` (perempuan) dan `ja-JP-KeitaNeural` (laki-laki),
  laju `-10%`, tanpa musik latar, jeda 600–700 ms antar penutur.
- Regenerasi: `npm run assets:audio` (butuh akses internet; hasilnya dikomit sebagai berkas statis,
  jadi website tetap berjalan tanpa API key maupun layanan TTS saat runtime).

---

## 10. Catatan privasi dan keterbatasan

- `localStorage` hanya menyimpan: `schemaVersion`, `status`, `answers`, `startedAt`, `deadlineAt`,
  `audioPlayCount`, `completedAt`, `lastIndex`. Tidak ada nama, email, atau data pribadi.
- Karena ini situs statis, data yang dibundel ke klien (termasuk kunci jawaban) secara teknis
  dapat ditemukan lewat developer tools. Ini latihan, bukan ujian terproktor.
- Tidak ada backend, database, atau layanan berbayar.

---

## 11. Lisensi konten

Seluruh soal, bacaan, naskah listening, dan ilustrasi dalam repo ini dibuat orisinal untuk
latihan dan tidak menyalin bank soal resmi yang berhak cipta.