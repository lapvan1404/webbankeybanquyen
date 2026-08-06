# Permission Matrix

| Resource | Read | Create | Update | Delete | Other |
| --- | --- | --- | --- | --- | --- |
| Product | product.read | product.create | product.update | product.delete | - |
| Banner | banner.read | banner.create | banner.update | banner.delete | - |
| Order | order.read | - | order.update | - | order.cancel |
| Payment | payment.read | - | - | - | payment.refund |
| User | user.read | - | user.update | user.delete | - |
| Dashboard | dashboard.read | - | - | - | - |
| System | - | - | - | - | system.manage |

## Role Assignment
| Role | Effective Permissions |
| --- | --- |
| ADMIN | All permissions listed above |
| CUSTOMER | dashboard.read |
