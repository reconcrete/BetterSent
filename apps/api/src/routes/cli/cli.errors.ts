export class DeviceCodeNotFoundError extends Error {
  constructor(message = "Device code not found") {
    super(message);
    this.name = "DeviceCodeNotFoundError";
  }
}

export class DeviceCodeExpiredError extends Error {
  constructor(message = "This login attempt has expired. Run `bettersent login` again.") {
    super(message);
    this.name = "DeviceCodeExpiredError";
  }
}

export class AuthorizationPendingError extends Error {
  constructor(message = "Authorization pending") {
    super(message);
    this.name = "AuthorizationPendingError";
  }
}

export class AuthorizationDeniedError extends Error {
  constructor(message = "Authorization was denied") {
    super(message);
    this.name = "AuthorizationDeniedError";
  }
}
