export interface SoftDeleteHelpers {
  markDeleted<T extends { deletedAt?: Date | null }>(record: T): T;
  isDeleted<T extends { deletedAt?: Date | null }>(record: T): boolean;
}

export const softDeleteHelpers: SoftDeleteHelpers = {
  markDeleted(record) {
    return { ...record, deletedAt: new Date() };
  },
  isDeleted(record) {
    return Boolean(record.deletedAt);
  },
};
