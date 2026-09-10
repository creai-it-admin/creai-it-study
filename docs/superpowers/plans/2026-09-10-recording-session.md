# Recording-led sessions and HTML decks

Goal: replace segment control with record/pause/resume/end, preserve free access to materials and submissions, upload interactive HTML decks, and publish session transcript/summary.
Approved design: user instructions in this conversation. No feedback, payments, cohort management, or posting features.

- [x] Add additive session/recording storage and test legal transitions, recorder ownership, retries, and end preconditions against local PostgreSQL. Preserve existing records and segment history without using segments in the new flow.
- [x] Replace PDF sign/confirm/view with validated HTML upload and an authenticated, sandboxed iframe. Reject arbitrary paths and test active HTML cannot access the app origin.
- [x] Remove segment-based routing/timers from participant and operator screens. Keep submission/sharing controls and free navigation, including after session end to records.
- [x] Add microphone recording, pause/resume/end, durable local upload queue, retry and interruption recovery. End only after captured parts are confirmed saved. Use one recording tab and serialize recording control on the server.
- [x] Add private audio storage, authenticated playback, transcription and summary processing with persisted progress/retries. Model provider requires user selection and credentials; never present a mock result as a real transcript.
- [x] Test full HTTP and browser flows with synthetic fixtures, typecheck/build, verify isolation and authorization, then apply reviewed additive schema changes and return the running app.

Implementation boundaries: lib/session-state.ts + lib/session-control.ts own session state; lib/storage.ts owns Supabase objects; lib/recording-queue.ts + components/SessionRecorder.tsx own browser capture; lib/recording-processing.ts owns model calls and resumable processing; app/sessions/[id] provides recordings and summaries.

Verification: 37 automated tests, isolated PostgreSQL lifecycle integration, typecheck and production build passed. HTTP integration used private Supabase storage and real OpenAI transcription/summary on synthetic speech. Browser checks confirmed interactive HTML isolation, MediaRecorder rotation/finalization and IndexedDB reload recovery. Additive migration applied to the configured DB with existing row preservation and public-role isolation checks. Local app returned to its configured database on port 3010. Physical microphone and a full two-hour session were not exercised.
