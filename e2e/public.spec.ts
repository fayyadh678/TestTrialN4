import { expect, test } from '@playwright/test';

/**
 * Smoke test end-to-end terhadap URL publik yang benar-benar sudah dideploy.
 * Semua permintaan aset harus 200 (tidak boleh ada 404 pada base path GitHub Pages).
 */

test.describe('Situs publik yang sudah dideploy', () => {
  test('beranda tampil, seluruh 70 soal, 25 gambar, dan 10 audio dapat dimuat', async ({ page }) => {
    const failedRequests: string[] = [];
    page.on('response', (response) => {
      if (response.status() >= 400) failedRequests.push(`${response.status()} ${response.url()}`);
    });

    await page.goto('./');
    await expect(page.getByRole('heading', { name: 'Simulasi JLPT N4' })).toBeVisible();
    await expect(page.getByTestId('landing-meta')).toContainText('70 Soal');
    await expect(page.getByTestId('start-exam')).toBeVisible();

    // Muat semua aset langsung dari URL publik (base path /TestTrialN4/ ikut teruji).
    const assets = await page.evaluate(async () => {
      const prefix = window.location.pathname.replace(/\/+$/, '/');
      const list: string[] = [];
      for (let i = 61; i <= 70; i += 1) list.push(`${prefix}audio/q${i}.mp3`);
          for (let i = 1; i <= 5; i += 1) {
            list.push(`${prefix}images/stories/s${i}.svg`);
            for (let panel = 1; panel <= 4; panel += 1) {
              list.push(`${prefix}images/stories/s${i}-${panel}.svg`);
            }
          }
          for (let m = 1; m <= 5; m += 1) {
            for (const c of ['a', 'b', 'c', 'd']) list.push(`${prefix}images/matching/m${m}-${c}.svg`);
      }
          const out: { url: string; status: number; size: number }[] = [];
          for (const url of list) {
            const response = await fetch(url);
            out.push({ url, status: response.status, size: (await response.arrayBuffer()).byteLength });
          }
          return out;
        });

        expect(assets).toHaveLength(60);
    for (const asset of assets) {
      expect(asset.status, `${asset.url} harus 200`).toBe(200);
      expect(asset.size, `${asset.url} tidak boleh kosong`).toBeGreaterThan(200);
    }

    // Kerjakan seluruh 70 soal pada situs publik.
    await page.evaluate(() => window.localStorage.clear());
    await page.getByTestId('start-exam').click();
    for (let n = 1; n <= 70; n += 1) {
      await expect(page.getByTestId(`question-${n}`)).toBeVisible();
      const imageChoice = page.getByTestId(`image-choice-${n}-A`);
      if ((await imageChoice.count()) > 0) await page.getByTestId(`image-choice-${n}-B`).click();
      else await page.getByTestId(`choice-${n}-A`).click();
      if (n < 70) await page.getByTestId('next-question').click();
    }

    await page.getByTestId('finish-bottom').click();
    await page.getByTestId('confirm-finish').click();
    await expect(page.getByTestId('result-score')).toBeVisible();
    await page.getByTestId('go-review').click();
    await expect(page.getByTestId('review-count')).toContainText('70');

    expect(failedRequests, `Permintaan gagal:\n${failedRequests.join('\n')}`).toHaveLength(0);
  });

  test('audio publik benar-benar dapat diputar di browser', async ({ page }) => {
      const failedRequests: string[] = [];
      page.on('response', (response) => {
        if (response.status() >= 400) failedRequests.push(`${response.status()} ${response.url()}`);
      });

      await page.goto('./');
      await page.evaluate(() => window.localStorage.clear());
      await page.getByTestId('start-exam').click();
      await page.getByTestId('open-navigator').click();
      await page.getByTestId('nav-62').click();

      const audioSource = await page.getByTestId('audio-element').getAttribute('src');
      expect(audioSource).toMatch(/audio\/q62\.mp3$/);

      // Metadata audio (durasi) harus tersedia dari jaringan publik.
      await expect
        .poll(
          async () =>
            page.evaluate(() => {
              const audio = document.querySelector('audio');
              return audio && Number.isFinite(audio.duration) ? audio.duration : 0;
            }),
          { timeout: 60_000 },
        )
        .toBeGreaterThan(1);

      await page.getByTestId('audio-play').click();

      // Playback nyata: waktu berjalan dan tidak dijeda.
      await expect
        .poll(
          async () =>
            page.evaluate(() => {
              const audio = document.querySelector('audio');
              return audio ? { paused: audio.paused, currentTime: audio.currentTime } : null;
            }),
          { timeout: 60_000 },
        )
        .toMatchObject({ paused: false });

      await expect
        .poll(
          async () =>
            page.evaluate(() => {
              const audio = document.querySelector('audio');
              return audio ? audio.currentTime : 0;
            }),
          { timeout: 60_000 },
        )
        .toBeGreaterThan(0);

      expect(failedRequests, `Permintaan gagal:\n${failedRequests.join('\n')}`).toHaveLength(0);
    });

  test('gambar cerita publik termuat secara visual', async ({ page }) => {
    await page.goto('./');
    await page.evaluate(() => window.localStorage.clear());
    await page.getByTestId('start-exam').click();
    await page.getByTestId('open-navigator').click();
    await page.getByTestId('nav-55').click();

      // Empat panel terpisah, masing-masing harus benar-benar termuat.
      const panels = page.locator('[data-testid="story-panels-S5"] img');
      await expect(panels).toHaveCount(4);
      for (let index = 0; index < 4; index += 1) {
        await expect
          .poll(async () => panels.nth(index).evaluate((el) => (el as HTMLImageElement).naturalWidth))
          .toBeGreaterThan(100);
      }

      await page.getByTestId('open-navigator').click();
      await page.getByTestId('nav-60').click();
      const option = page.locator('.image-choice__image img').first();
      await expect(option).toBeVisible();
      await expect.poll(async () => option.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(100);
    });

  test('refresh langsung pada URL publik tidak menghasilkan 404', async ({ page }, testInfo) => {
    await page.goto('./');
    await expect(page.getByRole('heading', { name: 'Simulasi JLPT N4' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Simulasi JLPT N4' })).toBeVisible();

    const response = await page.goto('./');
    expect(response!.status()).toBe(200);
      expect(testInfo.project.use.baseURL).toBeTruthy();
      expect(page.url()).toContain(testInfo.project.use.baseURL!.replace(/^https?:\/\//, ''));
    });
});