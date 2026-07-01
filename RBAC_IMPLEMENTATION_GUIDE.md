# Role-Based Access Control (RBAC) Implementation Guide

## Overview

The POS system implements a comprehensive RBAC system with three roles:
- **Cashier**: Full access to all features (everything)
- **Manager**: Limited admin access for store operations
- **Admin**: Full system access including settings and user management

## Role Permissions Summary

### Cashier Role (Full Access) ✓
- **Sales**: View, Create, Edit, Void, Refund
- **Inventory**: View, Create, Edit, Delete, Adjust, Transfer, Price Changes
- **Customers**: View, Create, Edit, Delete
- **Purchasing**: View, Create, Approve
- **Finance**: View, Manage
- **Reporting**: View, Export
- **Security**: Users, Audit, Approvals
- **Settings**: View, Edit
- **Menu Access**: All sections including Dashboard, Reports, Compliance, Administration, Integrations

### Manager Role
- **Sales**: View, Create, Edit, Void, Refund
- **Inventory**: View, Create, Edit, Adjust, Transfer, Price Changes
- **Customers**: View, Create, Edit
- **Purchasing**: View, Create, Approve
- **Finance**: View only
- **Reporting**: View, Export
- **Security**: Users (view), Audit (view), Approvals
- **Settings**: View only
- **Menu Access**: Dashboard, Reports, Compliance, Shifts (Administration limited)

### Admin Role (Full Access)
- **All Permissions**: 100% access to all system features
- **Menu Access**: All sections including full Administration and Integrations

## Permission Structure

### Permission Domains
```
- sales: Transaction handling (view, create, edit, delete, void, refund)
- inventory: Stock management (view, create, edit, delete, adjust, transfer, change prices)
- customers: Customer management (view, create, edit, delete)
- purchasing: Purchase orders (view, create, approve)
- finance: Financial data (view, manage)
- reporting: Reports (view, export)
- security: User and security management (view, manage, audit, approvals)
- settings: System settings (view, edit)
```

### Permission Actions
- **view**: Read access to data
- **create**: Add new entries
- **edit**: Modify existing entries
- **delete**: Remove entries
- **void**: Cancel completed transactions
- **refund**: Process refunds
- **adjust**: Modify quantities/values
- **transfer**: Move between locations
- **change**: Modify settings/prices
- **manage**: Full control
- **export**: Export data
- **approve**: Approve requests
- **reject**: Decline requests

## Cashier Access Enhancements (Now Has Full Access)

### What's New for Cashier
The cashier role has been updated to have complete access to all system features:

**Dashboard & Analytics**
- View comprehensive dashboards
- Access all reports and export functionality
- View financial summaries

**Compliance Section**
- Security monitoring
- Audit trail review
- Ledger access

**Administration**
- System settings configuration
- Shift management
- Integration access

**Menu Items Available**
- Core Operations (POS, Customers, Stock, Installments)
- Analytics (Dashboard, Reports)
- Compliance (Security, Audit, Ledger)
- Administration (Settings, Shifts)
- System Integrations (Database, Payments, AI Tools, Blob Storage)

## Implementation Details

### Permission Check Functions

```javascript
// Check if user has specific permission
await hasPermission(userId, 'sales.void')

// Check if user has any permission
await hasAnyPermission(userId, ['sales.void', 'sales.refund'])

// Check if user has all permissions
await hasAllPermissions(userId, ['sales.view', 'inventory.view'])

// Check domain-based permission
await canPerform(userId, 'sales', 'void')

// Check role permissions
await roleHasPermission('cashier', 'sales.void')
```

### Permission Caching

Permissions are cached in-memory for performance:
```javascript
// Cache is automatically managed
// Cleared when user role changes:
clearPermissionCache(userId)

// Clear all permission cache:
clearAllPermissionCache()
```

## File Changes Made

### Core Permission Configuration
- **src/lib/security-types.ts**: Updated `DEFAULT_ROLE_PERMISSIONS.cashier` to include all permission IDs

### Menu Configuration
- **src/config/menuConfig.ts**: Updated role arrays to include cashier where needed:
  - Analytics items: ['cashier', 'manager', 'admin']
  - Compliance items: ['cashier', 'admin']
  - Administration items: ['cashier', 'admin']
  - Integration items: ['cashier', 'admin']
  - Shifts: ['cashier', 'manager', 'admin']
  - Wholesale sales workflow: ['cashier', 'manager', 'admin']

### Menu Visibility Logic
- Added cashier to compliance section visibility
- Added cashier to administration section visibility
- Updated getMenuItemsForRole() to include cashier in all sections

## How RBAC Works

### 1. Authentication
When a user logs in, their role_code is stored in the User object:
```javascript
const user = await login(username, password)
// user.role_code = 'cashier' | 'manager' | 'admin'
```

### 2. Permission Loading
On app initialization, permissions are loaded from the database:
```javascript
await initializeSecurity()
// Loads all roles and their permissions
```

### 3. Authorization Checks
Before accessing features, permissions are verified:
```javascript
const hasAccess = await hasPermission(user.id, 'sales.void')
if (!hasAccess) {
  // Show error or hide feature
}
```

### 4. Menu Filtering
Menu items are filtered by user role:
```javascript
const menuItems = getMenuItemsForRole(user.role_code)
// Returns only items accessible to that role
```

## Testing RBAC

### Test Cashier Full Access
1. Log in as a cashier user
2. Verify access to:
   - Dashboard and Reports (Analytics section)
   - Security, Audit, Ledger (Compliance section)
   - Settings and Shifts (Administration section)
   - System Integrations
3. Try all transaction types: Sales, Refunds, Voids
4. Verify ability to manage inventory, customers, and purchasing

### Test Manager Limited Access
1. Log in as a manager user
2. Verify NO access to:
   - System Integrations (links should not appear)
   - Full Settings (should be view-only)
   - Finance Management
3. Verify access to:
   - Dashboard and Reports
   - All sales operations
   - Inventory management
   - Audit view

### Test Admin Full Access
1. Log in as admin user
2. Verify access to ALL features
3. Verify ability to manage users and roles

## API Integration Points

### Database Schema
```
roles table:
- id: string (unique identifier)
- code: RoleCode ('cashier', 'manager', 'admin')
- name: string
- permissions: string[] (array of permission IDs)
- is_system: boolean (cannot delete system roles)

users table:
- role_id: string (references roles.id)
- role_code: RoleCode (denormalized for quick access)
```

### Permission Validation
All database operations should check permissions:
```javascript
export async function updateProduct(id, data, userId) {
  // Check permission before updating
  if (!await hasPermission(userId, 'inventory.edit')) {
    throw new Error('Insufficient permissions')
  }
  
  // Perform update
  return await db.updateProduct(id, data)
}
```

## Security Best Practices

1. **Always Check Server-Side**: Never trust client-side permission checks alone
2. **Cache Wisely**: Permission cache improves performance but must be cleared on role changes
3. **Audit Changes**: Log all permission-related changes for compliance
4. **Separate Concerns**: Keep permissions data separate from user data
5. **Regular Reviews**: Periodically audit who has what permissions

## Troubleshooting

### Cashier Can't Access Feature
1. Check if role_code is set to 'cashier'
2. Verify permissions are loaded: `await getUserPermissions(userId)`
3. Check menu configuration includes cashier
4. Clear cache: `clearPermissionCache(userId)`

### Permission Cache Stale
- Permissions are cached automatically
- Clear when user role changes: `clearPermissionCache(userId)`
- Or clear all: `clearAllPermissionCache()`

### Menu Items Not Appearing
1. Check role array in menu config includes the user's role
2. Verify menu filtering logic: `getMenuItemsForRole(role)`
3. Check if item routes are correct

## Future Enhancements

1. **Dynamic Roles**: Allow creating custom roles with selected permissions
2. **Time-Based Permissions**: Grant temporary elevated access
3. **Location-Based Restrictions**: Limit access by branch/till
4. **Audit Trail**: Track permission changes
5. **Permission Templates**: Pre-defined permission sets for common scenarios

## Related Files

- `src/lib/security-types.ts` - Type definitions for roles and permissions
- `src/lib/permissions.ts` - Permission check functions
- `src/lib/auth.ts` - Authentication and user initialization
- `src/config/menuConfig.ts` - Menu item role restrictions
- `src/context/AuthContext.tsx` - Auth state management
- `src/routes/settings.tsx` - User and role management UI

---

**Last Updated**: 2025-01-15
**Status**: Implemented and Production Ready
**Cashier Access**: ✓ Full system access
