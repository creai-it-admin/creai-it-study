# CREAI+IT EDU · Foundation OT

`index.html`은 폰트와 실행 코드를 포함한 7장짜리 단일 HTML 발표본입니다. 이 파일 하나로 전달하거나 HTML 장표 업로드에 사용할 수 있습니다.

- **이동:** ← / →, Home / End
- **목차:** G · **발표 노트:** N · **전체화면:** F (지원 브라우저)
- **문구·도형 수정:** `src/slides.jsx`
- **공통 디자인:** `src/components.jsx`, `theme.css`
- **기수별 정보:** `cohort.js`의 확정값만 입력. 빈 항목은 표시하지 않습니다.
- **재생성:** Next.js 앱 루트에서 `node docs/education/ot/build.cjs`

수정 후 재생성하면 `components.js`, `slides.js`, 개별 `slide-*.html`, 단일 `index.html`이 갱신됩니다. JSX는 사전에 컴파일하므로 발표 중 Babel이나 외부 CDN에 연결하지 않습니다.

검수: 일곱 장 브라우저 시각 확인, 키보드 이동·목차 선택·발표 노트 동작, 단일 파일의 외부 리소스 참조 없음 확인. 공통 자료실에 `Foundation OT · v1`으로 등록했습니다. 기존 0기 OT는 변경하지 않았습니다.

운영진: `/routes/admin/library`에서 조회·새 버전 등록·기수 적용. 원본을 수정한 뒤 새 버전으로 올려야 하며, 기존 기수의 자료는 자동으로 바뀌지 않습니다.
첫 등록 재실행: `npx tsx scripts/register-foundation-ot.ts` (이미 등록되어 있으면 유지).
