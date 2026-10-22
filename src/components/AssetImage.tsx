import { useEffect, useState } from 'react';
import { assetUrl } from '../lib/assets';

type Props = {
  /** Alt netral: tidak boleh membocorkan jawaban pada mode ujian. */
  alt: string;
  src: string;
  width?: number | string;
  height?: number | string;
  className?: string;
};

/** Gambar SVG aset dengan indikator loading dan pesan error yang jelas. */
export function AssetImage({ alt, src, width, height, className }: Props) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const url = assetUrl(src);

  useEffect(() => {
    setStatus('loading');
  }, [url]);

  return (
    <div className={className ? `asset-image ${className}` : 'asset-image'}>
        {status === 'error' ? (
          <span className="asset-image__state asset-image__state--error" role="alert">
            Gambar tidak dapat dimuat. {alt}
          </span>
        ) : (
          <>
            <img
              src={url}
              alt={alt}
              width={width}
              height={height}
              onLoad={() => setStatus('ready')}
              onError={() => setStatus('error')}
            />
            {status === 'loading' && <span className="asset-image__state">Memuat gambar…</span>}
          </>
      )}
    </div>
  );
}