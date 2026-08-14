# ProductDto

Represents a product returned by the API.

Fields:

- `id` (string): Unique product identifier.
- `name` (string): Product title.
- `description` (string): Product description.
- `price` (number): Price value.
- `stock` (integer): Available stock quantity.
- `category` (string): Category slug or name.
- `images` (string[]): List of image URLs.
- `tags` (string[]): Optional product tags.
- `status` (string): Product status (`draft`, `active`, `archived`).
