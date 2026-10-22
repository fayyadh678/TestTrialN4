import { CATEGORY_LABELS, CATEGORY_RANGES, EXAM_DURATION_MINUTES, TOTAL_QUESTIONS } from '../lib/constants';

type Props = {
  hasSavedProgress: boolean;
  onStart: () => void;
  onResume: () => void;
  onRestart: () => void;
};

export function Landing({ hasSavedProgress, onStart, onResume, onRestart }: Props) {
  return (
    <main className="page page--landing">
      <div className="landing">
        <header className="landing__hero">
          <p className="landing__eyebrow">Simulasi tidak resmi</p>
          <h1 className="landing__title">Simulasi JLPT N4</h1>
          <p className="landing__lede">
            Latihan 70 soal kosakata, tata bahasa, bacaan, gambar, dan listening dalam satu sesi
            berwaktu.
          </p>
          <p className="landing__meta" data-testid="landing-meta">
            {TOTAL_QUESTIONS} Soal • {EXAM_DURATION_MINUTES} Menit • 4 Pilihan
          </p>
        </header>

        {hasSavedProgress ? (
          <section className="landing__resume" aria-label="Progres tersimpan">
            <p className="landing__resume-text">
              Ada sesi latihan yang tersimpan di perangkat ini. Lanjutkan sesi tersebut, atau mulai
              dari awal.
            </p>
            <div className="landing__resume-actions">
              <button type="button" className="button button--primary button--lg" onClick={onResume} data-testid="resume-exam">
                Lanjutkan ujian
              </button>
              <button type="button" className="button button--secondary" onClick={onRestart} data-testid="restart-exam">
                Mulai dari awal
              </button>
            </div>
          </section>
        ) : (
          <button type="button" className="button button--primary button--lg" onClick={onStart} data-testid="start-exam">
            Mulai Simulasi
          </button>
        )}

        <section className="landing__sections" aria-labelledby="landing-sections-title">
          <h2 id="landing-sections-title" className="section-title">
            Komposisi 70 soal
          </h2>
          <ul className="landing__list" data-testid="landing-composition">
            {CATEGORY_RANGES.map((range) => (
              <li key={range.type}>
                <span className="landing__list-range">
                  {String(range.from).padStart(2, '0')}–{String(range.to).padStart(2, '0')}
                </span>
                <span className="landing__list-label">{CATEGORY_LABELS[range.type]}</span>
                <span className="landing__list-count">{range.to - range.from + 1} soal</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="landing__notes" aria-labelledby="landing-notes-title">
          <h2 id="landing-notes-title" className="section-title">
            Sebelum mulai
          </h2>
          <ul className="landing__notes-list">
            <li>
              Waktu pengerjaan {EXAM_DURATION_MINUTES} menit dengan hitung mundur. Jawaban dan sisa
              waktu tersimpan otomatis, jadi aman jika halaman di-refresh.
            </li>
            <li>
              Bagian <strong>Mendengarkan</strong>: putar audio lalu pilih jawaban. Transkrip tidak
              ditampilkan selama ujian dan setiap soal maksimal diputar 2 kali.
            </li>
            <li>
              Kunci jawaban, pembahasan, dan transkrip hanya muncul di halaman review setelah
              simulasi diselesaikan.
            </li>
            <li>
              Ini simulasi tidak resmi untuk latihan, bukan sistem <em>scaled score</em> JLPT dan
              bukan penentu lulus/gagal.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}