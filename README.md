# Jimwas Enterprises POS

![Jimwas Logo](/public/jimwas.ico)

A comprehensive, production-ready **Point of Sale (POS) system** with complete offline support, installment payment management, and real-time synchronization. Built with React, TypeScript, and modern PWA technologies.

**Status:** ✅ Production Ready | **Version:** 1.0.0 | **License:** Proprietary

---

## Quick Links

📚 **Documentation**:
- [System Documentation](./SYSTEM_DOCUMENTATION.md) - Complete system guide (phases, architecture, APIs)
- [Testing Guide](./TESTING_GUIDE.md) - Unit, integration, and E2E testing
- [Development Guide](#development-setup) - Local development setup

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Development Setup](#development-setup)
- [Project Phases](#project-phases)
- [Usage](#usage)
- [Architecture](#architecture)
- [PWA & Offline](#pwa--offline)
- [API & Database](#api--database)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Support](#support)

---

## Project Phases

The system was built in 6 architectural phases:

| Phase | Focus | Status |
|-------|-------|--------|
| **Phase 1** | Extended Transaction Model & Domain Models | ✅ Complete |
| **Phase 2** | Repository Pattern & Data Layer | ✅ Complete |
| **Phase 3** | Sales Workflows (Retail, Wholesale, Lipa Mdogo, Kyamaa) | ✅ Complete |
| **Phase 4** | Shifts, Cash Drawer, Stock Management | ✅ Complete |
| **Phase 5** | Reporting Engine & RBAC Dashboard | ✅ Complete |
| **Phase 6** | Testing, Documentation, Deployment | ✅ Complete |

**See [SYSTEM_DOCUMENTATION.md](./SYSTEM_DOCUMENTATION.md) for detailed phase breakdown.**

---

## Features

### Sales Workflows (Phase 3)
- **Retail Sales**: Standard over-the-counter sales with tax calculation and multiple payment methods
- **Wholesale Sales**: Bulk sales with customer requirements, discount management, and extended payment terms
- **Lipa Mdogo (Installments)**: Payment plan recording and collection interface
- **Kyamaa (Credit Sales)**: On-credit sales for trusted customers with manager approval
- **Unified Payment Processing**: Shared cart and payment components across all workflows
- **Receipt Generation**: Auto-numbered receipts with transaction tracking

### Core POS Functionality
- **Point of Sale Terminal**: Real-time transaction processing with cart management
- **Product Management**: Add, update, delete products with inventory tracking
- **Customer Management**: Customer profiles, contact information, loyalty tracking
- **Inventory Control**: Real-time stock levels, low stock alerts, stock movements
- **Transaction History**: Complete audit trail with timestamps and user attribution
- **Receipt Management**: Customizable receipts with business information
- **User Authentication**: Role-based access control (Admin, Cashier, Manager)
- **Loyalty Program**: Points system with customer rewards

### Operational Management (Phase 4)
- **Shift Management**: Open/close shifts with balance tracking and duration calculation
- **Cash Drawer**: Deposit/withdrawal tracking, reconciliation, and balance management
- **Stock Management**: Real-time inventory tracking with low stock alerts and reorder predictions
- **Automatic Status Indicators**: In Stock, Low Stock, Out of Stock classifications

### Reporting & Analytics (Phase 5)
- **Dashboard Metrics**: Real-time KPIs (today's sales, weekly trends, monthly targets)
- **Sales Reports**: Detailed analysis by sale type, payment method, and date range
- **Cashier Performance**: Individual cashier metrics, accuracy tracking, discrepancy detection
- **Inventory Reports**: Stock status, reorder predictions, velocity analysis
- **Custom Reports**: Flexible date range selection and CSV export

### RBAC System (Phase 5)
- **3 Predefined Roles**: Cashier, Manager, Administrator
- **16 Granular Permissions**: Across Sales, Inventory, Reports, Users, Operations, and Admin categories
- **Role Management**: Create custom roles with permission inheritance
- **User Management**: Assign roles, track login history, manage access

### Offline & PWA Features
- **Progressive Web App**: Installable on mobile and desktop
- **Offline Operation**: Full functionality without internet connection
- **Sync Queue**: Automatic queuing of operations when offline
- **Smart Caching**: Intelligent cache strategies for performance
- **Network Detection**: Real-time online/offline status
- **Automatic Sync**: Sync when connection restored
- **Sync Metrics**: Performance monitoring and health dashboard

### Advanced Features
- **Security Dashboard**: User roles, permissions, audit logs
- **Business Settings**: Receipt customization, payment configuration
- **Backup & Recovery**: Data export and import
- **Reporting**: Transaction reports, sales analytics
- **Mobile-Friendly**: Responsive design for all device sizes

---

## Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Git
- HTTPS enabled for production (required for PWA)

### Development

```bash
# Clone the repository
git clone https://github.com/mutiembillo77/jimwasenterprises-POS.git
cd jimwasenterprises-POS

# Install dependencies
pnpm install
# or npm install
# or yarn install
# or bun install

# Start development server
pnpm dev

# Open http://localhost:5173 in your browser
```

**Default Login Credentials (Development):**
- Username: `admin`
- Password: `admin123`

---

## Installation

### From ZIP Archive

1. Download the ZIP file
2. Extract to your desired location
3. Navigate to the project directory
4. Install dependencies: `pnpm install`
5. Start dev server: `pnpm dev`

### From GitHub

```bash
git clone https://github.com/mutiembillo77/jimwasenterprises-POS.git
cd jimwasenterprises-POS
pnpm install
pnpm dev
```

### Environment Variables

Create a `.env.local` file in the project root (optional for development):

```env
# Supabase Configuration (optional)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **Note:** The app works without Supabase configured. Sync operations will queue offline-first and require manual setup when online.

---

## Usage

### Logging In

1. Start the app and navigate to the login screen
2. Enter credentials (default: admin/admin123)
3. Click "Login"
4. You'll be directed to the POS dashboard

### POS Terminal

1. **Navigate to POS** from the main menu
2. **Search for products** by name or code
3. **Add items to cart** by clicking them
4. **Adjust quantities** with +/- buttons
5. **Select customer** (optional for loyalty tracking)
6. **Click Checkout**
7. **Select sale type**: Retail, Wholesale, or Lipa Mdogo Mdogo
8. **Choose payment method**: Cash, Card, or Mobile
9. **Enter amount paid**
10. **Complete transaction**

### Creating Installment Plans

1. Navigate to **Lipa Mdogo Mdogo**
2. Click **New Plan**
3. Fill in:
   - Product name
   - Total amount
   - Notes (optional)
4. Click **Create Plan**
5. To record payment: Click **Record Payment** on the plan
6. Enter amount and payment method

### Managing Products

1. Navigate to **Products**
2. Click **Add Product**
3. Fill in details:
   - Name
   - Price (Ksh)
   - Stock quantity
   - Category
4. Click **Add Product**

### Viewing Customers

1. Navigate to **Customers**
2. View all customers with loyalty info
3. Click customer to see transaction history
4. Add new customer with **Add Customer**

---

## Architecture

### Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Database**: IndexedDB (local) + Supabase (optional remote)
- **State**: React Context + Hooks + SWR
- **PWA**: Service Workers, Web Manifest
- **Icons**: Lucide React

### Project Structure

```
jimwasenterprises-POS/
├── public/                      # Static assets
│   ├── jimwas.ico              # App icon
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   └── offline.html            # Offline fallback
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── Layout.tsx          # Main layout with nav
│   │   ├── SyncMetricsPanel.tsx # Sync dashboard
│   │   └── ...
│   ├── hooks/                  # Custom React hooks
│   │   ├── useOnlineStatus.ts  # Network detection
│   │   ├── useSyncMetrics.ts   # Metrics monitoring
│   │   └── ...
│   ├── routes/                 # Page components
│   │   ├── pos.tsx             # POS terminal
│   │   ├── products.tsx        # Product management
│   │   ├── installments.tsx    # Lipa Mdogo Mdogo
│   │   ├── settings.tsx        # Settings/admin
│   │   └── ...
│   ├── context/                # React context
│   │   └── AuthContext.tsx     # Authentication
│   ├── lib/                    # Business logic
│   │   ├── db.ts              # IndexedDB operations
│   │   ├── sync.ts            # Sync engine
│   │   ├── syncMetrics.ts     # Metrics tracking
│   │   ├── auth.ts            # Auth logic
│   │   ├── permissions.ts     # RBAC
│   │   └── types.ts           # TypeScript types
│   ├── App.tsx                # Root component
│   ├── main.tsx               # Entry point with SW registration
│   └── index.css              # Global styles
├── index.html                 # HTML template
├── vite.config.ts            # Vite configuration
├── tailwind.config.ts        # Tailwind configuration
├── package.json              # Dependencies
└── README.md                 # This file
```

### Data Flow

```
┌─────────────────┐
│  UI Components  │
└────────┬────────┘
         │
    ┌────▼─────┐
    │   Hooks  │ ← useSyncMetrics, useOnlineStatus, useAuth
    └────┬─────┘
         │
    ┌────▼──────────┐
    │  React State  │ ← Context API, useState
    └────┬──────────┘
         │
    ┌────▼────────────────────┐
    │  Business Logic (lib/)   │ ← sync, auth, permissions
    └────┬────────────────────┘
         │
    ┌────▼──────────────────┐
    │  Data Layer (db.ts)   │
    └────┬──────────────────┘
         │
    ┌────┴─────────────┐
    │                  │
┌───▼──────┐    ┌──────▼──────┐
│ IndexedDB│    │  Supabase   │
│ (Local)  │    │  (Remote)   │
└──────────┘    └─────────────┘
```

---

## PWA & Offline

### Progressive Web App Features

The app is fully installable as a native app on iOS, Android, and desktop:

#### Installation Methods

**Desktop (Chrome/Edge):**
1. Click "Install app" when prompted
2. Or click the menu icon → "Install app"

**Mobile (Android):**
1. Open the app in Chrome
2. Tap the menu icon → "Install app"

**iOS (Safari):**
1. Open the app in Safari
2. Tap the Share icon
3. Tap "Add to Home Screen"

### Offline Functionality

#### What Works Offline
- ✅ View all cached products and customers
- ✅ Create transactions and sales
- ✅ Add products to cart
- ✅ Record payments and installments
- ✅ View transaction history
- ✅ Access all cached data

#### What Gets Queued
- ✅ Transaction creation
- ✅ Product/customer updates
- ✅ Payment recording
- ✅ User/role changes

#### Automatic Sync
When the app detects internet connectivity:
1. Automatically syncs all queued operations
2. Pulls latest data from server
3. Updates offline cache
4. Reports sync metrics

### Caching Strategies

| Asset Type | Strategy | Purpose |
|-----------|----------|---------|
| Images | Cache-first | Fast loads, rarely change |
| CSS/JS | Stale-while-revalidate | Updated in background |
| HTML | Network-first | Always get latest |
| API calls | Network-first with offline fallback | Fresh data when possible |

### Sync Metrics Dashboard

Monitor sync health in **Settings → Sync Metrics**:

- **Total Operations**: All sync attempts
- **Success Rate**: Percentage successful
- **Pending**: Waiting to sync
- **Avg Duration**: Average sync time
- **Health Status**: Green/Amber warnings
- **Operations by Table**: Breakdown by data type

---

## API & Database

### Database Schema

#### Core Tables

**Products**
```typescript
{
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

**Customers**
```typescript
{
  id: string;
  name: string;
  phone?: string;
  email?: string;
  loyalty_points: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}
```

**Transactions**
```typescript
{
  id: string;
  customer_id?: string;
  total_amount: number;
  amount_paid: number;
  payment_method: 'cash' | 'card' | 'mobile';
  receipt_number: string;
  status: 'completed' | 'pending' | 'cancelled';
  items: CartItem[];
  created_at: string;
  updated_at: string;
}
```

**Installment Plans**
```typescript
{
  id: string;
  customer_id: string;
  product_id: string;
  product_name: string;
  total_amount: number;
  amount_paid: number;
  status: 'active' | 'completed' | 'cancelled';
  installment_count: number;
  created_at: string;
  updated_at: string;
}
```

### Local Storage (IndexedDB)

All data is stored locally in the browser's IndexedDB, allowing full offline functionality. When online, this data is synced with Supabase.

### Sync Engine

The sync engine (`src/lib/sync.ts`) handles:
- Detecting online/offline status
- Queuing operations when offline
- Syncing data when connection restored
- Conflict resolution
- Metrics recording

---

## Deployment

### Production Build

```bash
# Build for production
pnpm build

# Preview production build locally
pnpm preview
```

### Deployment to Vercel (Recommended)

```bash
# Login to Vercel
vercel login

# Deploy
vercel
```

### Deployment to Other Platforms

#### Netlify
```bash
# Build and deploy
netlify deploy --prod --dir dist
```

#### GitHub Pages
```bash
# Update vite.config.ts with correct base path
# Then build and deploy to gh-pages branch
```

### Deployment Checklist

- [ ] HTTPS enabled (required for PWA)
- [ ] Environment variables configured
- [ ] Service Worker cache version updated
- [ ] PWA manifest configured
- [ ] Supabase connection tested
- [ ] Backup procedures in place
- [ ] Monitoring enabled
- [ ] Support procedures documented

### Production Requirements

- **HTTPS**: Required for service workers and PWA
- **Browser Support**: Modern browsers (ES6+)
- **IndexedDB**: Supported in all modern browsers
- **Storage**: ~50MB for typical usage

---

## Configuration

### Customizing Business Settings

1. Navigate to **Settings → General**
2. Configure:
   - Business name
   - Receipt header/footer
   - Phone number
   - Email

### Customizing Receipt

1. Go to **Settings → Receipt**
2. Configure:
   - Receipt format
   - Custom messages
   - Line item display

### Payment Methods

1. Go to **Settings → Payments**
2. Enable/disable:
   - Cash
   - Card
   - Mobile money

---

## Monitoring

### Health Checks

Regular monitoring ensures system health:

```bash
# Check sync success rate
Settings → Sync Metrics

# View audit logs
Settings → Audit Logs

# Monitor user activity
Settings → Users → Activity
```

### Alerts & Warnings

The system triggers warnings when:
- Sync success rate < 70%
- Pending operations > 100
- Average sync duration > 5 seconds
- Critical errors occur

### Performance Monitoring

Monitor via Sync Metrics Dashboard:
- Operation success rates
- Sync duration trends
- Error patterns
- Data by operation type

---

## Troubleshooting

### App Won't Load

**Problem**: Blank white page on startup

**Solutions**:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Clear IndexedDB data
3. Hard refresh (Ctrl+F5)
4. Check browser console (F12) for errors
5. Ensure JavaScript is enabled

### Offline Not Working

**Problem**: Operations not saving offline

**Solutions**:
1. Check if service worker is registered (DevTools → Application → Service Workers)
2. Ensure HTTPS in production
3. Check browser's offline storage permissions
4. Verify IndexedDB quota (Settings → Storage)

### Sync Not Working

**Problem**: Data not syncing when online

**Solutions**:
1. Check network connection
2. Verify Supabase credentials in .env.local
3. Check sync metrics dashboard for errors
4. Click "Sync Now" in header manually
5. Check browser DevTools console

### Performance Issues

**Problem**: App is slow

**Solutions**:
1. Clear old cached data (DevTools → Storage → Clear All)
2. Check network tab for slow API calls
3. Review Sync Metrics for operation durations
4. Reduce number of products/customers loaded
5. Check available storage space

### Login Not Working

**Problem**: Can't login

**Solutions**:
1. Ensure correct credentials (admin/admin123 for dev)
2. Check if Auth database is initialized
3. Clear browser cookies and cache
4. Check browser console for auth errors
5. Verify IndexedDB has data

### PWA Installation Failed

**Problem**: Can't install app

**Solutions**:
1. Ensure HTTPS (required for PWA)
2. Check manifest.json is valid
3. Verify service worker is registered
4. Try incognito/private browsing
5. Check browser's PWA support

---

## Contributing

### Local Development

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make changes and test thoroughly
4. Commit: `git commit -m "feat: describe your changes"`
5. Push: `git push origin feature/your-feature`
6. Create a pull request

### Code Standards

- TypeScript for type safety
- React best practices
- Tailwind CSS for styling
- Descriptive commit messages
- Comprehensive documentation

### Testing

```bash
# Run linting
pnpm lint

# Build check
pnpm build
```

---

## Support

### Getting Help

- **Documentation**: See PWA_IMPLEMENTATION.md for detailed PWA guide
- **Issues**: Report bugs on GitHub
- **Discussion**: Use GitHub Discussions for questions
- **Email**: contact@jimwasenterprises.com

### Common Questions

**Q: Does it work on iOS?**  
A: Yes! Install via Safari → Share → Add to Home Screen

**Q: Can I use it without internet?**  
A: Yes, full offline support with automatic sync when online

**Q: What happens to my data if I uninstall?**  
A: All data is stored locally. Export before uninstalling if needed.

**Q: How secure is my data?**  
A: Data is stored locally in IndexedDB. Use HTTPS in production. Implement additional security based on your requirements.

**Q: Can I sync to a custom database?**  
A: Yes, modify sync.ts to integrate your database

---

## License

**Proprietary** - © 2026 Jimwas Enterprises. All rights reserved.

---

## Version History

### v1.0.0 (Current)
- ✅ Complete PWA implementation
- ✅ Offline support with sync queue
- ✅ Lipa Mdogo Mdogo (installments)
- ✅ Sale type selection modal
- ✅ Sync metrics monitoring
- ✅ Admin dashboard
- ✅ Full RBAC system
- ✅ Comprehensive documentation

---

## Acknowledgments

Built with:
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- Lucide Icons

---

## Contact & Support

**Jimwas Enterprises**  
📧 Email: support@jimwasenterprises.com  
🌐 Website: www.jimwasenterprises.com  
📱 Phone: +254 0711221241

---

**Last Updated:** June 27, 2026  
**Status:** Production Ready ✅
