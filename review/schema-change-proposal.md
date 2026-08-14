# Schema Change Proposal: ProductKey model

## Summary

Proposal to add a `ProductKey` Prisma model for storing encrypted product/license keys. This is a proposal file only — do NOT run migrations until approved.

Proposed model (for review):

model ProductKey {
id String @id @default(cuid())
productId String
keyCipher String
iv String?
algorithm String @default("aes-256-gcm")
status String @default("UNASSIGNED")
assignedTo String?
assignedAt DateTime?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
deletedAt DateTime?
}

## Migration impact

- New table `ProductKey`.
- No changes to existing tables.
- Requires adding environment variable `PRODUCT_KEY_ENC_KEY` (32 bytes base64) and updating deployment secrets.

## Risks

- Mis-handling encryption keys could leak plaintext keys.
- Bulk import must be transactional to avoid partial imports.

## Approval

- After review, reply with `APPROVE SCHEMA` to allow me to implement migrations and apply schema changes, or request changes here.
