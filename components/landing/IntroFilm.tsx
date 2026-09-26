'use client';
import {useEffect, useRef, useState} from 'react';

/**
 * Foundation film. Plays muted only while on screen (nothing downloads until then); turning the sound on
 * restarts it from the top so the narration makes sense. Reduced-motion users see the poster until they press play.
 */
export function IntroFilm() {
  const video = useRef<HTMLVideoElement>(null);
  const [sound, setSound] = useState(false);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    v.muted = true;
    const sync = () => setSound(!v.muted);
    v.addEventListener('volumechange', sync);
    let observer: IntersectionObserver | undefined;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) void v.play().catch(() => {});
        else v.pause();
      }, {threshold: 0.4});
      observer.observe(v);
    }
    return () => {
      observer?.disconnect();
      v.removeEventListener('volumechange', sync);
    };
  }, []);

  function toggleSound() {
    const v = video.current;
    if (!v) return;
    if (v.muted) {
      v.muted = false;
      v.loop = false;
      v.currentTime = 0;
      void v.play().catch(() => {});
    } else {
      v.muted = true;
      v.loop = true;
    }
  }

  return (
    <>
      <div className="film-frame">
        <video ref={video} src="/landing/foundation-intro.mp4" poster="/landing/foundation-intro-poster.jpg" muted loop playsInline preload="none" controls
          aria-label="CREAI+IT Foundation 교육 소개 영상">
          <track kind="captions" src="/landing/foundation-intro.ko.vtt" srcLang="ko" label="한국어 자막" />
        </video>
      </div>
      <div className="film-meta">
        <button type="button" className="film-sound" aria-pressed={sound} onClick={toggleSound}>
          {sound ? '소리 끄기' : '소리 켜고 처음부터 보기'}
        </button>
        <span>50초 · 한국어 내레이션 · 자막 제공</span>
      </div>
    </>
  );
}
