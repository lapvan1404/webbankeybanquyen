# PaymentDto

Represents a payment session or record returned by the API.

Fields:

- `id` (string): Unique payment identifier.
- `orderId` (string): Associated order identifier.
- `amount` (number): Payment amount.
- `currency` (string): Currency code.
- `status` (string): Payment status (`pending`, `completed`, `failed`, `cancelled`).
- `provider` (string): Payment provider name.
- `referenceId` (string): External gateway reference.
- `redirectUrl` (string): Optional client redirect URL for payment completion.
- `createdAt` (string): ISO 8601 timestamp.
- `updatedAt` (string): ISO 8601 timestamp.
