export class HttpError extends Error {
  public readonly status: number;
  public readonly safeMessage: string;

  constructor(status: number, safeMessage: string, message?: string) {
    super(message ?? safeMessage);
    this.status = status;
    this.safeMessage = safeMessage;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}
