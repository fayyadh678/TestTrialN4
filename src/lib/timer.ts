/**
 * Format countdown ujian.
 * Spesifikasi meminta `MM:SS` (mis. 115:00 untuk 115 menit) atau `HH:MM:SS`.
 * Di sini dipakai total menit:detik supaya durasi 115 menit tampil sebagai "115:00".
 */
export function formatClock(msRemaining: number): string {
  const clamped = Math.max(0, Math.floor(msRemaining / 1000));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function isExpired(deadlineAt: number | null, now: number): boolean {
  return deadlineAt != null && now >= deadlineAt;
}