import { useState } from 'react';
import {
  ShoppingCart,
  Users,
  Package,
  CreditCard,
  BarChart3,
  Warehouse,
  Shield,
  FileText,
  DollarSign,
  Archive,
  Settings,
  ChevronLeft,
  ChevronRight,
  Database,
  CreditCard as StripeIcon,
  Zap,
  Cloud,
  Lock,
  BookOpen,
  Store,
  Briefcase,
  Clock,
  TrendingUp,
  BarChart2,
  Users2,
} from 'lucide-react';
import type { UserRole } from '../types/menu';

interface SidebarItem {
  id: string;
  label: string;
  icon: any;
  category: string;
  roles: UserRole[];
  isIntegration?: boolean;
}

interface CollapsibleSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
  userRole?: UserRole;
}

const menuItems: SidebarItem[] = [
  // Core Operations - Sales Workflows
  {
    id: 'pos',
    label: 'POS',
    icon: ShoppingCart,
    category: 'operations',
    roles: ['cashier', 'manager', 'admin'],
  },
  {
    id: 'retail',
    label: 'Retail Sales',
    icon: Store,
    category: 'operations',
    roles: ['cashier', 'manager', 'admin'],
  },
  {
    id: 'wholesale',
    label: 'Wholesale',
    icon: Briefcase,
    category: 'operations',
    roles: ['cashier', 'manager', 'admin'],
  },
  {
    id: 'lipa-mdogo-workflow',
    label: 'Lipa Mdogo (Workflow)',
    icon: CreditCard,
    category: 'operations',
    roles: ['cashier', 'manager', 'admin'],
  },
  {
    id: 'kyamaa',
    label: 'Kyamaa (Credit)',
    icon: FileText,
    category: 'operations',
    roles: ['manager', 'admin'],
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: Users,
    category: 'operations',
    roles: ['cashier', 'manager', 'admin'],
  },
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    category: 'operations',
    roles: ['manager', 'admin'],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Warehouse,
    category: 'operations',
    roles: ['manager', 'admin'],
  },
  {
    id: 'installments',
    label: 'Installments',
    icon: Clock,
    category: 'operations',
    roles: ['cashier', 'manager', 'admin'],
  },
  {
    id: 'shifts',
    label: 'Shifts',
    icon: Clock,
    category: 'operations',
    roles: ['cashier', 'manager', 'admin'],
  },
  {
    id: 'cash-drawer',
    label: 'Cash Drawer',
    icon: DollarSign,
    category: 'operations',
    roles: ['cashier', 'manager', 'admin'],
  },
  {
    id: 'stock',
    label: 'Stock Management',
    icon: Warehouse,
    category: 'operations',
    roles: ['manager', 'admin'],
  },
  // Analytics
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    category: 'analytics',
    roles: ['manager', 'admin'],
  },
  {
    id: 'reporting',
    label: 'Reporting',
    icon: TrendingUp,
    category: 'analytics',
    roles: ['manager', 'admin'],
  },
  // Compliance
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    category: 'compliance',
    roles: ['manager', 'admin'],
  },
  {
    id: 'audit',
    label: 'Audit Trail',
    icon: FileText,
    category: 'compliance',
    roles: ['manager', 'admin'],
  },
  {
    id: 'ledger',
    label: 'Ledger',
    icon: DollarSign,
    category: 'compliance',
    roles: ['manager', 'admin'],
  },
  // Administration
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    category: 'admin',
    roles: ['admin'],
  },
  {
    id: 'rbac',
    label: 'RBAC Management',
    icon: Users2,
    category: 'admin',
    roles: ['admin'],
  },
  {
    id: 'backup',
    label: 'Backup',
    icon: Archive,
    category: 'admin',
    roles: ['admin'],
  },
  // Integrations
  {
    id: 'databases',
    label: 'Databases',
    icon: Database,
    category: 'integrations',
    roles: ['admin'],
    isIntegration: true,
    description: 'Neon, Supabase, Aurora',
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: StripeIcon,
    category: 'integrations',
    roles: ['admin'],
    isIntegration: true,
    description: 'Stripe Integration',
  },
  {
    id: 'ai-tools',
    label: 'AI Tools',
    icon: Zap,
    category: 'integrations',
    roles: ['admin'],
    isIntegration: true,
    description: 'OpenAI, Anthropic, etc.',
  },
  {
    id: 'storage',
    label: 'Storage',
    icon: Cloud,
    category: 'integrations',
    roles: ['admin'],
    isIntegration: true,
    description: 'Vercel Blob, AWS S3',
  },
];

const categoryConfig = {
  operations: { label: 'Core Operations', color: 'text-emerald-400', bgColor: 'bg-emerald-900/20' },
  analytics: { label: 'Analytics', color: 'text-blue-400', bgColor: 'bg-blue-900/20' },
  compliance: { label: 'Compliance', color: 'text-amber-400', bgColor: 'bg-amber-900/20' },
  admin: { label: 'Administration', color: 'text-red-400', bgColor: 'bg-red-900/20' },
  integrations: { label: 'System Integrations', color: 'text-purple-400', bgColor: 'bg-purple-900/20' },
};

export function CollapsibleSidebar({
  isCollapsed,
  onToggle,
  currentPage,
  onNavigate,
  userRole = 'cashier',
}: CollapsibleSidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Filter items based on user role
  const filteredItems = menuItems.filter((item) => item.roles.includes(userRole));

  // Group items by category
  const groupedItems = filteredItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, SidebarItem[]>
  );

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-slate-800 border-r border-slate-700 transition-all duration-300 ease-in-out overflow-hidden ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Sidebar Header with Toggle */}
        <div className="flex-shrink-0 p-4 border-b border-slate-700 flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-sm font-semibold text-slate-300 truncate">Navigation</h2>
          )}
          <button
            onClick={onToggle}
            className="p-1.5 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-white"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Sidebar Content */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {(Object.keys(groupedItems) as Array<keyof typeof groupedItems>).map((category) => {
            const config = categoryConfig[category as keyof typeof categoryConfig];
            const items = groupedItems[category];

            if (!items || items.length === 0) return null;

            return (
              <div key={category}>
                {!isCollapsed && (
                  <div className={`px-3 py-1.5 text-xs font-semibold ${config.color} opacity-75`}>
                    {config.label}
                  </div>
                )}
                <div className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    const isHovered = hoveredItem === item.id;

                    return (
                      <div
                        key={item.id}
                        className="relative"
                        onMouseEnter={() => setHoveredItem(item.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <button
                          onClick={() => {
                            if (!item.isIntegration) {
                              onNavigate(item.id);
                            }
                          }}
                          disabled={item.isIntegration}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            item.isIntegration
                              ? 'cursor-default text-slate-500'
                              : isActive
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          <Icon size={18} className="flex-shrink-0" />
                          {!isCollapsed && (
                            <>
                              <span className="flex-1 truncate">{item.label}</span>
                              {item.isIntegration && (
                                <Lock size={14} className="text-slate-500" />
                              )}
                            </>
                          )}
                        </button>

                        {/* Tooltip for collapsed state */}
                        {isCollapsed && isHovered && (
                          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
                            <div className="bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap border border-slate-700">
                              {item.label}
                              {item.description && (
                                <div className="text-slate-400 text-[10px]">{item.description}</div>
                              )}
                            </div>
                            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 border-l border-t border-slate-700" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        {!isCollapsed && (
          <div className="flex-shrink-0 p-4 border-t border-slate-700">
            <div className="text-xs text-slate-500 text-center">
              Version 1.0
            </div>
          </div>
        )}
      </aside>

      {/* Tooltip when collapsed - positioned outside sidebar */}
      {isCollapsed && hoveredItem && (
        <div className="hidden lg:block fixed pointer-events-none">
          <div className="text-slate-300">
            {/* Tooltip is handled inline for better positioning */}
          </div>
        </div>
      )}
    </>
  );
}
