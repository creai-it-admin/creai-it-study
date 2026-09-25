# 블로그 운영

- 공개 목록: `/blog` (12개씩), 공개 글: `/blog/[slug]`
- 운영실: `/routes/admin/blog` → 새 글 작성 → 초안 저장 → 미리보기 → 발행
- HTML 본문을 붙여넣거나 `.html` 파일(200KB 이하)을 가져옵니다. 표지·본문 이미지는 HTTPS URL로 지정합니다.
- 소제목, 문단, 목록, 인용, 이미지, 표, 코드 블록은 저널의 공통 반응형 디자인을 따릅니다. 스크립트·iframe·개별 CSS는 제거됩니다.
  - 첫 문단은 리드 문단으로 크게 표시되고, 문단 안의 `<strong>`은 형광펜 강조로 표시됩니다.
  - 모든 항목이 `<strong>제목</strong><br/>설명`으로 시작하는 번호 목록(`<ol>`)은 번호가 붙은 단계 카드로 표시됩니다.
  - 내용 전체를 `<strong>`으로 감싼 인용(`<blockquote><strong>…</strong></blockquote>`)은 가운데 정렬된 선언문 패널로 표시됩니다.
  - 도식 SVG는 `<img>`로 불러오면 웹폰트를 쓸 수 없으므로, 필요한 글리프만 추린 Pretendard를 SVG 안에 넣어 둡니다(예: `public/landing/journal/ai-native/human-ai-workflow.svg`).
- 초안과 공개본은 분리됩니다. 공개된 글을 수정해 저장해도 `수정본 발행` 전에는 방문자에게 반영되지 않습니다.
- 비공개 전환 시 공개 URL은 404가 되고 목록과 사이트맵에서도 제외됩니다. 초안은 유지됩니다.
- 첫 발행 이후 주소는 고정됩니다. 표지 없이도 글을 발행할 수 있습니다.

## 배포·검증

새 환경에서는 `npm run db:deploy` → `npm run build` 순서로 실행합니다. 데이터는 기존 PostgreSQL의 `BlogPost` 테이블에 저장됩니다. `SITE_URL`은 검색/공유용 절대 주소의 기준이며 기본값은 현재 Vercel 프로덕션 주소입니다.

`npm test`로 HTML 정제·입력 검증을 확인합니다. localhost:3010 실행 후 `npm run test:blog:integration`은 임시 계정·글로 권한, 발행, 수정본 격리, 비공개 전환을 검증하고 테스트 데이터를 제거합니다. 실제 첫 글은 별도로 기획 후 발행합니다.
