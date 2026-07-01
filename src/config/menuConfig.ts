import { RoleCode } from '../lib/security-types';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  roles: RoleCode[];
  section: string;
  order: number;
  badge?: string;
  children?: MenuItem[];
}

export interface MenuCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  items: MenuItem[];
}

export interface SalesWorkflowConfig {
  id: 'retail' | 'wholesale' | 'lipa_mdogo' | 'kyamaa';
  label: string;
  description: string;
  icon: string;
  defaultDiscount: number;
  requiresApprovalAbove?: number;
  requiresCustomer: boolean;
  allowedPaymentMethods: string[];
  taxApplicable: boolean;
  minOrderValue?: number;
  supportedRoles: RoleCode[];
}

// Sales Workflow Configurations
export const salesWorkflows: Record<string, SalesWorkflowConfig> = {
  retail: {
    id: 'retail',
    label: 'Retail Sales',
    description: 'Standard over-the-counter retail transactions',
    icon: 'ShoppingCart',
    defaultDiscount: 0,
    requiresCustomer: false,
    allowedPaymentMethods: ['cash', 'card', 'mpesa'],
    taxApplicable: true,
    supportedRoles: ['cashier', 'manager', 'admin'],
  },
  wholesale: {
    id: 'wholesale',
    label: 'Wholesale',
    description: 'Bulk sales with discounts',
    icon: 'Boxes',
    defaultDiscount: 5,
    requiresCustomer: true,
    allowedPaymentMethods: ['cash', 'card', 'mpesa', 'bank_transfer', 'cheque'],
    taxApplicable: false,
    minOrderValue: 5000,
    requiresApprovalAbove: 50000,
    supportedRoles: ['cashier', 'manager', 'admin'],
  },
  lipa_mdogo: {
    id: 'lipa_mdogo',
    label: 'Lipa Mdogo (Pay Installment)',
    description: 'Installment payment collections',
    icon: 'CreditCard',
    defaultDiscount: 0,
    requiresCustomer: true,
    allowedPaymentMethods: ['cash', 'mpesa'],
    taxApplicable: false,
    supportedRoles: ['cashier', 'manager', 'admin'],
  },
  kyamaa: {
    id: 'kyamaa',
    label: 'Kyamaa (Credit)',
    description: 'On-credit sales',
    icon: 'Hand',
    defaultDiscount: 0,
    requiresCustomer: true,
    allowedPaymentMethods: [],
    taxApplicable: false,
    requiresApprovalAbove: 10000,
    supportedRoles: ['manager', 'admin'],
  },
};

// Core Operations Menu Items
const coreOperationsItems: MenuItem[] = [
  {
    id: 'pos',
    label: 'POS',
    icon: 'ShoppingCart',
    route: '/pos',
    roles: ['cashier', 'manager', 'admin'],
    section: 'operations',
    order: 1,
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: 'Users',
    route: '/customers',
    roles: ['cashier', 'manager', 'admin'],
    section: 'operations',
    order: 2,
  },
  {
    id: 'products',
    label: 'Products',
    icon: 'Package',
    route: '/products',
    roles: ['manager', 'admin'],
    section: 'operations',
    order: 3,
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: 'Warehouse',
    route: '/inventory',
    roles: ['manager', 'admin'],
    section: 'operations',
    order: 4,
  },
  {
    id: 'installments',
    label: 'Installments',
    icon: 'CreditCard',
    route: '/installments',
    roles: ['manager', 'admin'],
    section: 'operations',
    order: 5,
  },
];

// Analytics Menu Items
const analyticsItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'BarChart3',
    route: '/dashboard',
    roles: ['cashier', 'manager', 'admin'],
    section: 'analytics',
    order: 1,
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'FileText',
    route: '/reports',
    roles: ['cashier', 'manager', 'admin'],
    section: 'analytics',
    order: 2,
  },
];

// Compliance Menu Items
const complianceItems: MenuItem[] = [
  {
    id: 'security',
    label: 'Security',
    icon: 'Shield',
    route: '/security',
    roles: ['cashier', 'admin'],
    section: 'compliance',
    order: 1,
  },
  {
    id: 'audit',
    label: 'Audit Trail',
    icon: 'FileText',
    route: '/audit-trail',
    roles: ['cashier', 'admin'],
    section: 'compliance',
    order: 2,
  },
  {
    id: 'ledger',
    label: 'Ledger',
    icon: 'DollarSign',
    route: '/ledger',
    roles: ['cashier', 'admin'],
    section: 'compliance',
    order: 3,
  },
];

// Administration Menu Items
const administrationItems: MenuItem[] = [
  {
    id: 'settings',
    label: 'Settings',
    icon: 'Settings',
    route: '/settings',
    roles: ['cashier', 'admin'],
    section: 'administration',
    order: 1,
  },
  {
    id: 'shifts',
    label: 'Shifts',
    icon: 'Clock',
    route: '/shifts',
    roles: ['cashier', 'manager', 'admin'],
    section: 'administration',
    order: 2,
  },
];

// System Integrations Menu Items
const integrationsItems: MenuItem[] = [
  {
    id: 'neon',
    label: 'Neon Database',
    icon: 'Database',
    route: 'https://console.neon.tech',
    roles: ['cashier', 'admin'],
    section: 'integrations',
    order: 1,
  },
  {
    id: 'stripe',
    label: 'Stripe Payments',
    icon: 'CreditCard',
    route: 'https://stripe.com/dashboard',
    roles: ['cashier', 'admin'],
    section: 'integrations',
    order: 2,
  },
  {
    id: 'ai-tools',
    label: 'AI Tools',
    icon: 'Zap',
    route: 'https://sdk.vercel.ai',
    roles: ['cashier', 'admin'],
    section: 'integrations',
    order: 3,
  },
  {
    id: 'blob',
    label: 'Vercel Blob Storage',
    icon: 'HardDrive',
    route: 'https://vercel.com/storage/blob',
    roles: ['cashier', 'admin'],
    section: 'integrations',
    order: 4,
  },
];

// Menu Categories grouped by role
export const getMenuCategories = (role?: string): MenuCategory[] => {
  const categories: MenuCategory[] = [
    {
      id: 'core-operations',
      label: 'Core Operations',
      icon: 'Briefcase',
      color: 'emerald',
      items: coreOperationsItems,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: 'TrendingUp',
      color: 'blue',
      items: analyticsItems,
    },
  ];

  // Add compliance section for cashiers, managers and admins
  if (role && ['cashier', 'manager', 'admin'].includes(role)) {
    categories.push({
      id: 'compliance',
      label: 'Compliance',
      icon: 'Shield',
      color: 'amber',
      items: complianceItems,
    });
  }

  // Add administration section for cashier and admins
  if (role && ['cashier', 'admin'].includes(role)) {
    categories.push({
      id: 'administration',
      label: 'Administration',
      icon: 'Settings',
      color: 'red',
      items: administrationItems,
    });

    categories.push({
      id: 'integrations',
      label: 'System Integrations',
      icon: 'Zap',
      color: 'purple',
      items: integrationsItems,
    });
  }

  return categories;
};

// Get filtered menu items for a specific role
export const getMenuItemsForRole = (role?: string): MenuItem[] => {
  if (!role) return [];

  const allItems = [
    ...coreOperationsItems,
    ...analyticsItems,
    ...(role && ['cashier', 'manager', 'admin'].includes(role) ? complianceItems : []),
    ...(role && ['cashier', 'admin'].includes(role) ? administrationItems : []),
    ...(role && ['cashier', 'admin'].includes(role) ? integrationsItems : []),
  ];

  return allItems.filter((item) => item.roles.includes(role as any)).sort((a, b) => a.order - b.order);
};
