# ProductKey Revised Design & API Spec (Sprint 1)

IMPORTANT: This is a design-only update per your instructions. Do NOT modify `schema.prisma`, do NOT generate migrations, and do NOT write code until you explicitly approve.

## Goal

Provide an updated ProductKey schema and operational design reflecting your required revisions. This document contains the revised Prisma model (proposal), enums, relations, indexes, constraints, ERD, business and operational workflows, import flows, encryption/decryption, duplicate prevention, stock rules, and the exact schema changes required (not applied).

---

## Prisma `ProductKey` model (proposal)

```prisma
enum ProductKeyStatus { AVAILABLE RESERVED SOLD DISABLED }
enum ProductKeyAlgorithm { AES_256_GCM }

model ProductKey {
  id            String              @id @default(cuid())
  productId     String              @db.VarChar(191)
  product       Product             @relation(fields: [productId], references: [id], onDelete: NoAction)

n  // Encrypted payload
  encryptedKey  String              @db.Text
  keyHash       String              @db.VarChar(64)
  iv            String              @db.VarChar(32)
  algorithm     ProductKeyAlgorithm @default(AES_256_GCM)
  keyVersion    Int?

n  // Lifecycle & reservation
  status        ProductKeyStatus    @default(AVAILABLE)
  reservedUntil DateTime?
  assignedAt    DateTime?

n  // Assignment link
  orderItemId   String?             @db.VarChar(191)
  orderItem     OrderItem?          @relation(fields: [orderItemId], references: [id], onDelete: SetNull)

n  // Import metadata
  batchId       String?             @db.VarChar(191)
  importedAt    DateTime?

n  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt

n  @@index([productId, status])
  @@index([status])
  @@index([productId, keyHash])
  @@unique([productId, keyHash])
}
```

Notes:

- Relation `product` uses `onDelete: NoAction` to avoid cascading deletion of keys when a `Product` is removed; this requires explicit admin cleanup if a product is deleted.
- Field `encryptedKey` replaces `keyCipher` per your request.
- `assignedTo` and `deletedAt` have been removed; assignment is represented solely via `orderItemId` and `assignedAt`.
- `batchId` and `importedAt` are added for import tracking.
- Status enum simplified to `AVAILABLE`, `RESERVED`, `SOLD`, `DISABLED`.

---

## Enums

- `ProductKeyStatus`: `AVAILABLE`, `RESERVED`, `SOLD`, `DISABLED`.
- `ProductKeyAlgorithm`: `AES_256_GCM` (extendable).

---

## Relations

- `ProductKey.productId -> Product.id` with `onDelete: NoAction` (Restrict-style behavior).
- `ProductKey.orderItemId -> OrderItem.id` with `onDelete: SetNull`.
- Rationale: use `orderItemId` as the single source of truth for assignment; do not store `assignedTo` separately.

---

## Indexes & Constraints

- `@@index([productId, status])` — fast per-product status queries.
- `@@index([status])` — global scans for background jobs (e.g., release expired reservations).
- `@@index([productId, keyHash])` — duplicate detection lookups.
- `@@unique([productId, keyHash])` — DB-enforced duplicate prevention per product.

---

## ERD

````mermaid
erDiagram
+    PRODUCT ||--o{ PRODUCTKEY : has
+    PRODUCTKEY }o--o{ ORDERITEM : assigned_to
+
+    PRODUCT {
+      String id PK
+      String name
+    }
+    PRODUCTKEY {
+      String id PK
+      String productId FK
+      String encryptedKey
+      String keyHash
+      String iv
+      ProductKeyStatus status
+      String? orderItemId FK
+      String? batchId
+    }
+    ORDERITEM {
+      String id PK
+      String productId FK
+      Int quantity
+      String? productKeyId FK
+    }
+```

Note: `PRODUCTKEY` references `ORDERITEM` via `orderItemId`. Alternatively, you may add `productKeyId` to `OrderItem` instead; choose one pattern consistently.

---

## Business workflow (revised)

Import Product Keys
↓
Store Encrypted Keys (status = AVAILABLE)
↓
Available (counted from AVAILABLE rows)
↓
Reserved (status = RESERVED; `reservedUntil` set)
↓
Sold (status = SOLD; `orderItemId` set and `assignedAt` recorded)
↓
Assigned to Order (retrievable via `orderItemId`)

Detailed:
- Admin imports keys → server computes `keyHash`, encrypts key to `encryptedKey`, sets `status = AVAILABLE`, records `batchId` and `importedAt`.
- Checkout reserves keys by transitioning `AVAILABLE` → `RESERVED` and setting `reservedUntil`.
- On successful payment, reserved keys transition to `SOLD`, `assignedAt` set, and `orderItemId` set to the consuming `OrderItem`.
- Disabled keys (`DISABLED`) are not available for reservation or sale.

---

## Reservation flow
- Caller: `reserveKeys(productId, quantity, ttl)`.
- Implementation (service-level atomic sequence):
  1. Within a transaction: select up to `quantity` `AVAILABLE` keys (deterministic order), lock/update them to `RESERVED`, set `reservedUntil = now + ttl`.
  2. Return reserved `ProductKey.id` list to caller.
- Expiry: background job finds `RESERVED` rows with `reservedUntil < now` and sets them back to `AVAILABLE`.

---

## Assignment flow (on successful payment)
- Input: reserved `ProductKey.id` list, `orderItemId`.
- In a transaction: verify keys are `RESERVED`, update `status` → `SOLD`, set `assignedAt = now`, set `orderItemId`, clear `reservedUntil`.
- No `assignedTo` field; ownership inferred via `orderItemId` → `Order` → `User`.

---

## Order cancellation flow
- If cancelled before payment capture: release reserved keys back to `AVAILABLE`.
- If cancelled after assignment:
  - Business choice: either return keys to `AVAILABLE` (if safe) or mark `DISABLED` (if keys must be invalidated).
  - Admin controls policy; all actions must be audited.

---

## Refund flow
- Similar to cancellation: decide per-business whether to return key to `AVAILABLE` or mark `DISABLED`.
- Record refund metadata externally or in audit logs.

---

## Import TXT flow
- Accept one-key-per-line plaintext TXT.
- Validate file size/type and stream-parse lines.
- For each line: normalize, validate, compute `keyHash`, check duplicates (pre-check or handle DB unique error), encrypt to `encryptedKey`, set `batchId` and `importedAt`.
- Batch insert processed rows; report per-line status (inserted / duplicate / malformed / error).

---

## Import CSV flow
- Support CSV with headers or column mapping (e.g., `key`, `externalId`).
- Stream-parse rows and apply the same per-row flow as TXT.
- Allow optional `batchId` column; otherwise server assigns `batchId` per import.

---

## Encryption strategy
- Algorithm: AES-256-GCM.
- Master key: `PRODUCT_KEY_ENC_KEY` (32 bytes base64) stored in secret manager.
- IV: per-key random IV stored in `iv` (base64/hex).
- Ciphertext: store base64(ciphertext || authTag) in `encryptedKey`.
- `keyVersion` supports rotation; decrypt using per-row `keyVersion` mapping to stored secret.

Security notes:
- Do not persist plaintext; do not log plaintext or `keyHash` in cleartext logs.
- Audit all decryption/reveal operations.

---

## Key decryption strategy
- Decrypt on-demand in-memory only for authorized operations (admin reveal with `productKey.reveal` permission or returning key to owning customer via order endpoint).
- Use `keyVersion` to select correct master key for decryption.
- Audit user id, timestamp, and reason for every decryption.

---

## Duplicate prevention
- Compute `keyHash = sha256(utf8_plaintext)` prior to encryption.
- Enforce `@@unique([productId, keyHash])`.
- Import should catch unique-constraint violations and report row-level duplicates; optionally pre-scan the DB for existing hashes to provide a friendly report.
- For pre-encrypted inputs, require `keyHash` to be provided or reject the row.

---

## Stock calculation (strict rule)
- Stock MUST always be calculated from `ProductKey` rows: `COUNT(*) WHERE productId = X AND status = AVAILABLE`.
- Do NOT store or cache stock in `Product` or `ProductKey`; always derive it from `AVAILABLE` keys.

---

## Required schema changes (do NOT apply)
1. Add `ProductKey` model as shown above.
-   - Reason: store encrypted keys and metadata required for reservation/assignment/import.
2. Add `ProductKeyStatus` enum with values `AVAILABLE`, `RESERVED`, `SOLD`, `DISABLED`.
-   - Reason: compact lifecycle states per your direction.
3. Add `ProductKeyAlgorithm` enum.
-   - Reason: allow algorithm/version tagging for rotation/compat.
4. Add `@@index([productId, status])` and `@@index([status])`.
-   - Reason: efficient per-product and global status queries.
5. Add `@@index([productId, keyHash])` and `@@unique([productId, keyHash])`.
-   - Reason: duplicate detection and DB-enforced uniqueness per product.
6. Link `productId -> Product.id` with `onDelete: NoAction`.
-   - Reason: prevent cascade deletion of keys; require explicit admin cleanup.
7. Link `orderItemId -> OrderItem.id` with `onDelete: SetNull`.
-   - Reason: link key to consuming order item for audit and retrieval.
8. Add fields: `encryptedKey`, `keyHash`, `iv`, `algorithm`, `keyVersion`, `reservedUntil`, `assignedAt`, `batchId`, `importedAt`.
-   - Reason: required encryption, lifecycle, and import metadata.
9. Add environment secret `PRODUCT_KEY_ENC_KEY` and key-version management to deployment docs.

Database migration considerations:
- Migration will create a new `ProductKey` table and required enums; no changes to existing tables unless you elect to add a back-reference on `OrderItem` instead of `orderItemId` on `ProductKey`.
- After migration, regenerate Prisma Client and update service code.

---

## Operational notes
- Background job required to release expired reservations (`RESERVED` with `reservedUntil < now`).
- Audit all decryption (`productKey.reveal`) and assignment/revocation actions.
- When rotating master keys, plan a re-encryption path or maintain multiple key versions to decrypt old rows.

---

## Next steps
1. Review this revised design and request changes if needed.
2. When you approve the schema changes, reply `APPROVE SCHEMA` — then I will prepare a migration plan (no migrations will be applied until you explicitly permit it).
3. When you approve implementation after schema approval, reply `APPROVE IMPLEMENTATION`.

No code, schema modifications, or migrations will be performed until you explicitly approve.
````
