// Settings Page - Business settings, user management, and payment configuration

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { RoleGuard } from '../context/AuthContext';
import { SyncMetricsPanel } from '../components/SyncMetricsPanel';
import {
  Settings, Users, CreditCard, Building, Save, Plus, Edit, Trash2, Eye, EyeOff,
  Check, X, Smartphone, ToggleLeft, ToggleRight, Shield, RefreshCw, AlertCircle, TrendingUp, Printer
} from 'lucide-react';
import {
  BusinessSettings,
  MpesaSettings,
  PaymentMethodConfig,
  LoyaltySettings,
  ReceiptSettings,
  DEFAULT_BUSINESS_SETTINGS,
  DEFAULT_MPESA_SETTINGS,
  DEFAULT_LOYALTY_SETTINGS,
  DEFAULT_RECEIPT_SETTINGS,
  DEFAULT_PAYMENT_METHODS,
} from '../lib/settings-types';
import {
  saveBusinessSettings,
  getBusinessSettings,
  saveMpesaSettings,
  getMpesaSettings,
  getAllPaymentMethods,
  savePaymentMethod,
  saveLoyaltySettings,
  getLoyaltySettings,
  saveReceiptSettings,
  getReceiptSettings,
  getAllUsers,
  saveUser,
  getUser,
} from '../lib/db';
import { createUser, updateUserRole, updateUserStatus, resetUserPassword } from '../lib/auth';
import { printTestPage } from '../lib/receipt';
import type { User } from '../lib/security-types';

type SettingsTab = 'general' | 'users' | 'payments' | 'receipt' | 'loyalty' | 'metrics';

export function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isLoading, setIsLoading] = useState(true);

  // Settings state
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(DEFAULT_BUSINESS_SETTINGS);
  const [mpesaSettings, setMpesaSettings] = useState<MpesaSettings>(DEFAULT_MPESA_SETTINGS);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(DEFAULT_PAYMENT_METHODS);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings>(DEFAULT_LOYALTY_SETTINGS);
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>(DEFAULT_RECEIPT_SETTINGS);
  const [users, setUsers] = useState<User[]>([]);

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showMpesaSecret, setShowMpesaSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    setIsLoading(true);
    try {
      const [
        loadedBusiness,
        loadedMpesa,
        loadedPayments,
        loadedLoyalty,
        loadedReceipt,
        loadedUsers,
      ] = await Promise.all([
        getBusinessSettings(),
        getMpesaSettings(),
        getAllPaymentMethods(),
        getLoyaltySettings(),
        getReceiptSettings(),
        getAllUsers(),
      ]);

      if (loadedBusiness) setBusinessSettings(loadedBusiness);
      if (loadedMpesa) setMpesaSettings(loadedMpesa);
      if (loadedPayments.length > 0) setPaymentMethods(loadedPayments);
      if (loadedLoyalty) setLoyaltySettings(loadedLoyalty);
      if (loadedReceipt) setReceiptSettings(loadedReceipt);
      setUsers(loadedUsers);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const saveBusiness = async () => {
    setSaving(true);
    try {
      await saveBusinessSettings({
        ...businessSettings,
        updated_at: new Date().toISOString(),
        sync_status: 'pending',
      });
      showMessage('success', 'Business settings saved successfully');
    } catch (error) {
      showMessage('error', 'Failed to save business settings');
    } finally {
      setSaving(false);
    }
  };

  const saveMpesa = async () => {
    setSaving(true);
    try {
      await saveMpesaSettings({
        ...mpesaSettings,
        last_updated: new Date().toISOString(),
        last_updated_by: user?.id,
        updated_at: new Date().toISOString(),
        sync_status: 'pending',
      });
      showMessage('success', 'M-Pesa settings saved successfully');
    } catch (error) {
      showMessage('error', 'Failed to save M-Pesa settings');
    } finally {
      setSaving(false);
    }
  };

  const togglePaymentMethod = async (method: PaymentMethodConfig) => {
    const updated = { ...method, is_enabled: !method.is_enabled, updated_at: new Date().toISOString() };
    await savePaymentMethod(updated);
    setPaymentMethods(prev => prev.map(m => m.id === method.id ? updated : m));
    showMessage('success', `${method.display_name} ${updated.is_enabled ? 'enabled' : 'disabled'}`);
  };

  const saveLoyalty = async () => {
    setSaving(true);
    try {
      await saveLoyaltySettings({
        ...loyaltySettings,
        updated_at: new Date().toISOString(),
        sync_status: 'pending',
      });
      showMessage('success', 'Loyalty settings saved successfully');
    } catch (error) {
      showMessage('error', 'Failed to save loyalty settings');
    } finally {
      setSaving(false);
    }
  };

  const saveReceipt = async () => {
    setSaving(true);
    try {
      await saveReceiptSettings({
        ...receiptSettings,
        updated_at: new Date().toISOString(),
        sync_status: 'pending',
      });
      showMessage('success', 'Receipt settings saved successfully');
    } catch (error) {
      showMessage('error', 'Failed to save receipt settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Building },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'receipt', label: 'Receipt', icon: Settings },
    { id: 'loyalty', label: 'Loyalty', icon: RefreshCw },
    { id: 'metrics', label: 'Sync Metrics', icon: TrendingUp },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400">Configure your POS system</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700' : 'bg-red-900/30 text-red-400 border border-red-700'
        }`}>
          {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-700">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                  isActive
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 overflow-y-auto flex-1 min-h-0">
        {activeTab === 'general' && (
          <GeneralSettingsTab
            settings={businessSettings}
            onChange={setBusinessSettings}
            onSave={saveBusiness}
            saving={saving}
          />
        )}

        {activeTab === 'users' && (
          <RoleGuard allowedRoles={['admin']}>
            <UsersTab
              users={users}
              currentUser={user}
              onRefresh={loadAllSettings}
              onEdit={(u) => { setEditingUser(u); setShowUserModal(true); }}
            />
            <div className="text-slate-400 p-4">Only admins can manage users.</div>
          </RoleGuard>
        )}

        {activeTab === 'payments' && (
          <PaymentsTab
            mpesaSettings={mpesaSettings}
            paymentMethods={paymentMethods}
            onMpesaChange={setMpesaSettings}
            onTogglePayment={togglePaymentMethod}
            onSaveMpesa={saveMpesa}
            saving={saving}
            showSecret={showMpesaSecret}
            onToggleSecret={() => setShowMpesaSecret(!showMpesaSecret)}
            message={message}
          />
        )}

        {activeTab === 'receipt' && (
          <ReceiptSettingsTab
            settings={receiptSettings}
            onChange={setReceiptSettings}
            onSave={saveReceipt}
            saving={saving}
          />
        )}

        {activeTab === 'loyalty' && (
          <LoyaltySettingsTab
            settings={loyaltySettings}
            onChange={setLoyaltySettings}
            onSave={saveLoyalty}
            saving={saving}
          />
        )}

        {activeTab === 'metrics' && (
          <RoleGuard allowedRoles={['admin']}>
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Sync Performance Metrics</h2>
                <p className="text-slate-400 mb-6">Monitor your offline sync operations and system health</p>
              </div>
              <SyncMetricsPanel />
            </div>
          </RoleGuard>
        )}
      </div>

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          user={editingUser}
          currentUserId={user?.id}
          onClose={() => { setShowUserModal(false); setEditingUser(null); }}
          onSaved={loadAllSettings}
        />
      )}
    </div>
  );
}

// ============ GENERAL SETTINGS TAB ============
function GeneralSettingsTab({
  settings,
  onChange,
  onSave,
  saving,
}: {
  settings: BusinessSettings;
  onChange: (s: BusinessSettings) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <Building size={20} />
        Business Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm text-slate-400 mb-2">Business Name</label>
          <input
            type="text"
            value={settings.business_name}
            onChange={(e) => onChange({ ...settings, business_name: e.target.value })}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">Phone Number</label>
          <input
            type="tel"
            value={settings.business_phone}
            onChange={(e) => onChange({ ...settings, business_phone: e.target.value })}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">Email</label>
          <input
            type="email"
            value={settings.business_email || ''}
            onChange={(e) => onChange({ ...settings, business_email: e.target.value })}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">Address</label>
          <input
            type="text"
            value={settings.business_address || ''}
            onChange={(e) => onChange({ ...settings, business_address: e.target.value })}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">Tax ID (PIN)</label>
          <input
            type="text"
            value={settings.tax_id || ''}
            onChange={(e) => onChange({ ...settings, tax_id: e.target.value })}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">Currency</label>
          <select
            value={settings.currency}
            onChange={(e) => onChange({ ...settings, currency: e.target.value, currency_symbol: e.target.value })}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
          >
            <option value="KES">KES - Kenyan Shilling</option>
            <option value="USD">USD - US Dollar</option>
            <option value="UGX">UGX - Ugandan Shilling</option>
            <option value="TZS">TZS - Tanzanian Shilling</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-2">Receipt Header Message</label>
          <input
            type="text"
            value={settings.receipt_header || ''}
            onChange={(e) => onChange({ ...settings, receipt_header: e.target.value })}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">Receipt Footer Message</label>
          <input
            type="text"
            value={settings.receipt_footer || ''}
            onChange={(e) => onChange({ ...settings, receipt_footer: e.target.value })}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.show_tax_on_receipt}
            onChange={(e) => onChange({ ...settings, show_tax_on_receipt: e.target.checked })}
            className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
          />
          <span className="text-white">Show tax breakdown on receipts</span>
        </label>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-700">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============ USERS TAB ============
function UsersTab({
  users,
  currentUser,
  onRefresh,
  onEdit,
}: {
  users: User[];
  currentUser?: User | null;
  onRefresh: () => void;
  onEdit: (user: User) => void;
}) {
  const [showModal, setShowModal] = useState(false);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-900/30 text-red-400';
      case 'manager': return 'bg-amber-900/30 text-amber-400';
      case 'cashier': return 'bg-blue-900/30 text-blue-400';
      default: return 'bg-slate-700 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users size={20} />
          User Management
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
        >
          <Plus size={18} />
          Add User
        </button>
      </div>

      <div className="divide-y divide-slate-700">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center">
                <Users size={24} className="text-slate-400" />
              </div>
              <div>
                <p className="text-white font-medium">{u.full_name}</p>
                <p className="text-sm text-slate-400">@{u.username}</p>
                <p className="text-xs text-slate-500">{u.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-xs ${getRoleColor(u.role_code)}`}>
                {u.role_code.charAt(0).toUpperCase() + u.role_code.slice(1)}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs ${u.is_active ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
                {u.is_active ? 'Active' : 'Inactive'}
              </span>
              {currentUser?.id !== u.id && (
                <button
                  onClick={() => onEdit(u)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                >
                  <Edit size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <UserModal
          user={null}
          currentUserId={currentUser?.id}
          onClose={() => setShowModal(false)}
          onSaved={onRefresh}
        />
      )}
    </div>
  );
}

// ============ PAYMENTS TAB ============
function PaymentsTab({
  mpesaSettings,
  paymentMethods,
  onMpesaChange,
  onTogglePayment,
  onSaveMpesa,
  saving,
  showSecret,
  onToggleSecret,
  message,
}: {
  mpesaSettings: MpesaSettings;
  paymentMethods: PaymentMethodConfig[];
  onMpesaChange: (s: MpesaSettings) => void;
  onTogglePayment: (m: PaymentMethodConfig) => void;
  onSaveMpesa: () => void;
  saving: boolean;
  showSecret: boolean;
  onToggleSecret: () => void;
  message?: { type: 'success' | 'error'; text: string } | null;
}) {
  return (
    <div className="space-y-8">
      {/* Success/Error Messages */}
      {message && (
        <div
          className={`p-4 rounded-lg border flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-900/30 border-emerald-700 text-emerald-300'
              : 'bg-red-900/30 border-red-700 text-red-300'
          }`}
        >
          {message.type === 'success' ? (
            <Check size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}
      {/* Payment Methods */}
      <div>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <CreditCard size={20} />
          Payment Methods
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="flex items-center justify-between p-4 bg-slate-700 rounded-lg"
            >
              <div>
                <p className="text-white font-medium">{method.display_name}</p>
                <p className="text-xs text-slate-400">
                  {method.requires_reference ? 'Requires reference number' : 'No reference required'}
                </p>
              </div>
              <button
                onClick={() => onTogglePayment(method)}
                className={`p-2 rounded-lg transition ${
                  method.is_enabled
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-600 hover:bg-slate-500 text-slate-400'
                }`}
              >
                {method.is_enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* M-Pesa STK Push Settings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Smartphone size={20} />
              M-Pesa STK Push Settings
            </h2>
            {mpesaSettings.last_updated && (
              <p className="text-xs text-slate-400 mt-1">
                Last updated: {new Date(mpesaSettings.last_updated).toLocaleString()}
                {mpesaSettings.last_updated_by && ` by user`}
              </p>
            )}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-slate-400">Enabled</span>
            <button
              onClick={() => onMpesaChange({ ...mpesaSettings, is_enabled: !mpesaSettings.is_enabled })}
              className={`p-1 rounded-lg transition ${
                mpesaSettings.is_enabled
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-600 text-slate-400'
              }`}
            >
              {mpesaSettings.is_enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
            </button>
          </label>
        </div>

        {mpesaSettings.is_enabled && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Environment</label>
                <select
                  value={mpesaSettings.environment}
                  onChange={(e) => onMpesaChange({ ...mpesaSettings, environment: e.target.value as 'sandbox' | 'production' })}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="sandbox">Sandbox (Testing)</option>
                  <option value="production">Production (Live)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Short Code / Paybill</label>
                <input
                  type="text"
                  value={mpesaSettings.short_code}
                  onChange={(e) => onMpesaChange({ ...mpesaSettings, short_code: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g., 174379"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Till Number (optional)</label>
                <input
                  type="text"
                  value={mpesaSettings.till_number || ''}
                  onChange={(e) => onMpesaChange({ ...mpesaSettings, till_number: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g., 987654"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Country Code</label>
                <input
                  type="text"
                  value={mpesaSettings.default_phone_country_code}
                  onChange={(e) => onMpesaChange({ ...mpesaSettings, default_phone_country_code: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                  placeholder="254"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-600">
              <h3 className="text-sm font-medium text-slate-300">API Credentials</h3>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Consumer Key</label>
                <input
                  type="text"
                  value={mpesaSettings.consumer_key}
                  onChange={(e) => onMpesaChange({ ...mpesaSettings, consumer_key: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none font-mono text-sm"
                  placeholder="Your consumer key"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Consumer Secret</label>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={mpesaSettings.consumer_secret}
                    onChange={(e) => onMpesaChange({ ...mpesaSettings, consumer_secret: e.target.value })}
                    className="w-full px-4 py-3 pr-12 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none font-mono text-sm"
                    placeholder="Your consumer secret"
                  />
                  <button
                    type="button"
                    onClick={onToggleSecret}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showSecret ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Passkey</label>
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={mpesaSettings.passkey}
                  onChange={(e) => onMpesaChange({ ...mpesaSettings, passkey: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none font-mono text-sm"
                  placeholder="Your passkey"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-600">
              <h3 className="text-sm font-medium text-slate-300">Callback & Timeout URLs</h3>
              <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-3 space-y-2">
                <p className="text-xs text-amber-400">
                  <span className="font-semibold">Important:</span> These URLs receive payment notifications from M-Pesa. Must use HTTPS.
                </p>
                <div className="text-xs text-amber-300 space-y-1">
                  <p><span className="font-mono bg-slate-700 px-2 py-1 rounded">Development:</span> https://[ngrok-id].ngrok.io/api/mpesa/callback</p>
                  <p><span className="font-mono bg-slate-700 px-2 py-1 rounded">Vercel:</span> https://[project].vercel.app/api/mpesa/callback</p>
                  <p><span className="font-mono bg-slate-700 px-2 py-1 rounded">Self-Hosted:</span> https://your-domain.com/api/mpesa/callback</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm text-slate-400 font-medium">Callback URL</label>
                    <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded">Payment Success</span>
                  </div>
                  <input
                    type="url"
                    value={mpesaSettings.callback_url || ''}
                    onChange={(e) => onMpesaChange({ ...mpesaSettings, callback_url: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none text-sm"
                    placeholder="https://your-url.com/api/mpesa/callback"
                  />
                  <p className="text-xs text-slate-500 mt-2">Receives confirmation when payment is successful</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm text-slate-400 font-medium">Timeout URL</label>
                    <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">Payment Failed/Cancelled</span>
                  </div>
                  <input
                    type="url"
                    value={mpesaSettings.timeout_url || ''}
                    onChange={(e) => onMpesaChange({ ...mpesaSettings, timeout_url: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none text-sm"
                    placeholder="https://your-url.com/api/mpesa/timeout"
                  />
                  <p className="text-xs text-slate-500 mt-2">Receives notification when payment fails, times out, or is cancelled</p>
                </div>
              </div>
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
                <p className="text-xs text-blue-300">
                  <span className="font-semibold">Need help?</span> See MPESA_URLS_SPECIFICATION.md for exact URLs for your deployment type.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-600">
              <h3 className="text-sm font-medium text-slate-300">Polling & Callback Settings</h3>
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
                <p className="text-xs text-blue-400">
                  Polling automatically checks payment status every 5 seconds as a backup if webhooks fail to arrive.
                  Maximum polling duration is 5 minutes per transaction.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Polling Enabled</label>
                  <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      disabled
                      className="w-5 h-5"
                    />
                    <span className="text-white text-sm">Always enabled (automatic fallback)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Polling Interval</label>
                  <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                    <span className="text-white text-sm font-mono">5 seconds</span>
                    <span className="text-slate-500 text-xs">(fixed)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Max Polling Duration</label>
                  <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                    <span className="text-white text-sm font-mono">5 minutes</span>
                    <span className="text-slate-500 text-xs">(fixed)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Webhook Timeout</label>
                  <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                    <span className="text-white text-sm font-mono">30 seconds</span>
                    <span className="text-slate-500 text-xs">(before polling starts)</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700 rounded-lg p-3">
                <p className="text-xs text-slate-400">
                  <span className="font-medium">How it works:</span> After STK PUSH is initiated, the system starts automatic polling. 
                  If a webhook callback arrives, polling stops immediately. If no callback within 30 seconds, polling continues 
                  until payment is confirmed or 5 minutes pass.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-slate-600">
              {/* Validation warnings */}
              {mpesaSettings.is_enabled && (
                <div className="space-y-2">
                  {!mpesaSettings.consumer_key && (
                    <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg flex items-center gap-2">
                      <AlertCircle size={18} className="text-yellow-400" />
                      <p className="text-xs text-yellow-300">Consumer Key is required</p>
                    </div>
                  )}
                  {!mpesaSettings.consumer_secret && (
                    <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg flex items-center gap-2">
                      <AlertCircle size={18} className="text-yellow-400" />
                      <p className="text-xs text-yellow-300">Consumer Secret is required</p>
                    </div>
                  )}
                  {!mpesaSettings.callback_url && (
                    <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg flex items-center gap-2">
                      <AlertCircle size={18} className="text-yellow-400" />
                      <p className="text-xs text-yellow-300">Callback URL is required</p>
                    </div>
                  )}
                  {!mpesaSettings.timeout_url && (
                    <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg flex items-center gap-2">
                      <AlertCircle size={18} className="text-yellow-400" />
                      <p className="text-xs text-yellow-300">Timeout URL is required</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={onSaveMpesa}
                  disabled={saving || (mpesaSettings.is_enabled && (!mpesaSettings.consumer_key || !mpesaSettings.consumer_secret || !mpesaSettings.callback_url || !mpesaSettings.timeout_url))}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Save M-Pesa Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ RECEIPT SETTINGS TAB ============
function ReceiptSettingsTab({
  settings,
  onChange,
  onSave,
  saving,
}: {
  settings: ReceiptSettings;
  onChange: (s: ReceiptSettings) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const checkboxes = [
    { key: 'show_customer_name', label: 'Show customer name' },
    { key: 'show_customer_phone', label: 'Show customer phone' },
    { key: 'show_item_barcode', label: 'Show item barcode' },
    { key: 'show_item_sku', label: 'Show item SKU' },
    { key: 'show_cashier_name', label: 'Show cashier name' },
    { key: 'show_branch_name', label: 'Show branch name' },
    { key: 'show_tax_breakdown', label: 'Show tax breakdown' },
    { key: 'print_copy_for_customer', label: 'Print copy for customer' },
    { key: 'print_copy_for_merchant', label: 'Print copy for merchant' },
  ] as const;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <Settings size={20} />
        Receipt Settings
      </h2>

      <div>
        <label className="block text-sm text-slate-400 mb-2">Paper Width</label>
        <select
          value={settings.paper_width}
          onChange={(e) => onChange({ ...settings, paper_width: e.target.value as '58mm' | '80mm' })}
          className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
        >
          <option value="58mm">58mm (Small)</option>
          <option value="80mm">80mm (Standard)</option>
        </select>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-300">Display Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {checkboxes.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={(e) => onChange({ ...settings, [key]: e.target.checked })}
                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-white">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-slate-700">
        <button
          onClick={printTestPage}
          type="button"
          className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition flex items-center justify-center gap-2"
        >
          <Printer size={18} />
          Print Test Page
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Receipt Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============ LOYALTY SETTINGS TAB ============
function LoyaltySettingsTab({
  settings,
  onChange,
  onSave,
  saving,
}: {
  settings: LoyaltySettings;
  onChange: (s: LoyaltySettings) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <RefreshCw size={20} />
          Loyalty Program Settings
        </h2>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-slate-400">Enabled</span>
          <button
            onClick={() => onChange({ ...settings, is_enabled: !settings.is_enabled })}
            className={`p-1 rounded-lg transition ${
              settings.is_enabled
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-600 text-slate-400'
            }`}
          >
            {settings.is_enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          </button>
        </label>
      </div>

      {settings.is_enabled && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Points per Currency</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings.points_per_currency}
                  onChange={(e) => onChange({ ...settings, points_per_currency: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                  min="1"
                />
                <span className="text-slate-400 whitespace-nowrap">KES = 1 point</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Point Value (KES)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings.point_value}
                  onChange={(e) => onChange({ ...settings, point_value: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                  min="0"
                  step="0.5"
                />
                <span className="text-slate-400 whitespace-nowrap">KES per point</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Minimum Points to Redeem</label>
              <input
                type="number"
                value={settings.minimum_points_to_redeem}
                onChange={(e) => onChange({ ...settings, minimum_points_to_redeem: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Signup Bonus Points</label>
              <input
                type="number"
                value={settings.signup_bonus_points}
                onChange={(e) => onChange({ ...settings, signup_bonus_points: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                min="0"
              />
            </div>
          </div>

          <div className="bg-slate-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-white mb-2">Current Setup Summary</h3>
            <p className="text-sm text-slate-400">
              Customers earn <span className="text-emerald-400">1 point</span> for every{' '}
              <span className="text-white">{settings.points_per_currency} KES</span> spent.
            </p>
            <p className="text-sm text-slate-400">
              Each <span className="text-emerald-400">point</span> is worth{' '}
              <span className="text-white">{settings.point_value} KES</span>.
            </p>
            <p className="text-sm text-slate-400">
              Minimum <span className="text-white">{settings.minimum_points_to_redeem} points</span> required to redeem.
            </p>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-700">
            <button
              onClick={onSave}
              disabled={saving}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Loyalty Settings
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ USER MODAL ============
function UserModal({
  user,
  currentUserId,
  onClose,
  onSaved,
}: {
  user: User | null;
  currentUserId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    full_name: user?.full_name || '',
    password: '',
    confirm_password: '',
    role_code: user?.role_code || 'cashier',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isEditing = !!user;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (isEditing) {
        // Update existing user
        if (formData.role_code !== user.role_code) {
          await updateUserRole(user.id, formData.role_code as any, currentUserId!);
        }

        // Handle password change for editing users
        if (formData.password) {
          if (formData.password !== formData.confirm_password) {
            setError('Passwords do not match');
            setSaving(false);
            return;
          }

          if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            setSaving(false);
            return;
          }

          // Reset password as admin
          const result = await resetUserPassword(user.id, formData.password, currentUserId!);
          if (!result.success) {
            setError(result.error || 'Failed to change password');
            setSaving(false);
            return;
          }
        }
      } else {
        // Create new user
        if (formData.password !== formData.confirm_password) {
          setError('Passwords do not match');
          setSaving(false);
          return;
        }

        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          setSaving(false);
          return;
        }

        const result = await createUser(
          formData.username,
          formData.email,
          formData.password,
          formData.full_name,
          formData.role_code as 'admin' | 'manager' | 'cashier',
          currentUserId!
        );

        if (!result.success) {
          setError(result.error || 'Failed to create user');
          setSaving(false);
          return;
        }
      }

      onSaved();
      onClose();
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 p-6 border-b border-slate-700">
          <h3 className="text-xl font-bold text-white">
            {isEditing ? 'Edit User' : 'Add New User'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Full Name</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
              required
              disabled={isEditing}
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
              required
              disabled={isEditing}
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
              required
              disabled={isEditing}
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Role</label>
            <select
              value={formData.role_code}
              onChange={(e) => setFormData({ ...formData, role_code: e.target.value })}
              className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
              required
            >
              <option value="cashier">Cashier</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Password {isEditing && <span className="text-xs text-slate-500">(leave blank to keep current)</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 pr-12 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                required={!isEditing}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.confirm_password}
              onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
              className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
              required={formData.password.length > 0}
              minLength={6}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create User'}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
}
