import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const STORAGE_KEY = 'n4-exam-state-v1';

async function startExam(page: Page) {
  await page.goto('./');
  await page.getByTestId('start-exam').click();
  await expect(page.getByTestId('question-1')).toBeVisible();
}
test.describe('Alur simulasi end-to-end', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./');
    await page.evaluate(() => window.localStorage.clear());
  });

  test('beranda menampilkan informasi utama dan komposisi 70 soal', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByRole('heading', { name: 'Simulasi JLPT N4' })).toBeVisible();
    await expect(page.getByTestId('landing-meta')).toContainText('70 Soal');
    await expect(page.getByTestId('landing-meta')).toContainText('115 Menit');
    await expect(page.getByTestId('landing-meta')).toContainText('4 Pilihan');
    await expect(page.getByTestId('landing-composition')).toContainText('Kosakata');
    await expect(page.getByTestId('landing-composition')).toContainText('Mendengarkan');
    await expect(page.getByTestId('start-exam')).toBeVisible();
  });

  test('mengerjakan seluruh 70 soal, submit, dan review lengkap', async ({ page }) => {
    await startExam(page);

    // 1) Jawab semua 70 soal lewat navigasi; verifikasi setiap soal dapat dirender.
    const seen = new Set<number>();
    for (let index = 0; index < 70; index += 1) {
      const questionNumber = index + 1;
      await expect(page.getByTestId(`question-${questionNumber}`)).toBeVisible();
      seen.add(questionNumber);

      const hasImageChoices = await page.getByTestId(`image-choice-${questionNumber}-A`).count();
      if (hasImageChoices > 0) {
        await page.getByTestId(`image-choice-${questionNumber}-C`).click();
      } else {
        await page.getByTestId(`choice-${questionNumber}-B`).click();
      }

      if (index < 69) await page.getByTestId('next-question').click();
    }
    expect(seen.size).toBe(70);

    // 2) Semua jawaban tersimpan di localStorage
    const savedCount = await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      return raw ? Object.keys(JSON.parse(raw).answers).length : 0;
    }, STORAGE_KEY);
    expect(savedCount).toBe(70);

    // 3) Selesaikan dengan dialog konfirmasi
    await page.getByTestId('finish-bottom').click();
    await expect(page.getByTestId('confirm-dialog')).toContainText('Semua soal sudah dijawab.');
    await page.getByTestId('confirm-finish').click();

    // 4) Halaman hasil
    await expect(page.getByTestId('result-score')).toBeVisible();
    await expect(page.getByTestId('result-percent')).toContainText('%');
    await expect(page.getByTestId('result-stats')).toContainText('Kosong');
    await expect(page.getByTestId('result-categories')).toContainText('/');

    // 5) Review: 70 kartu, kunci jawaban & pembahasan tampil
    await page.getByTestId('go-review').click();
    await expect(page.getByTestId('review-count')).toContainText('70');
    await expect(page.getByTestId('review-1')).toBeVisible();
    await expect(page.getByTestId('review-70')).toBeVisible();
    await expect(page.getByTestId('review-1')).toContainText('Kunci');

    // 6) Filter review
    await page.getByTestId('filter-correct').click();
    await expect(page.getByTestId('review-count')).toBeVisible();
    await page.getByTestId('filter-all').click();
    await expect(page.getByTestId('review-count')).toContainText('70');
  });

  test('mendengarkan audio soal 61 dimuat dengan benar dan batas 2 kali', async ({ page }) => {
    await startExam(page);
    await page.getByTestId('open-navigator').click();
    await page.getByTestId('nav-61').click();
    await expect(page.getByTestId('question-61')).toBeVisible();

    await expect(page.getByTestId('audio-counter')).toContainText('Sisa pemutaran: 2 dari 2');

    const audioSource = await page.getByTestId('audio-element').getAttribute('src');
    expect(audioSource).toMatch(/audio\/q61\.mp3$/);

    // File audio benar-benar dapat dimuat (bukan 404)
    const status = await page.evaluate(async (src) => {
      const response = await fetch(src, { method: 'GET' });
      return { status: response.status, size: (await response.arrayBuffer()).byteLength };
    }, audioSource!);
    expect(status.status).toBe(200);
    expect(status.size).toBeGreaterThan(1000);

      // Pemutaran nyata: hitung play count saat audio mulai berbunyi.
      await page.getByTestId('audio-play').click();
      await expect
        .poll(async () =>
          page.evaluate((key) => {
            const raw = window.localStorage.getItem(key);
            return raw ? (JSON.parse(raw).audioPlayCount.L1 ?? 0) : 0;
          }, STORAGE_KEY),
        )
        .toBe(1);

      const played = await page.evaluate(() => {
        const audio = document.querySelector('audio');
        return audio ? { paused: audio.paused, duration: audio.duration } : null;
      });
      expect(played).not.toBeNull();
      expect(played!.duration).toBeGreaterThan(1);
    });

  test('memuat 45 gambar (5 cerita gabungan + 20 panel + 20 opsi) tanpa 404', async ({ page }) => {
    const paths: string[] = [];
      for (let i = 1; i <= 5; i += 1) {
        paths.push(`images/stories/s${i}.svg`);
        for (let panel = 1; panel <= 4; panel += 1) paths.push(`images/stories/s${i}-${panel}.svg`);
    }
      for (let m = 1; m <= 5; m += 1) {
        for (const choice of ['a', 'b', 'c', 'd']) paths.push(`images/matching/m${m}-${choice}.svg`);
      }

      const base = process.env.E2E_PAGES_BASE === 'true' ? '/TestTrialN4/' : '/';
      await page.goto('./');
      const results = await page.evaluate(
        async ({ list, prefix }) => {
          const out: { path: string; status: number; size: number }[] = [];
          for (const item of list) {
            const response = await fetch(`${prefix}${item}`);
            out.push({ path: item, status: response.status, size: (await response.arrayBuffer()).byteLength });
          }
          return out;
        },
        { list: paths, prefix: base },
      );

      expect(results).toHaveLength(45);
      for (const item of results) {
        expect(item.status, `${item.path} harus 200`).toBe(200);
        expect(item.size, `${item.path} tidak boleh kosong`).toBeGreaterThan(200);
      }
    });

    test('memuat 10 berkas audio tanpa 404', async ({ page }) => {
      const paths = Array.from({ length: 10 }, (_, i) => `audio/q${61 + i}.mp3`);
      const base = process.env.E2E_PAGES_BASE === 'true' ? '/TestTrialN4/' : '/';
      await page.goto('./');
      const results = await page.evaluate(
        async ({ list, prefix }) => {
          const out: { path: string; status: number; size: number }[] = [];
          for (const item of list) {
            const response = await fetch(`${prefix}${item}`);
            out.push({ path: item, status: response.status, size: (await response.arrayBuffer()).byteLength });
          }
          return out;
        },
        { list: paths, prefix: base },
      );

      expect(results).toHaveLength(10);
      for (const item of results) {
        expect(item.status, `${item.path} harus 200`).toBe(200);
        expect(item.size, `${item.path} tidak boleh kosong`).toBeGreaterThan(1000);
      }
    });

  test('jawaban bertahan setelah refresh dan countdown tidak reset', async ({ page }) => {
    await startExam(page);
    await page.getByTestId('choice-1-D').click();
    await page.getByTestId('next-question').click();
    await page.getByTestId('choice-2-A').click();

    const before = await page.getByTestId('header-timer').textContent();
    await page.waitForTimeout(1500);
    await page.reload();

    await expect(page.getByTestId('resume-exam')).toBeVisible();
    await page.getByTestId('resume-exam').click();
    await expect(page.getByTestId('question-2')).toBeVisible();
    await expect(page.getByTestId('choice-2-A')).toHaveAttribute('aria-checked', 'true');
    await page.getByTestId('prev-question').click();
    await expect(page.getByTestId('choice-1-D')).toHaveAttribute('aria-checked', 'true');

    const after = await page.getByTestId('header-timer').textContent();
    expect(after).not.toEqual(before);
    const toSeconds = (text: string) => {
      const [m, s] = text!.split(':').map(Number);
      return m * 60 + s;
    };
    expect(toSeconds(after!)).toBeLessThan(toSeconds(before!));
  });

  test('dialog menampilkan soal belum dijawab dan bisa kembali', async ({ page }) => {
    await startExam(page);
    await page.getByTestId('choice-1-B').click();
    await page.getByTestId('finish-exam').click();
    await expect(page.getByTestId('confirm-dialog')).toContainText('Masih ada 69 soal belum dijawab.');
    await page.getByTestId('confirm-back').click();
    await expect(page.getByTestId('confirm-dialog')).toBeHidden();
    await expect(page.getByTestId('question-1')).toBeVisible();
  });

  test('soal reading menampilkan passage dan soal gambar menampilkan opsi gambar', async ({ page }) => {
    await startExam(page);
    await page.getByTestId('open-navigator').click();
    await page.getByTestId('nav-36').click();
    await expect(page.getByTestId('question-36')).toBeVisible();
    await expect(page.locator('.passage')).toContainText('アルバイト');

    await page.getByTestId('open-navigator').click();
    await page.getByTestId('nav-51').click();
      await expect(page.getByTestId('question-51')).toBeVisible();
      // Cerita kini tampil sebagai 4 panel terpisah agar jelas.
      await expect(page.getByTestId('story-panels-S1')).toBeVisible();
      const panels = page.locator('[data-testid="story-panels-S1"] img');
      await expect(panels).toHaveCount(4);
      await expect.poll(async () => panels.first().evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(100);
      await expect.poll(async () => panels.last().evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(100);

      await page.getByTestId('open-navigator').click();
      await page.getByTestId('nav-56').click();
      await expect(page.getByTestId('image-choice-56-A')).toBeVisible();
      await expect(page.getByTestId('image-choice-56-D')).toBeVisible();
      const optionImage = page.locator('.image-choice__image img').first();
      await expect(optionImage).toBeVisible();
      await expect
        .poll(async () => optionImage.evaluate((el) => (el as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(100);
    });

  test('tidak ada kebocoran kunci/transkrip di DOM selama ujian', async ({ page }) => {
    await startExam(page);
    const html = await page.content();
    expect(html).not.toContain('パンと卵を買おうと思いました');
    expect(html).not.toContain('駅（えき） berarti');
    expect(html).not.toContain('Transkrip');
  });

  test('auto-submit ketika waktu habis', async ({ page }) => {
    await page.goto('./');
    await page.evaluate((key) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          schemaVersion: 1,
          status: 'in_progress',
          answers: { '1': 'B' },
          startedAt: Date.now() - 200_000,
          deadlineAt: Date.now() - 1_000,
          audioPlayCount: {},
          completedAt: null,
          lastIndex: 0,
        }),
      );
    }, STORAGE_KEY);
    await page.reload();

    await expect(page.getByTestId('result-score')).toBeVisible();
    await expect(page.getByTestId('result-score')).toContainText('1');
    await expect(page.locator('.results__note')).toContainText('Waktu habis');
  });

  test('tata letak 360–1023px dapat dipakai, header terlihat, dan tanpa scroll horizontal', async ({ page }) => {
      await startExam(page);

      for (const width of [360, 412, 768, 820, 1023]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(page.getByTestId('header-timer')).toBeVisible();
        await expect(page.getByTestId('finish-exam')).toBeVisible();

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `scroll horizontal di ${width}px`).toBeLessThanOrEqual(1);

        // Navigator tidak boleh mengambil ruang vertikal pada lebar ini
        const inlineNavigator = await page.evaluate(() => {
          const nav = document.querySelector('.navigator');
          return nav ? getComputedStyle(nav).display : 'none';
        });
        expect(inlineNavigator, `navigator harus tersembunyi pada ${width}px`).toBe('none');
      }

      // Pada tablet/mobile, navigator dibuka lewat tombol sebagai panel overlay.
      await page.setViewportSize({ width: 412, height: 900 });
      const openNav = page.getByTestId('open-navigator');
      await expect(openNav).toBeVisible();
      const navButtonBox = await openNav.boundingBox();
      expect(navButtonBox!.height).toBeGreaterThanOrEqual(44);

      await openNav.click();
      await expect(page.getByTestId('question-navigator')).toBeVisible();
      await page.getByTestId('nav-10').click();
      await expect(page.getByTestId('question-10')).toBeVisible();

      const choice = page.getByTestId('choice-10-A');
      const box = await choice.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      const fontSize = await page.locator('.question__prompt').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
      expect(fontSize).toBeGreaterThanOrEqual(18);
    });

    test('pada desktop >= 1024px, mini-navigasi tampil di samping', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await startExam(page);

      const navigator = page.getByTestId('question-navigator');
      await expect(navigator).toBeVisible();

      const layout = await page.evaluate(() => {
        const nav = document.querySelector('.navigator')!;
        const body = document.querySelector('.exam-body')!;
        return {
          columns: getComputedStyle(body).gridTemplateColumns.split(' ').length,
          navVisible: getComputedStyle(nav).display !== 'none',
        };
      });
      expect(layout.navVisible).toBe(true);
      expect(layout.columns).toBe(2);
    });
});