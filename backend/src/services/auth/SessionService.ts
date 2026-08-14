export interface SessionContext {
  userId: string;
  role?: string;
}

export class SessionService {
  public createSessionContext(userId: string, role?: string): SessionContext {
    return { userId, role };
  }
}
