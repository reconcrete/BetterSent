export class UsageLimitError extends Error {
  constructor(
    message: string,
    public readonly limit: number,
    public readonly used: number,
  ) {
    super(message);
    this.name = "UsageLimitError";
  }
}

export class FeatureLockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeatureLockedError";
  }
}
