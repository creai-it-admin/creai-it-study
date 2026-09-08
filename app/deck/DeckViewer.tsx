"use client";

import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// 워커를 로컬에서 서빙한다. 카페 와이파이가 CDN을 못 잡아도 장표는 열려야 한다.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

/**
 * FR-401, FR-402, FR-403.
 * 넘기는 건 각자 한다. 다른 참가자 화면에 영향이 없다.
 */
export function DeckViewer({ url }: { url: string }) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [width, setWidth] = useState(900);

  useEffect(() => {
    const set = () => setWidth(Math.min(900, window.innerWidth - 60));
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);

  // 15초 안에 안 열리면 내려받기 링크를 보여준다. 워커가 조용히 죽는 경우가 있다.
  useEffect(() => {
    const id = setTimeout(() => {
      if (!ready) setFailed(true);
    }, 15000);
    return () => clearTimeout(id);
  }, [ready]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") setPage((p) => Math.min(numPages || 1, p + 1));
      if (e.key === "ArrowLeft") setPage((p) => Math.max(1, p - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [numPages]);

  // FR-403. 안 열리면 내려받는 링크를 보여준다.
  if (failed) {
    return (
      <div className="card p-10 text-center">
        <p className="mb-4 text-[14px] text-ink-2">장표를 화면에서 열지 못했습니다.</p>
        <div className="flex items-center justify-center gap-2">
          <button
            className="btn"
            onClick={() => {
              setFailed(false);
              setReady(false);
            }}
          >
            다시 시도
          </button>
          <a className="btn btn-primary" href={url} target="_blank" rel="noreferrer">
            장표 내려받기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <a className="text-[13px] text-ink-3 hover:text-ink-2" href={url} target="_blank" rel="noreferrer">
          내려받기
        </a>
      </div>

      <div className="card flex flex-col items-center gap-4 p-4">
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => {
            setNumPages(numPages);
            setReady(true);
          }}
          onLoadError={() => setFailed(true)}
          loading={<div className="p-16 text-[13px] text-ink-3">장표를 여는 중</div>}
        >
          <Page pageNumber={page} width={width} renderAnnotationLayer={false} renderTextLayer={false} />
        </Document>

        <div className="flex items-center gap-4">
          <button className="btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            이전
          </button>
          <span className="font-en text-[13px] tabular-nums text-ink-2">
            {page} / {numPages || "-"}
          </span>
          <button
            className="btn"
            onClick={() => setPage((p) => Math.min(numPages || 1, p + 1))}
            disabled={!numPages || page >= numPages}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
