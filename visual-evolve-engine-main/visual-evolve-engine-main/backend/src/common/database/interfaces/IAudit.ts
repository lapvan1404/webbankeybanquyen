export interface AuditEntry {
  action: string;
  entity: string;
  actorId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

export interface IAuditHelper {
  createAuditEntry(entry: AuditEntry): Promise<void>;
}
