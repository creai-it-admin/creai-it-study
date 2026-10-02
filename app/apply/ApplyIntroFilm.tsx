'use client';

import { useRef, useState } from 'react';
import styles from './apply.module.css';

export default function ApplyIntroFilm() {
  const video = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  return (
    <section className={styles.film} aria-labelledby="apply-film-title">
      <h2 id="apply-film-title">4주 교육, 50초로 미리 보기</h2>
      <div className={styles.filmFrame}>
        <video
          ref={video}
          src="/landing/foundation-intro.mp4"
          poster="/landing/foundation-intro-poster.jpg"
          controls
          playsInline
          preload="none"
          onPlay={() => setStarted(true)}
          aria-label="CREAI+IT 4주 Foundation 교육 소개 영상"
        >
          <track kind="captions" src="/landing/foundation-intro.ko.vtt" srcLang="ko" label="한국어 자막" />
          <a href="/landing/foundation-intro.mp4">교육 소개 영상 보기</a>
        </video>
        {!started && (
          <button
            type="button"
            className={styles.filmPlay}
            onClick={() => { void video.current?.play().catch(() => {}); }}
            aria-label="4주 교육 소개 영상 재생"
          >
            <span aria-hidden="true">▶</span> 소개 영상 보기
          </button>
        )}
      </div>
      <p>50초 · 한국어 내레이션 · 자막 제공</p>
    </section>
  );
}
