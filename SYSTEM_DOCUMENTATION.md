# Jimwas Enterprises POS System - Complete Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Core Features](#core-features)
4. [Sales Workflows](#sales-workflows)
5. [Operational Management](#operational-management)
6. [Reporting & Analytics](#reporting--analytics)
7. [RBAC System](#rbac-system)
8. [Database Schema](#database-schema)
9. [API Endpoints](#api-endpoints)
10. [Development Guide](#development-guide)
11. [Deployment Guide](#deployment-guide)

---

## System Overview

The Jimwas Enterprises POS (Point of Sale) System is a comprehensive retail management platform designed for the Kenyan market, supporting multiple sales workflows, inventory management, cash drawer operations, shift management, and advanced reporting capabilities.

### Key Statistics

- **4 Sales Workflows**: Retail, Wholesale, Lipa Mdogo (Installments), Kyamaa (Credit)
- **3 Predefined Roles**: Cashier, Manager, Administrator
- **16 Granular Permissions**: Across 6 functional areas
- **Real-time Reporting**: Daily, weekly, and monthly dashboards
- **Inventory Tracking**: Low stock alerts with reorder predictions

---

## Architecture

### Technology Stack

```
Frontend: React 18 + TypeScript + Tailwind CSS
Storage: IndexedDB (Local) + Optional Backend Sync
State Management: React Context API + SWR
Build Tool: Vite
Testing: Vitest + React Testing Library
```

### Directory Structure

```
src/
├── components/          # Reusable UI components
│   ├── SalesCart.tsx   # Unified cart component
│   ├── PaymentForm.tsx # Payment processing UI
│   └── ...
├── routes/              # Page components
│   ├── workflows/       # Sales workflow pages
│   ├── ShiftsManagement.tsx
│   ├── CashDrawerManagement.tsx
│   ├── StockManagement.tsx
│   ├── ReportingDashboard.tsx
│   └── RBACDashboard.tsx
├── lib/
│   ├── db.ts           # Database operations
│   ├── types.ts        # TypeScript types
│   ├── repositories/   # Data layer
│   │   ├── TransactionRepository.ts
│   │   ├── OperationalRepositories.ts
│   │   └── ...
│   └── services/       # Business logic
│       ├── SalesService.ts
│       ├── ReportingService.ts
│       └── ...
└── context/            # React Context providers
    └── AuthContext.tsx
```

---

## Core Features

### 1. Sales Workflows

#### Retail (Standard POS)
- **Use Case**: Over-the-counter customer sales
- **Tax**: Applied at 16%
- **Discount**: Available with manager approval above limit
- **Payment Methods**: Cash, Card, M-Pesa
- **Receipt**: Numbered and tracked

**Key Code**:
```typescript
const context: SalesContext = {
  saleType: 'retail',
  cashierId: user.id,
  shiftId: shift.id,
  branchId: branch.id,
};
salesService.initializeWorkflow(context);
```

#### Wholesale
- **Use Case**: Bulk sales to businesses
- **Discount**: Configurable per sale
- **Customer**: Mandatory selection
- **Minimum Order**: Enforced limit
- **Payment Methods**: Cash, Card, M-Pesa, Bank Transfer, Cheque

**Key Features**:
- Customer history tracking
- Volume-based pricing
- Special payment terms support

#### Lipa Mdogo (Installments)
- **Use Case**: Payment plan management
- **Workflow**: Records installment collections
- **Integration**: Connects with customer payment plans
- **Tracking**: Tracks payment progress

#### Kyamaa (Credit)
- **Use Case**: On-credit sales to trusted customers
- **Approval**: Requires manager authorization
- **Payment**: No immediate payment collected
- **Tracking**: Credit balance per customer

### 2. Unified Sales Service

The `SalesService` provides configuration-driven workflow management:

```typescript
interface SalesContext {
  saleType: 'retail' | 'wholesale' | 'lipa_mdogo' | 'kyamaa';
  cashierId: string;
  shiftId?: string;
  branchId?: string;
  customerId?: string;
  customer?: Customer;
}

// Usage
salesService.initializeWorkflow(context);
salesService.addToCart(product, quantity, unitPrice);
salesService.applyDiscount(amount, reason);
const transaction = await salesService.completeSale(notes);
```

---

## Operational Management

### Shift Management

**Features**:
- Open shift with opening balance
- Close shift with closing balance
- Automatic duration calculation
- Transaction counting per shift

**API**:
```typescript
await shiftRepository.openShift(cashierId, openingBalance);
await shiftRepository.closeShift(shiftId, closingBalance);
const shifts = await shiftRepository.getActiveSifts(cashierId);
```

### Cash Drawer Management

**Features**:
- Deposit and withdrawal tracking
- Real-time balance calculation
- Transaction history with reasons
- Reconciliation functionality

**Entry Types**:
- Deposit: Money added to drawer
- Withdrawal: Money removed from drawer
- Reconcile: Drawer count verification

### Stock Management

**Features**:
- Real-time inventory tracking
- Low stock alerts with reorder levels
- Stock status indicators (In Stock, Low Stock, Out of Stock)
- Product add/edit with bulk operations

**Stock Statuses**:
```typescript
- In Stock: stock > reorder_level
- Low Stock: 0 < stock <= reorder_level
- Out of Stock: stock <= 0
```

---

## Reporting & Analytics

### Dashboard Metrics

**Real-time KPIs**:
- Today's sales and transaction count
- Weekly sales and trend
- Monthly sales vs. target
- Average transaction value
- Top sale type

**Top Performers**:
- Ranked by monthly sales
- Shows transaction count
- Last login tracking

### Sales Report

**Components**:
- Total sales amount
- Transaction breakdown by type
- Payment method analysis
- Discount and tax summaries
- Top 10 products by revenue
- Top 10 customers by spend

**Generation**:
```typescript
const report = await reportingService.generateSalesReport(
  startDate,
  endDate
);
```

### Cashier Report

**Metrics**:
- Individual sales performance
- Discount tracking
- Cash handling accuracy
- Discrepancy detection

### Inventory Report

**Insights**:
- Stock status per product
- Days until stockout prediction
- Average daily sales velocity
- Reorder recommendations

---

## RBAC System

### Role Hierarchy

```
Administrator (Full Access)
├── All permissions (16 total)
├── System settings
└── User management

Manager (Operational Management)
├── Sales operations
├── Inventory management
├── Reports and export
├── Shift management
├── Cash drawer
└── Sales approvals

Cashier (POS Operations)
├── Create sales
├── View sales
├── Inventory view
└── Open shifts
```

### Permission Categories

| Category | Permissions |
|----------|-------------|
| **Sales** | create, view, edit, delete |
| **Inventory** | view, edit, reorder |
| **Reports** | view, export |
| **Users** | manage, assign_roles |
| **Operations** | shifts.create, shifts.close, cash_drawer.manage |
| **Admin** | settings |

### Permission Management

```typescript
interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

// Create custom role
const customRole: Role = {
  id: 'supervisor',
  name: 'Supervisor',
  description: 'Floor supervisor',
  permissions: [
    'sales.create',
    'sales.view',
    'sales.edit',
    'approvals.approve',
    'cash_drawer.manage',
  ],
  userCount: 3,
};
```

---

## Database Schema

### Core Tables

#### Transactions
```sql
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  sale_type TEXT,
  cashier_id TEXT,
  branch_id TEXT,
  shift_id TEXT,
  customer_id TEXT,
  total_amount REAL,
  amount_paid REAL,
  change_amount REAL,
  payment_method TEXT,
  discount_amount REAL,
  discount_reason TEXT,
  tax_amount REAL,
  status TEXT,
  notes TEXT,
  receipt_number TEXT,
  created_at TEXT,
  sync_status TEXT
);
```

#### Customers
```sql
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT,
  email TEXT,
  total_spent REAL,
  loyalty_points INT,
  created_at TEXT
);
```

#### Products
```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT,
  sku TEXT,
  price REAL,
  stock INT,
  reorder_level INT,
  category TEXT,
  tax_category TEXT,
  is_active BOOLEAN,
  created_at TEXT,
  updated_at TEXT
);
```

#### Shifts
```sql
CREATE TABLE shifts (
  id TEXT PRIMARY KEY,
  cashier_id TEXT,
  opened_at TEXT,
  closed_at TEXT,
  opening_balance REAL,
  closing_balance REAL,
  transactions_count INT,
  status TEXT
);
```

---

## API Endpoints

### Sales Operations

```
POST /api/sales/create          # Create new sale
GET  /api/sales/:id             # Get sale details
GET  /api/sales                 # List sales (with filters)
PUT  /api/sales/:id/approve     # Manager approval
DELETE /api/sales/:id           # Delete sale (with permission)
```

### Inventory

```
GET  /api/inventory             # Get all products
POST /api/inventory             # Add product
PUT  /api/inventory/:id         # Update product
GET  /api/inventory/low-stock   # Get low stock items
POST /api/inventory/:id/restock # Record restock
```

### Reporting

```
GET  /api/reports/sales?start=&end=      # Sales report
GET  /api/reports/cashier/:id?start=&end= # Cashier report
GET  /api/reports/inventory              # Inventory report
GET  /api/reports/dashboard              # Dashboard metrics
```

### Shifts

```
POST /api/shifts/open           # Open shift
POST /api/shifts/:id/close      # Close shift
GET  /api/shifts                # List shifts
GET  /api/shifts/:id            # Get shift details
```

### Cash Drawer

```
POST /api/drawer/deposit        # Record deposit
POST /api/drawer/withdrawal     # Record withdrawal
POST /api/drawer/reconcile      # Reconcile drawer
GET  /api/drawer/history        # Get transaction history
GET  /api/drawer/balance        # Get current balance
```

---

## Development Guide

### Setting Up Development Environment

1. **Clone Repository**
```bash
git clone https://github.com/mutiembillo77/jimwasenterprises-POS.git
cd jimwasenterprises-POS
```

2. **Install Dependencies**
```bash
npm install
# or
pnpm install
```

3. **Start Development Server**
```bash
npm run dev
# Server runs on http://localhost:5173
```

4. **Build for Production**
```bash
npm run build
npm run preview
```

### Adding New Sale Type

1. **Update Config**
```typescript
// src/lib/config/menuConfig.ts
export const salesWorkflows: Record<string, SalesWorkflowConfig> = {
  new_type: {
    label: 'New Sale Type',
    taxApplicable: false,
    requiresCustomer: true,
    allowedPaymentMethods: ['cash', 'card'],
    minOrderValue: 1000,
    requiresApprovalAbove: 50000,
  },
};
```

2. **Create Workflow Component**
```typescript
// src/routes/workflows/NewTypeWorkflow.tsx
export function NewTypeWorkflow() {
  const context: SalesContext = {
    saleType: 'new_type',
    // ... rest of context
  };
  
  // Workflow implementation
}
```

3. **Add to Menu**
```typescript
// Update navigation/routing to include new workflow
```

### Adding New Report

1. **Extend ReportingService**
```typescript
async generateCustomReport(
  params: ReportParams
): Promise<CustomReport> {
  // Implementation
  return report;
}
```

2. **Create Report Page**
```typescript
// src/routes/CustomReport.tsx
export function CustomReport() {
  const [report, setReport] = useState<CustomReport | null>(null);
  
  const handleGenerateReport = async () => {
    const data = await reportingService.generateCustomReport(params);
    setReport(data);
  };
}
```

### Testing

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## Deployment Guide

### Prerequisites

- Node.js 16+
- npm or pnpm
- Git
- Optional: Docker, Vercel account

### Local Deployment

```bash
# Build
npm run build

# Serve production build
npm run preview
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add API_KEY
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
```

### Environment Variables

```
VITE_API_URL=https://api.jimwas.local
VITE_SYNC_INTERVAL=30000
VITE_DEBUG=false
VITE_MAX_UPLOAD_SIZE=10485760
```

### Performance Optimization

- **Code Splitting**: Automatic via Vite
- **Lazy Loading**: Implemented for routes
- **Caching**: IndexedDB for offline support
- **Bundle Size**: Tree-shaking enabled

---

## Security Considerations

### Data Protection

- All transaction data validated before saving
- Parameterized queries (when using backend)
- Input sanitization for all user inputs
- CORS headers properly configured

### Authentication

- Session-based auth via AuthContext
- Password hashing (if backend enabled)
- Role-based access control (RBAC)
- Permission validation on every action

### Audit Trail

- All transactions logged with:
  - Operator ID
  - Timestamp
  - Sale details
  - Payment method
  - Discount reasons

---

## Troubleshooting

### Common Issues

**Issue**: Data not persisting
- **Solution**: Check IndexedDB in browser DevTools
- **Alt**: Check sync status in settings

**Issue**: Slow performance
- **Solution**: Clear browser cache
- **Alt**: Reduce report date range

**Issue**: Payment calculation errors
- **Solution**: Verify tax configuration
- **Alt**: Check discount logic

### Debug Mode

Enable debug logging:
```typescript
// In environment
VITE_DEBUG=true

// In console
console.log("[v0] Transaction data:", transaction);
```

---

## Future Enhancements

1. **Multi-branch Support**
   - Branch-level reporting
   - Inter-branch transfers
   - Consolidated dashboard

2. **Advanced Inventory**
   - Barcode scanning
   - Automated reordering
   - Supplier integration

3. **Mobile Support**
   - React Native app
   - Offline-first sync
   - Mobile payments

4. **Analytics**
   - Customer segments
   - Trend forecasting
   - Predictive ordering

5. **Integration**
   - Accounting systems
   - E-commerce platforms
   - Payment gateways

---

## Support & Maintenance

### Getting Help

- Documentation: See this file
- Issues: GitHub Issues
- Email: support@jimwas.local

### Version Management

- Semantic versioning: MAJOR.MINOR.PATCH
- Changelog: See CHANGELOG.md
- Release Notes: GitHub Releases

### Backup Strategy

```bash
# Export data
npm run export:db

# Import data
npm run import:db
```

---

## License & Credits

**Developed for Jimwas Enterprises**

© 2024-2025. All rights reserved.

---

**Last Updated**: December 2024
**Documentation Version**: 1.0.0
**System Version**: 2.0.0
