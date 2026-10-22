import { useCallback, useEffect, useRef, useState } from 'react';
import { audioUrl } from '../lib/assets';
import { MAX_AUDIO_PLAYS } from '../lib/constants';

type Props = {
  /** Path relatif audio, mis. "audio/q61.mp3". */
  src: string;
  /** Jumlah pemutaran yang sudah tercatat untuk soal ini. */
  playsUsed: number;
  /** Dipanggil saat audio benar-benar mulai diputar (bukan saat tombol ditekan). */
  onPlayStarted: () => void;
  /** Mode review: pengulangan tanpa batas dan transkrip boleh tampil. */
  unlimited?: boolean;
  label: string;
};

type Status = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

/**
 * Pemutar audio untuk soal listening.
 * - Play count dihitung saat suara benar-benar mulai diputar.
 * - Mode simulasi: maksimum 2 kali pemutaran per soal.
 * - Error audio ditampilkan jelas + tombol coba lagi.
 */
export function AudioPlayer({ src, playsUsed, onPlayStarted, unlimited = false, label }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const url = audioUrl(src);

  const remaining = unlimited ? Number.POSITIVE_INFINITY : Math.max(0, MAX_AUDIO_PLAYS - playsUsed);
  const exhausted = remaining <= 0;
  const isPlaying = status === 'playing';

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.pause();
    setStatus('idle');
    setErrorMessage(null);
  }, [url]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const handlePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (exhausted) return;

    setErrorMessage(null);
    if (status !== 'paused') setStatus('loading');

    try {
      // Muat dulu supaya kegagalan file tidak dihitung sebagai pemutaran.
      if (audio.readyState === 0) audio.load();
      await audio.play();
      if (!unlimited) onPlayStarted();
    } catch {
      setStatus('error');
      setErrorMessage('Audio tidak dapat diputar. Periksa koneksi lalu coba lagi.');
    }
  }, [exhausted, onPlayStarted, status, unlimited]);

  const handlePause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  return (
    <section className="audio-player" aria-label={label}>
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onPlaying={() => setStatus('playing')}
        onPause={() => setStatus((s) => (s === 'ended' || s === 'error' ? s : 'paused'))}
        onEnded={() => setStatus('ended')}
        onError={() => {
          setStatus('error');
          setErrorMessage('Audio tidak dapat dimuat. Coba lagi atau hubungi pengajar.');
        }}
        data-testid="audio-element"
      />
      <div className="audio-player__row">
        {isPlaying ? (
          <button type="button" className="button button--secondary" onClick={handlePause} data-testid="audio-pause">
            Jeda audio
          </button>
        ) : (
          <button
            type="button"
            className="button button--primary"
            onClick={handlePlay}
            disabled={exhausted}
            data-testid="audio-play"
          >
            {status === 'paused' ? 'Lanjutkan audio' : 'Putar audio'}
          </button>
        )}
        <p className="audio-player__counter" data-testid="audio-counter">
          {unlimited
            ? 'Mode review: pemutaran tanpa batas.'
            : exhausted
              ? 'Batas pemutaran (2 kali) sudah habis untuk soal ini.'
              : `Sisa pemutaran: ${remaining} dari ${MAX_AUDIO_PLAYS}.`}
        </p>
      </div>
      {status === 'loading' && <p className="audio-player__state">Memuat audio…</p>}
      {status === 'error' && errorMessage && (
        <p className="audio-player__state audio-player__state--error" role="alert">
          {errorMessage}
        </p>
      )}
    </section>
  );
}