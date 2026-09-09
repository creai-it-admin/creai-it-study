export type Answers = Record<string, string>;
export type Draft = { answers: Answers; submit: boolean; version: string };
export type SaveResult = { version: string; submitted: boolean };
export class SaveError extends Error {
  constructor(message: string, public version?: string, public permanent = false) {
    super(message);
  }
}

/** One request at a time. Local edits are durable before the debounce starts. */
export class DraftSync {
  private draft: Draft;
  private generation = 0;
  private busy = false;
  private stopped = false;
  private blocked = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private retry: Draft | undefined;

  constructor(
    initial: Draft,
    private io: {
      write: (draft: Draft) => void;
      clear: () => void;
      send: (draft: Draft) => Promise<SaveResult>;
      status: (state: "saving" | "saved" | "failed", message?: string) => void;
      submitted: () => void;
    },
  ) {
    this.draft = { ...initial };
  }

  edit(answers: Answers, submit = false) {
    this.draft = { ...this.draft, answers, submit: this.draft.submit || submit };
    this.generation++;
    this.io.write(this.draft);
    // A conflict needs an explicit submission after the user has reviewed their text.
    if (submit) this.blocked = false;
    if (this.blocked) return;
    this.io.status("saving");
    this.schedule(submit ? 0 : 2000);
  }

  restore() { this.schedule(0); }

  private schedule(delay: number) {
    clearTimeout(this.timer);
    if (!this.stopped && !this.blocked) this.timer = setTimeout(() => void this.flush(), delay);
  }

  async flush() {
    if (this.busy || this.stopped || this.blocked) return;
    clearTimeout(this.timer);
    this.busy = true;
    const job = this.retry ?? { ...this.draft };
    const generation = this.generation;
    this.io.status("saving");
    try {
      const result = await this.io.send(job);
      this.retry = undefined;
      this.draft.version = result.version;
      if (result.submitted) this.io.submitted();
      if (this.stopped) return; // A remounted page owns the durable draft now.
      if (generation === this.generation && job.answers === this.draft.answers && job.submit === this.draft.submit) {
        this.draft.submit = false;
        this.io.clear();
        this.io.status("saved");
      } else {
        this.io.write(this.draft);
        this.schedule(0);
      }
    } catch (error) {
      if (this.stopped) return;
      if (error instanceof SaveError && error.permanent) {
        this.retry = undefined;
        this.blocked = true;
        if (error.version) this.draft.version = error.version;
        this.io.write(this.draft);
        this.io.status("failed", error.message);
      } else {
        // An aborted response may still have committed. Retry this exact version first.
        this.retry = job;
        this.io.status("failed");
        this.schedule(5000);
      }
    } finally {
      this.busy = false;
    }
  }

  stop() {
    this.stopped = true;
    clearTimeout(this.timer);
  }
}
