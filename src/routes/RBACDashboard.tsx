import { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2, AlertCircle, Check, Lock } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'sales.create', label: 'Create Sales', category: 'Sales' },
  { id: 'sales.view', label: 'View Sales', category: 'Sales' },
  { id: 'sales.edit', label: 'Edit Sales', category: 'Sales' },
  { id: 'sales.delete', label: 'Delete Sales', category: 'Sales' },
  { id: 'inventory.view', label: 'View Inventory', category: 'Inventory' },
  { id: 'inventory.edit', label: 'Edit Inventory', category: 'Inventory' },
  { id: 'inventory.reorder', label: 'Reorder Stock', category: 'Inventory' },
  { id: 'reports.view', label: 'View Reports', category: 'Reports' },
  { id: 'reports.export', label: 'Export Reports', category: 'Reports' },
  { id: 'users.manage', label: 'Manage Users', category: 'Users' },
  { id: 'users.assign_roles', label: 'Assign Roles', category: 'Users' },
  { id: 'shifts.create', label: 'Create Shifts', category: 'Operations' },
  { id: 'shifts.close', label: 'Close Shifts', category: 'Operations' },
  { id: 'cash_drawer.manage', label: 'Manage Cash Drawer', category: 'Operations' },
  { id: 'approvals.approve', label: 'Approve Sales', category: 'Approvals' },
  { id: 'admin.settings', label: 'System Settings', category: 'Admin' },
];

const DEFAULT_ROLES: Role[] = [
  {
    id: 'cashier',
    name: 'Cashier',
    description: 'Standard point-of-sale operator',
    permissions: ['sales.create', 'sales.view', 'inventory.view', 'shifts.create'],
    userCount: 5,
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Store manager with reporting and approval rights',
    permissions: [
      'sales.create',
      'sales.view',
      'sales.edit',
      'inventory.view',
      'inventory.edit',
      'reports.view',
      'reports.export',
      'shifts.create',
      'shifts.close',
      'cash_drawer.manage',
      'approvals.approve',
    ],
    userCount: 2,
  },
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access',
    permissions: [
      'sales.create',
      'sales.view',
      'sales.edit',
      'sales.delete',
      'inventory.view',
      'inventory.edit',
      'inventory.reorder',
      'reports.view',
      'reports.export',
      'users.manage',
      'users.assign_roles',
      'shifts.create',
      'shifts.close',
      'cash_drawer.manage',
      'approvals.approve',
      'admin.settings',
    ],
    userCount: 1,
  },
];

const MOCK_USERS: User[] = [
  {
    id: 'user1',
    name: 'John Doe',
    email: 'john@jimwas.com',
    role: 'cashier',
    status: 'active',
    lastLogin: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'user2',
    name: 'Jane Smith',
    email: 'jane@jimwas.com',
    role: 'manager',
    status: 'active',
    lastLogin: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'user3',
    name: 'Admin User',
    email: 'admin@jimwas.com',
    role: 'admin',
    status: 'active',
    lastLogin: new Date(Date.now() - 600000).toISOString(),
  },
];

export function RBACDashboard() {
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddRole = () => {
    setSelectedRole(null);
    setRoleName('');
    setRoleDescription('');
    setSelectedPermissions([]);
    setShowRoleForm(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description);
    setSelectedPermissions(role.permissions);
    setShowRoleForm(true);
  };

  const handleSaveRole = () => {
    if (!roleName || !roleDescription) {
      setError('Please fill in all fields');
      return;
    }

    if (selectedRole) {
      // Update role
      const updated = roles.map((r) =>
        r.id === selectedRole.id
          ? {
              ...r,
              name: roleName,
              description: roleDescription,
              permissions: selectedPermissions,
            }
          : r
      );
      setRoles(updated);
      setSuccess('Role updated successfully');
    } else {
      // Create new role
      const newRole: Role = {
        id: `role-${Date.now()}`,
        name: roleName,
        description: roleDescription,
        permissions: selectedPermissions,
        userCount: 0,
      };
      setRoles([...roles, newRole]);
      setSuccess('Role created successfully');
    }

    setTimeout(() => setSuccess(''), 2000);
    setShowRoleForm(false);
  };

  const groupedPermissions = AVAILABLE_PERMISSIONS.reduce(
    (acc, perm) => {
      if (!acc[perm.category]) acc[perm.category] = [];
      acc[perm.category].push(perm);
      return acc;
    },
    {} as Record<string, typeof AVAILABLE_PERMISSIONS>
  );

  return (
    <div className="h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Shield size={32} className="text-red-400" />
          Access Control & Permissions
        </h1>
        <p className="text-slate-400 text-sm mt-2">Manage roles, users, and permissions</p>
      </div>

      {/* Tabs */}
      <div className="bg-slate-800 border-b border-slate-700 px-6">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-4 px-2 font-medium border-b-2 transition ${
              activeTab === 'roles'
                ? 'border-red-500 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Roles ({roles.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-2 font-medium border-b-2 transition ${
              activeTab === 'users'
                ? 'border-red-500 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Users ({users.length})
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
              <AlertCircle size={24} />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-4 bg-emerald-900/50 border border-emerald-700 rounded-lg text-emerald-300">
              <Check size={24} />
              {success}
            </div>
          )}

          {/* Roles Tab */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">System Roles</h2>
                <button
                  onClick={handleAddRole}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                >
                  <Plus size={20} />
                  Add Role
                </button>
              </div>

              {showRoleForm && (
                <div className="bg-slate-800 rounded-lg p-6 border border-red-700">
                  <h3 className="text-xl font-bold text-white mb-4">
                    {selectedRole ? 'Edit Role' : 'Create Role'}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Role Name</label>
                      <input
                        type="text"
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Description</label>
                      <textarea
                        value={roleDescription}
                        onChange={(e) => setRoleDescription(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none resize-none"
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-slate-400 mb-3">Permissions</label>
                      <div className="space-y-3">
                        {Object.entries(groupedPermissions).map(([category, perms]) => (
                          <div key={category}>
                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">{category}</p>
                            <div className="grid grid-cols-2 gap-2 ml-2">
                              {perms.map((perm) => (
                                <label
                                  key={perm.id}
                                  className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedPermissions.includes(perm.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedPermissions([...selectedPermissions, perm.id]);
                                      } else {
                                        setSelectedPermissions(selectedPermissions.filter((p) => p !== perm.id));
                                      }
                                    }}
                                    className="w-4 h-4 rounded border-slate-600 accent-red-500"
                                  />
                                  {perm.label}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setShowRoleForm(false)}
                        className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveRole}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        {selectedRole ? 'Update Role' : 'Create Role'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {roles.map((role) => (
                  <div key={role.id} className="bg-slate-800 rounded-lg p-6 border-l-4 border-red-500">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">{role.name}</h3>
                        <p className="text-sm text-slate-400">{role.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditRole(role)}
                          className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white"
                        >
                          <Edit2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-700">
                      <div className="flex flex-wrap gap-2">
                        {role.permissions.slice(0, 5).map((perm) => (
                          <span key={perm} className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                            {perm.split('.')[1]}
                          </span>
                        ))}
                        {role.permissions.length > 5 && (
                          <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-400">
                            +{role.permissions.length - 5} more
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">{role.userCount} users</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">System Users</h2>

              <div className="bg-slate-800 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-700 border-b border-slate-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Role</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Last Login</th>
                      <th className="px-6 py-3 text-center text-sm font-medium text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-700/50 transition">
                        <td className="px-6 py-4 text-white font-medium">{user.name}</td>
                        <td className="px-6 py-4 text-slate-400">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-sm capitalize">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded text-sm font-medium ${
                              user.status === 'active'
                                ? 'bg-emerald-900/30 text-emerald-400'
                                : 'bg-red-900/30 text-red-400'
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-sm">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button className="inline-flex items-center gap-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded transition">
                            <Lock size={16} />
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
