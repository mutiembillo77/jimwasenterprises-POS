import { LucideIcon } from 'lucide-react';

export type MenuCategory = 'operations' | 'analytics' | 'compliance' | 'admin' | 'integrations';
export type UserRole = 'admin' | 'manager' | 'cashier';

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  category: MenuCategory;
  roles: UserRole[];
  isIntegration?: boolean;
  description?: string;
}

export interface MenuCategory {
  id: MenuCategory;
  label: string;
  color: string;
  icon?: LucideIcon;
}

export interface SidebarState {
  isCollapsed: boolean;
}
