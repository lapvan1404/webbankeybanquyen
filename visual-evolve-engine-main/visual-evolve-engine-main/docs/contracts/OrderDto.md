# OrderDto

Represents an order returned by the API.

Fields:
- `id` (string): Unique order identifier.
- `userId` (string): Identifier for the user who placed the order.
- `items` (array): Order items, each with `productId`, `quantity`, and `unitPrice`.
- `totalAmount` (number): Total amount for the order.
- `status` (string): Order state (`pending`, `paid`, `failed`, `cancelled`, `fulfilled`).
- `shippingAddress` (object): Shipping address details.
- `paymentMethod` (string): Payment method used.
- `createdAt` (string): ISO 8601 timestamp.
- `updatedAt` (string): ISO 8601 timestamp.
