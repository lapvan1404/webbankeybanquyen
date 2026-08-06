export interface OptimisticLockHelpers {
  withVersion<T extends { version?: number | null }>(record: T, version?: number | null): T;
  bumpVersion<T extends { version?: number | null }>(record: T): T;
}

export const optimisticLockHelpers: OptimisticLockHelpers = {
  withVersion(record, version) {
    return { ...record, version: version ?? record.version ?? 0 };
  },
  bumpVersion(record) {
    return { ...record, version: (record.version ?? 0) + 1 };
  },
};
