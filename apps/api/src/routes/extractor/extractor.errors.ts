export class KindleEmailNotConfiguredError extends Error {
  constructor(
    message = "No Kindle email configured. Please add a Kindle email in settings.",
  ) {
    super(message);
    this.name = "KindleEmailNotConfiguredError";
  }
}
