# Membership and member experience verification

- [x] Set password minimum to the user-approved 10 characters consistently in server validation and forms.
- [x] Add StudyMembership and enforce participant membership for study/session materials, recording results, live state, attendance, submissions and sharing. Keep admin access; show assigned studies on home.
- [x] Create the requested participant and assign study-zero. Verify actual login, admin/other-study denial, and exercise the prepared week-one form in an isolated local database with synthetic answers; report concrete UX findings without starting the real week-one session.

Verified real account registration/login, member-only role, single-study assignment and real deck access. Local PostgreSQL verified membership grant/revocation and administrator access. Isolated browser verification persisted six synthetic answers through autosave/reload/resubmission and blocked another study. UX findings: rehearsal takes priority on home, dense single-paragraph instructions, and empty submission accepted. Actual week one remains scheduled with no submissions.
