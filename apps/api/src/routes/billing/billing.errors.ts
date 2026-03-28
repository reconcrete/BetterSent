export class UsageLimitError extends Error {
  readonly limit: number;
  readonly used: number;

  constructor(message: string, limit: number, used: number) {
    super(message);
    this.name = "UsageLimitError";
    this.limit = limit;
    this.used = used;
  }
}

export class FeatureLockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeatureLockedError";
  }
}
