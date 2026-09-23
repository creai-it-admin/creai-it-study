# 공통 교육 자료실

운영진 경로: `/routes/admin/library`. Foundation OT와 1–4주차의 완성된 단일 HTML을 관리한다.

- `LibraryAsset`: 자료의 제목·주차 구분. 기수와 독립적이다.
- `LibraryVersion`: 자료별 순번·비공개 저장소 경로·변경 설명. 등록 이후 수정하지 않고 새 버전을 추가한다. 동시 등록과 재시도는 자료 단위 잠금과 버전 ID로 처리한다.
- 기수 적용: 선택한 버전 파일을 기존 기수/회차 저장 경로에 복사한다. `Study.otSourceVersionId` / `SessionMaterial.sourceVersionId`로 출처를 남긴다. 공통 자료가 갱신되어도 기수는 바뀌지 않는다. 수동 파일 교체는 출처 연결을 해제한다.

OT는 기존 OT 교체를 명시하고 현재 경로가 일치할 때 적용한다. 교육 자료는 준비 중인 해당 주차에 추가한다. 동일 버전을 반복 적용해도 중복 생성하지 않는다. 이전 버전으로도 다시 적용할 수 있다.

인증은 기존 Auth.js의 현재 DB 역할 검사, 파일 열람은 기존 sandbox CSP를 사용한다. 원본은 운영진 전용이고, 복사된 자료는 기존 기수 멤버 권한을 따른다. 신규 테이블은 RLS를 활성화하고 Supabase anon/authenticated 직접 접근을 허용하지 않는다.

DB 변경: `prisma/migrations/202609220002_resource_library`. 기존 Prisma 배포 흐름을 따른다.

검증: `RUN_LIBRARY_QA=1 node --import tsx --test tests/library.integration.ts`. localhost:3010과 현재 설정된 DB/저장소를 사용하며, 테스트가 만든 임시 행과 파일만 정리한다.
