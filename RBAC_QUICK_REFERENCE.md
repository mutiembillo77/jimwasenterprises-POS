# RBAC Quick Reference Guide

## Three Roles Implemented

### 1. **Cashier** - Full System Access ✓
```
PERMISSIONS: ALL (every feature)
MENU ACCESS: All sections visible
STATUS: Recently upgraded from limited to full access
```

**Can Do:**
- POS transactions (all types: Retail, Wholesale, Lipa Mdogo, Kyamaa)
- Manage inventory completely
- Manage customers completely
- Process refunds & voids
- View and export reports
- Access security settings
- View audit trail
- Access ledger
- Manage settings
- Access integrations (Neon, Stripe, AI, Blob)

### 2. **Manager** - Operational Access
```
PERMISSIONS: Limited admin permissions
MENU ACCESS: Core Operations, Analytics, Limited Compliance, Shifts
STATUS: Store operations manager
```

**Can Do:**
- POS transactions (restricted void/refund)
- Manage inventory
- Manage customers
- Process sales
- View reports
- Limited audit access
- Manage shifts

**Cannot Do:**
- System settings
- Full integrations
- Finance management
- User management

### 3. **Admin** - Full System Access
```
PERMISSIONS: ALL (100% access)
MENU ACCESS: Everything including full administration
STATUS: System administrator
```

**Can Do:**
- Everything cashier can do
- Manage users & roles
- Full system settings
- All integrations
- Financial management
- Complete audit control

---

## Permission Types by Domain

### Sales Domain
- `sales.view` - See transactions
- `sales.create` - Create new sales
- `sales.edit` - Edit pending sales
- `sales.delete` - Delete sales
- `sales.void` - Cancel completed sales
- `sales.refund` - Process refunds

### Inventory Domain
- `inventory.view` - View stock
- `inventory.create` - Add products
- `inventory.edit` - Edit product details
- `inventory.delete` - Delete products
- `inventory.adjust` - Adjust stock levels
- `stock.transfer` - Transfer between branches
- `price.change` - Modify prices

### Other Domains
- `customers.*` - Customer management
- `purchasing.*` - Purchase orders
- `finance.*` - Financial data
- `reports.*` - Reports & exports
- `security.*` - User & audit
- `settings.*` - System settings

---

## Menu Access by Role

| Menu Section | Cashier | Manager | Admin |
|---|---|---|---|
| **Core Operations** | ✓ | ✓ | ✓ |
| **POS** | ✓ | ✓ | ✓ |
| **Customers** | ✓ | ✓ | ✓ |
| **Inventory** | ✓ | ✓ | ✓ |
| **Installments** | ✓ | ✓ | ✓ |
| **Dashboard** | ✓ | ✓ | ✓ |
| **Reports** | ✓ | ✓ | ✓ |
| **Security** | ✓ | ✗ | ✓ |
| **Audit Trail** | ✓ | ✗ | ✓ |
| **Ledger** | ✓ | ✗ | ✓ |
| **Settings** | ✓ | ✗ | ✓ |
| **Shifts** | ✓ | ✓ | ✓ |
| **Integrations** | ✓ | ✗ | ✓ |
| **User Management** | ✗ | ✗ | ✓ |
| **Role Management** | ✗ | ✗ | ✓ |

---

## Code Examples

### Check Permission
```javascript
import { hasPermission } from '@/lib/permissions'

// Check if user can void sales
const canVoid = await hasPermission(userId, 'sales.void')

if (canVoid) {
  // Show void button
} else {
  // Hide void button
}
```

### Check Multiple Permissions (ANY)
```javascript
const canProcessRefund = await hasAnyPermission(userId, [
  'sales.refund',
  'sales.void'
])
```

### Check Multiple Permissions (ALL)
```javascript
const canManageInventory = await hasAllPermissions(userId, [
  'inventory.view',
  'inventory.edit',
  'inventory.adjust'
])
```

### Filter Menu Items
```javascript
import { getMenuItemsForRole } from '@/config/menuConfig'

// Get menu items for cashier
const menuItems = getMenuItemsForRole('cashier')

// Renders: POS, Customers, Inventory, Dashboard, Reports, 
//          Security, Audit, Ledger, Settings, Shifts, Integrations
```

---

## Implementation Files

### Core Configuration
- `src/lib/security-types.ts` - Defines roles and permissions
- `src/lib/permissions.ts` - Permission checking functions

### Menu Configuration
- `src/config/menuConfig.ts` - Menu visibility rules by role

### Context & Auth
- `src/context/AuthContext.tsx` - Auth state management
- `src/lib/auth.ts` - Authentication logic

### Database
- User.role_code stores the role: 'cashier', 'manager', or 'admin'
- Permissions loaded from database on app initialization

---

## Testing Cashier Access

Log in as cashier and verify:

- [ ] Dashboard visible in menu
- [ ] Reports visible and exportable
- [ ] Security settings accessible
- [ ] Audit trail viewable
- [ ] Ledger accessible
- [ ] Settings editable
- [ ] System Integrations visible (Neon, Stripe, AI, Blob)
- [ ] Can create all sale types (Retail, Wholesale, Lipa Mdogo, Kyamaa)
- [ ] Can void and refund transactions
- [ ] Can manage inventory
- [ ] Can manage customers
- [ ] No permission errors in console

---

## Permission Checking Strategy

### 1. Client-Side (UX)
- Hide/show menu items based on role
- Disable buttons user can't use
- Filter data displayed

### 2. Server-Side (Security) ⭐ IMPORTANT
- Always verify permissions before action
- Never trust client-side checks alone
- Return error if insufficient permissions
- Log all permission denials

### 3. Caching
- Permissions cached in-memory for performance
- Cache cleared when user role changes
- `clearPermissionCache(userId)` - Clear specific user
- `clearAllPermissionCache()` - Clear all cache

---

## Migration Notes

### Changed for Cashier
**Before:**
- Limited to sales.view, sales.create only
- Could only view inventory
- Could only view customers
- No dashboard access
- No reporting
- No compliance section access

**After (Current):**
- Full system access (all permissions)
- All menu sections visible
- All features accessible
- Same access level as admin (without user management)

---

## Troubleshooting

### Cashier Can't Access Feature
1. Check user has role_code = 'cashier'
2. Verify permissions loaded: `await getUserPermissions(userId)`
3. Check menu config includes 'cashier'
4. Clear cache: `clearPermissionCache(userId)`

### Permission Denied Error
1. Check server-side permission check
2. Verify user role correct
3. Check audit log for denial event

### Menu Items Not Showing
1. Check role array in menu config
2. Verify getMenuItemsForRole() called
3. Check browser cache cleared

---

## Roles Summary Table

| Feature | Cashier | Manager | Admin |
|---|:---:|:---:|:---:|
| Create Sales | ✓ | ✓ | ✓ |
| Void Sales | ✓ | ✓ | ✓ |
| Manage Inventory | ✓ | ✓ | ✓ |
| Manage Customers | ✓ | ✓ | ✓ |
| View Reports | ✓ | ✓ | ✓ |
| Export Reports | ✓ | ✓ | ✓ |
| View Audit | ✓ | ✗ | ✓ |
| Manage Users | ✗ | ✗ | ✓ |
| System Settings | ✓ | ✗ | ✓ |
| Integrations | ✓ | ✗ | ✓ |
| Dashboard | ✓ | ✓ | ✓ |
| Wholesale Sales | ✓ | ✓ | ✓ |

---

## Next Steps

1. **Deploy** to production (Vercel auto-deploy)
2. **Test** all three roles in production
3. **Monitor** error logs for permission issues
4. **Collect** user feedback on access levels
5. **Document** any permission adjustments needed

---

**Status**: ✓ Implemented and Production Ready
**Last Updated**: 2025-01-15
**Cashier Access**: FULL SYSTEM ACCESS
