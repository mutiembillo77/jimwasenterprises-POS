# Testing Guide - Jimwas Enterprises POS System

## Overview

This document provides comprehensive testing guidelines for the POS system across unit, integration, and end-to-end levels.

---

## Test Structure

```
tests/
├── unit/
│   ├── services/
│   │   ├── SalesService.test.ts
│   │   └── ReportingService.test.ts
│   ├── repositories/
│   │   ├── TransactionRepository.test.ts
│   │   └── OperationalRepositories.test.ts
│   └── utils/
│       └── helpers.test.ts
├── integration/
│   ├── workflows/
│   │   ├── RetailWorkflow.integration.ts
│   │   ├── WholesaleWorkflow.integration.ts
│   │   ├── LipaMdogoWorkflow.integration.ts
│   │   └── KyamaaWorkflow.integration.ts
│   └── operations/
│       ├── ShiftManagement.integration.ts
│       ├── CashDrawer.integration.ts
│       └── StockManagement.integration.ts
├── e2e/
│   ├── sales.e2e.ts
│   ├── reporting.e2e.ts
│   └── admin.e2e.ts
└── fixtures/
    ├── mockData.ts
    └── testSetup.ts
```

---

## Unit Tests

### SalesService Tests

**Test File**: `tests/unit/services/SalesService.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { SalesService, SalesContext } from '../../../src/lib/services/SalesService';
import type { Product } from '../../../src/lib/types';

describe('SalesService', () => {
  let salesService: SalesService;
  let mockContext: SalesContext;

  beforeEach(() => {
    salesService = new SalesService();
    mockContext = {
      saleType: 'retail',
      cashierId: 'cashier-1',
      branchId: 'branch-1',
    };
  });

  describe('Workflow Initialization', () => {
    it('should initialize workflow with correct context', () => {
      salesService.initializeWorkflow(mockContext);
      const state = salesService.getState();
      
      expect(state).not.toBeNull();
      expect(state?.context.saleType).toBe('retail');
      expect(state?.cartItems).toHaveLength(0);
    });

    it('should throw error for invalid sale type', () => {
      expect(() => {
        salesService.initializeWorkflow({
          ...mockContext,
          saleType: 'invalid' as any,
        });
      }).toThrow();
    });
  });

  describe('Cart Management', () => {
    beforeEach(() => {
      salesService.initializeWorkflow(mockContext);
    });

    it('should add product to cart', () => {
      const product: Product = {
        id: '1',
        name: 'Test Product',
        price: 1000,
        stock: 10,
        reorder_level: 5,
        sku: 'TEST-001',
        tax_category: 'standard',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      salesService.addToCart(product, 2, 1000);
      const state = salesService.getState();

      expect(state?.cartItems).toHaveLength(1);
      expect(state?.cartItems[0].quantity).toBe(2);
      expect(state?.totalAmount).toBe(2000);
    });

    it('should update cart item quantity', () => {
      const product: Product = {
        id: '1',
        name: 'Test Product',
        price: 1000,
        stock: 10,
        reorder_level: 5,
        sku: 'TEST-001',
        tax_category: 'standard',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      salesService.addToCart(product, 1, 1000);
      const itemId = salesService.getState()?.cartItems[0].id!;

      salesService.updateCartItem(itemId, 5);
      const state = salesService.getState();

      expect(state?.cartItems[0].quantity).toBe(5);
      expect(state?.totalAmount).toBe(5000);
    });

    it('should remove item from cart', () => {
      const product: Product = {
        id: '1',
        name: 'Test Product',
        price: 1000,
        stock: 10,
        reorder_level: 5,
        sku: 'TEST-001',
        tax_category: 'standard',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      salesService.addToCart(product, 1);
      const itemId = salesService.getState()?.cartItems[0].id!;

      salesService.removeFromCart(itemId);
      const state = salesService.getState();

      expect(state?.cartItems).toHaveLength(0);
    });
  });

  describe('Tax Calculation', () => {
    it('should calculate tax for retail sales', () => {
      salesService.initializeWorkflow({
        ...mockContext,
        saleType: 'retail',
      });

      const product: Product = {
        id: '1',
        name: 'Taxable Product',
        price: 10000,
        stock: 10,
        reorder_level: 5,
        sku: 'TAX-001',
        tax_category: 'standard',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      salesService.addToCart(product, 1);
      const state = salesService.getState();

      // 16% tax on 10000 = 1600
      expect(state?.taxAmount).toBe(1600);
      expect(state?.totalAmount).toBe(11600);
    });

    it('should not apply tax for wholesale sales', () => {
      salesService.initializeWorkflow({
        ...mockContext,
        saleType: 'wholesale',
      });

      const product: Product = {
        id: '1',
        name: 'Product',
        price: 10000,
        stock: 10,
        reorder_level: 5,
        sku: 'BULK-001',
        tax_category: 'standard',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      salesService.addToCart(product, 1);
      const state = salesService.getState();

      expect(state?.taxAmount).toBe(0);
      expect(state?.totalAmount).toBe(10000);
    });
  });

  describe('Discount Application', () => {
    beforeEach(() => {
      salesService.initializeWorkflow(mockContext);
    });

    it('should apply discount correctly', () => {
      const product: Product = {
        id: '1',
        name: 'Product',
        price: 1000,
        stock: 10,
        reorder_level: 5,
        sku: 'TEST-001',
        tax_category: 'standard',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      salesService.addToCart(product, 10);
      salesService.applyDiscount(2000, 'loyalty discount');

      const state = salesService.getState();
      expect(state?.discount).toBe(2000);
      expect(state?.totalAmount).toBe(8000 + 1280); // 10000 - 2000 + tax
    });

    it('should flag for approval when discount exceeds limit', () => {
      const product: Product = {
        id: '1',
        name: 'Product',
        price: 1000,
        stock: 100,
        reorder_level: 5,
        sku: 'TEST-001',
        tax_category: 'standard',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      salesService.addToCart(product, 100);
      salesService.applyDiscount(100000, 'large discount');

      const state = salesService.getState();
      expect(state?.requiresApproval).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should validate empty cart', () => {
      salesService.initializeWorkflow(mockContext);
      const validation = salesService.validate();

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Cart is empty');
    });

    it('should validate customer requirement', () => {
      salesService.initializeWorkflow({
        ...mockContext,
        saleType: 'wholesale',
      });

      const product: Product = {
        id: '1',
        name: 'Product',
        price: 1000,
        stock: 10,
        reorder_level: 5,
        sku: 'TEST-001',
        tax_category: 'standard',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      salesService.addToCart(product, 1);
      const validation = salesService.validate();

      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes('Customer'))).toBe(true);
    });
  });
});
```

---

## Integration Tests

### Retail Workflow Integration Test

**Test File**: `tests/integration/workflows/RetailWorkflow.integration.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { salesService } from '../../../src/lib/services/SalesService';
import { transactionRepository } from '../../../src/lib/repositories/TransactionRepository';

describe('Retail Workflow Integration', () => {
  beforeEach(async () => {
    // Setup test data
    await transactionRepository.clear();
  });

  afterEach(async () => {
    // Cleanup
    await transactionRepository.clear();
  });

  it('should complete full retail sales workflow', async () => {
    // Initialize
    salesService.initializeWorkflow({
      saleType: 'retail',
      cashierId: 'test-cashier',
      branchId: 'test-branch',
    });

    // Add items
    const product = {
      id: '1',
      name: 'Milk',
      price: 100,
      stock: 50,
      reorder_level: 10,
      sku: 'MILK-001',
      tax_category: 'standard',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    salesService.addToCart(product, 5);

    // Set payment
    salesService.setPaymentMethod('cash');
    salesService.setAmountPaid(600);

    // Complete sale
    const transaction = await salesService.completeSale('Test retail sale');

    // Verify
    expect(transaction).toBeDefined();
    expect(transaction.sale_type).toBe('retail');
    expect(transaction.total_amount).toBeGreaterThan(500);
    expect(transaction.receipt_number).toBeDefined();

    // Verify persistence
    const saved = await transactionRepository.getById(transaction.id);
    expect(saved).toBeDefined();
  });
});
```

---

## End-to-End Tests

### Complete Sales Flow E2E

```typescript
// tests/e2e/sales.e2e.ts
describe('E2E: Complete Sales Workflow', () => {
  it('should process retail sale from start to finish', async () => {
    // 1. Navigate to POS
    // 2. Select product
    // 3. Add to cart
    // 4. Proceed to checkout
    // 5. Enter payment
    // 6. Complete sale
    // 7. Verify receipt
    // 8. Verify transaction in history
  });

  it('should handle wholesale workflow with customer', async () => {
    // 1. Navigate to wholesale
    // 2. Select customer
    // 3. Add products
    // 4. Apply discount
    // 5. Complete payment
    // 6. Generate receipt
  });
});
```

---

## Running Tests

### Unit Tests Only

```bash
npm run test:unit
# or
npm run test -- tests/unit
```

### Integration Tests

```bash
npm run test:integration
# or
npm run test -- tests/integration
```

### E2E Tests

```bash
npm run test:e2e
# or
npm run test -- tests/e2e
```

### Coverage Report

```bash
npm run test:coverage

# View HTML report
open coverage/index.html
```

### Watch Mode

```bash
npm run test:watch
```

---

## Test Data

### Mock Products

```typescript
export const mockProducts = [
  {
    id: 'prod-1',
    name: 'Milk',
    sku: 'MILK-001',
    price: 100,
    stock: 50,
    reorder_level: 10,
    category: 'Dairy',
  },
  {
    id: 'prod-2',
    name: 'Bread',
    sku: 'BREAD-001',
    price: 50,
    stock: 100,
    reorder_level: 20,
    category: 'Bakery',
  },
];
```

### Mock Users

```typescript
export const mockUsers = [
  {
    id: 'user-1',
    name: 'Cashier One',
    email: 'cashier1@test.local',
    role: 'cashier',
  },
  {
    id: 'user-2',
    name: 'Manager One',
    email: 'manager@test.local',
    role: 'manager',
  },
];
```

---

## Performance Testing

### Benchmark Template

```typescript
import { bench } from 'vitest';

bench('add 100 items to cart', async () => {
  salesService.initializeWorkflow(mockContext);
  
  for (let i = 0; i < 100; i++) {
    salesService.addToCart(mockProduct, 1);
  }
});
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:coverage
```

---

## Best Practices

1. **Test Organization**: Keep tests close to source
2. **Descriptive Names**: Use clear, specific test descriptions
3. **Isolation**: Each test should be independent
4. **Mock External**: Mock APIs and databases
5. **Coverage Goals**: Aim for 80%+ coverage
6. **Fast Execution**: Keep tests under 100ms
7. **Deterministic**: Tests should have consistent results

---

## Troubleshooting Tests

**Issue**: Tests timing out
- **Solution**: Increase timeout in config
- **Alt**: Check for unresolved promises

**Issue**: Flaky tests
- **Solution**: Add deterministic seeding
- **Alt**: Check async operations

**Issue**: Mock data inconsistent
- **Solution**: Use fixtures
- **Alt**: Reset before each test

---

## Manual Testing Checklist

- [ ] Retail sale completes successfully
- [ ] Wholesale discount calculation correct
- [ ] Tax applied properly
- [ ] Receipt prints/displays correctly
- [ ] Change calculated accurately
- [ ] Inventory updated post-sale
- [ ] Shift tracking operational
- [ ] Cash drawer balances
- [ ] Reports generate correctly
- [ ] RBAC permissions enforced
- [ ] Offline mode functional
- [ ] Sync works when online

---

**Last Updated**: December 2024
