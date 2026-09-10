# Study groups implementation

Goal: manage each four-week study as a parent object, with existing sessions and their records preserved.

- [x] Add Study and required StudySession.studyId with a per-study week uniqueness constraint. Backfill existing sessions into `study-zero` (0기 스터디), preserving rehearsal and all IDs. Update seed to scope lookups by study.
- [x] Add admin-only creation of a named study and four explicitly dated sessions in one transaction; validate name and strictly increasing real calendar dates. Add study list and detail pages, with rehearsal separate from weeks 1–4.
- [x] Preserve study context in run/preparation/results navigation and distinguish study names in participant history. Keep current authentication and single active session behavior; no enrollment or access-policy redesign.
- [x] Verify validation, authorization, creation atomicity, independent week numbering, migration preservation, browser navigation and existing checks. Apply migration and return local app on port 3010.

Verified: 39 unit/route regression tests, two local PostgreSQL integration cases, HTTP admin/member authorization and four-week creation, typecheck and production build. The configured DB migration preserved hashes of existing session, account, submission, answer, attendance, form and recording rows. Browser checks confirmed study list/detail/new-study navigation.
