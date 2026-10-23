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
- **7 bacaan** dengan 1–3 soal per bacaan (total tetap 15 soal) dan passage tetap terlihat selama kelompok soal tersebut.
- **5 ilustrasi cerita** berisi 4 panel berurutan, disajikan sebagai **4 file SVG terpisah** per cerita
  agar setiap panel tampil besar dan jelas.
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
npx playwright install chromium webkit   # sekali saja, untuk npm run test:e2e
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
npm run test:e2e      # build + Playwright (Chromium + WebKit/Safari, tablet, mobile)
npm run test:e2e:pages # sama, tetapi base path /TestTrialN4/ (verifikasi GitHub Pages)
npm run test:e2e:public # smoke test terhadap URL publik yang sudah dideploy
```

Yang diuji:

| Berkas | Fokus |
|---|---|
| `tests/questions.test.ts` | 70 soal, ID 1..70 unik, 4 opsi A–D non-kosong & tidak duplikat, jawaban A–D, distribusi tipe `[20,15,15,5,5,10]`, referensi `passageId`/`sceneId`/`matchingId`/`audioId` valid, 5 passage × 3 soal |
| `tests/assets-files.test.ts` | 10 MP3 ada + berisi frame MPEG valid (tanpa byte rusak), 5 cerita × 4 panel terpisah + gabungan, 20 SVG opsi matching saling berbeda, setiap soal menunjuk aset yang benar-benar ada |
| `tests/score.test.ts` | Aturan skor (benar +1, salah/kosong +0), persentase 1 desimal, ringkasan per kategori, durasi |
| `tests/persistence.test.ts` | Validasi `localStorage`, penolakan JSON rusak/schema salah, sanitasi jawaban & play count, countdown berbasis deadline |
| `tests/assets.test.ts` | Semua path aset memakai `import.meta.env.BASE_URL` (bukan `/audio/...` absolut) |
| `tests/app.test.tsx` | Alur UI: mulai, jawab, navigasi, dialog konfirmasi, hasil, review, filter, auto-submit, tanpa kebocoran kunci |
| `e2e/exam.spec.ts` | End-to-end di browser nyata (Chromium desktop 1280px & **WebKit/Safari**, tablet iPad Mini 768px, mobile Pixel 7 412px): 70 soal dijawab, submit, review, 45 gambar & 10 MP3 tanpa 404, audio benar-benar diputar, jawaban bertahan setelah refresh, auto-submit saat waktu habis, tata letak 360–1023px tanpa scroll horizontal, dan mini-navigasi hanya tampil di samping pada ≥1024px |
| `e2e/public.spec.ts` | Smoke test terhadap URL publik (Chromium, **WebKit/Safari**, Pixel 7): seluruh 60 aset 200, audio diputar nyata di browser, 4 panel cerita termuat (naturalWidth), refresh langsung tidak 404 |

Hasil terakhir: **57/57 unit & integration test lulus**, **48/48 E2E lokal lulus**
(4 proyek browser/viewport), dan **12/12 E2E terhadap URL publik lulus**
(termasuk WebKit/Safari).

---

## 4. Struktur proyek

```text
TestTrialN4/
├── .github/workflows/deploy.yml     # deploy otomatis ke GitHub Pages
├── e2e/
│   ├── exam.spec.ts                 # Playwright end-to-end (dist lokal)
│   └── public.spec.ts               # smoke test URL publik terdeploy
├── public/
│   ├── audio/q61.mp3 … q70.mp3      # 10 audio listening (MP3 asli)
│   └── images/
│       ├── stories/s1.svg … s5.svg   # gabungan 2x2 (pratinjau/review)
│       ├── stories/s1-1.svg … s5-4.svg # 20 panel tunggal (dipakai soal)
│       └── matching/m1-a.svg … m5-d.svg  # 20 gambar opsi
├── scripts/
│   ├── extract-data.mjs             # ekstrak bank soal dari spesifikasi
│   ├── generate-images.mjs          # produksi 45 SVG (+ validasi XML)
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
├── playwright.public.config.ts      # konfigurasi E2E URL publik
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
| 36–50 | `reading` | 15 | 7 bacaan, 1–3 pertanyaan per bacaan (`P1`–`P7`) |
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
   npm run assets:images    # tulis ulang 45 SVG + validasi parser XML
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

Situs adalah satu halaman berbasis state SPA (tanpa router path), jadi refresh pada URL apa pun
tidak menghasilkan 404 di GitHub Pages.

Workflow `.github/workflows/deploy.yml` menjalankan `npm ci`, `npm test -- --run`,
build dengan `GITHUB_PAGES=true`, lalu mengunggah `dist` ke GitHub Pages.

Langkah aktivasi (sekali saja, setelah repo memiliki commit di branch `main`):

1. Buka **Settings → Pages → Build and deployment**.
2. Pilih **Source = GitHub Actions**.
3. Buka tab **Actions**, tunggu job *Deploy N4 Website to GitHub Pages* hijau.
4. Situs live di `https://fayyadh678.github.io/TestTrialN4/`.

Status saat ini: Pages sudah diaktifkan (`build_type=workflow`) dan workflow sudah
berhasil deploy. Setiap `git push` ke `main` akan otomatis menerbitkan ulang.

Build lokal yang setara: `npm run build:pages`.

### 7.2 Vercel (opsi kedua, repo yang sama)

1. <https://vercel.com/new> → import `fayyadh678/TestTrialN4`.
2. Framework Preset: **Vite**; Root Directory: `./`; Build Command: `npm run build`;
   Output Directory: `dist`; Install Command: `npm ci`.
3. **Jangan** set `GITHUB_PAGES=true` (base harus `/`), lalu Deploy.
4. Catat domain `*.vercel.app` yang benar-benar diterbitkan Vercel.

Status saat ini: **belum dideploy ke Vercel**, jadi tidak ada URL Vercel yang diklaim.

Aplikasi memakai satu halaman dengan state SPA (tanpa router path), sehingga
refresh pada URL apa pun tidak menghasilkan 404 dan tidak memerlukan rewrite tambahan.

---

## 8. Status & URL publik

| Item | Nilai |
|---|---|
| Kode sumber (workspace lokal) | `TEST TRIAL N4/TestTrialN4/` |
| Repository | <https://github.com/fayyadh678/TestTrialN4> |
| Artefak build | `dist/` (`index.html` + `assets/` + `audio/` + `images/`) |
| **GitHub Pages (LIVE, terverifikasi)** | **<https://fayyadh678.github.io/TestTrialN4/>** |
| Workflow deploy | [Deploy N4 Website to GitHub Pages](https://github.com/fayyadh678/TestTrialN4/actions/workflows/deploy.yml) — run sukses |
| Vercel | Belum dideploy (opsi kedua, didokumentasikan pada 7.2) |

### Bukti verifikasi publik (23 Oktober 2026)

Pengujian dilakukan langsung ke <https://fayyadh678.github.io/TestTrialN4/>:

| Pemeriksaan | Hasil |
|---|---|
| `index.html` | HTTP **200**, memuat `assets/index-*.js` & `assets/index-*.css` di bawah `/TestTrialN4/` |
| 10 audio (`/TestTrialN4/audio/q61..q70.mp3`) | **200**, `audio/mp3` — seluruh 10 lolos, 0 byte rusak |
| 5 gabungan cerita (`stories/s1..s5.svg`) | **200**, `image/svg+xml` |
| 20 panel cerita (`stories/s1-1..s5-4.svg`) | **200**, `image/svg+xml` |
| 20 gambar opsi (`matching/m1-a..m5-d.svg`) | **200**, `image/svg+xml` |
| Total 60 aset diuji | **semua 200 & non-kosong** |
| E2E publik (`npm run test:e2e:public`; Chromium, WebKit/Safari, Pixel 7) | **12/12 lulus**, tanpa satu pun respons ≥400 |
| 70 soal dijawab di situs live lalu submit + review 70 kartu | **lulus** |
| Audio publik diputar nyata di browser (`paused=false`, `currentTime>0`, `duration>1`) | **lulus di Chromium, WebKit/Safari, dan mobile** |
| 4 panel cerita termuat (`naturalWidth > 100` untuk tiap panel) | **lulus** |
| Refresh langsung pada URL publik | **200**, bukan 404 |

### Status verifikasi lokal

- [x] `npm test` lulus: **58/58** (6 berkas test).
- [x] `npm run build` sukses (TypeScript `--noEmit` + Vite, tanpa error).
- [x] `npm run test:e2e` lulus: **48/48** di Chromium dan **WebKit (mesin Safari)**, plus
      emulasi tablet iPad Mini 768px dan Pixel 7 412px, termasuk verifikasi base path `/TestTrialN4/`.
- [x] GitHub Actions: `Install`, `Test`, `Build (GitHub Pages base path)`,
      `Configure Pages`, `Upload dist`, dan `Deploy` semuanya **success**.
- [x] 70 soal termuat dalam 6 kategori dengan 4 pilihan A–D dan kunci.
- [x] 7 bacaan (1–3 soal per bacaan, total 15); 20 panel cerita terpisah + 5 gabungan;
      5 × 4 SVG opsi matching.
- [x] 10 MP3 listening playable (semua frame MPEG valid, 0 byte rusak, HTTP 200, serta
      pemutaran nyata di browser Chromium, WebKit/Safari, dan mobile).
- [x] Timer berbasis `deadlineAt`, jawaban & play count bertahan setelah refresh, auto-submit saat waktu habis.
- [x] Tidak ada kunci/pembahasan/transkrip di DOM selama ujian (diuji otomatis).
- [x] Responsif: diuji pada 360, 412, 768, 820, 1023, dan ≥1024px, tanpa scroll horizontal;
      mini-navigasi hanya tampil di samping pada desktop ≥1024px.

**Tidak ada URL Vercel yang diklaim**, karena belum ada deployment Vercel yang dilakukan.

---

## 9. Authoring aset

### Gambar (45 SVG)

- **20 panel cerita** (`public/images/stories/s1-1.svg`–`s5-4.svg`): satu file per panel,
  berukuran 300×300 dengan viewBox persegi yang dihitung otomatis dari isi gambar
  sehingga ilustrasi selalu memenuhi bingkai (tidak kecil di tengah). Nomor panel
  tercetak di pojok kiri atas.
- **5 gabungan cerita** (`s1.svg`–`s5.svg`): susunan 2×2 dari keempat panel, dipakai
  sebagai pratinjau/review.
- **20 gambar opsi** (`public/images/matching/m1-a.svg`–`m5-d.svg`): setiap set M1–M5
  memiliki empat gambar yang benar-benar berbeda.
- Palet dan gaya vektor konsisten; tidak ada teks yang membocorkan kunci jawaban.
- Objek penting (mis. kucing vs anjing) dibedakan lewat bentuk, warna, dan posisi —
  bukan detail kecil yang sulit dilihat.

Regenerasi: `npm run assets:images` (skrip memvalidasi XML, menolak atribut ganda,
dan memastikan setiap panel punya nomor yang benar).

### Audio (10 MP3)

- Naskah ada di `src/data/listeningScripts.json` (label `女の人：`/`男の人：`/`先生：`/`学生：`
  dipakai **hanya** untuk memilih suara, tidak dibacakan).
- Suara TTS: `ja-JP-NanamiNeural` (perempuan) dan `ja-JP-KeitaNeural` (laki-laki),
  laju `-10%`, tanpa musik latar.
- Jeda antar penutur disisipkan sebagai frame MP3 senyap yang **memakai header identik**
  dengan output TTS (MPEG-2 Layer III, 48 kbps, 24 kHz, mono). Header yang salah membuat
  decoder kehilangan sinkronisasi dan audio terdengar rusak.
- Regenerasi: `npm run assets:audio` — skrip mem-parse ulang hasil gabungan dan **gagal**
  jika ada satu byte pun yang tidak terparse sebagai frame MPEG, sehingga audio rusak
  tidak bisa lolos lagi. Hasilnya dikomit sebagai berkas statis, jadi website tetap
  berjalan tanpa API key maupun layanan TTS saat runtime.

---

## 10. Catatan privasi dan keterbatasan

- `localStorage` hanya menyimpan: `schemaVersion`, `status`, `answers`, `startedAt`, `deadlineAt`,
  `audioPlayCount`, `completedAt`, `lastIndex`. Tidak ada nama, email, atau data pribadi.
- Karena ini situs statis, data yang dibundel ke klien (termasuk kunci jawaban) secara teknis
  dapat ditemukan lewat developer tools. Ini latihan, bukan ujian terproktor.
- Tidak ada backend, database, atau layanan berbayar.
- Batas 2 kali pemutaran audio adalah pembatas antarmuka untuk latihan, bukan proteksi anti-curang.
- Halaman tes Safari memakai mesin **WebKit** Playwright, bukan Safari asli di macOS/iOS.
  Perilaku keduanya sangat dekat, namun verifikasi akhir pada perangkat Safari nyata
  tetap disarankan.

---

## 11. Lisensi konten

Seluruh soal, bacaan, naskah listening, dan ilustrasi dalam repo ini dibuat orisinal untuk
latihan dan tidak menyalin bank soal resmi yang berhak cipta.