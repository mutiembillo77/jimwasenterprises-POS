import { useState, useEffect } from 'react';
import { AlertCircle, CreditCard, FileText } from 'lucide-react';
import { getAllCustomers } from '../../lib/db';
import type { Customer } from '../../lib/types';
import { useAuth } from '../../context/AuthContext';

export function LipaMdogoWorkflow() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const custs = await getAllCustomers();
      setCustomers(custs);
    } catch (err) {
      setError('Failed to load data');
    }
  };

  return (
    <div className="h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <CreditCard size={32} className="text-blue-400" />
          Lipa Mdogo (Pay Installment)
        </h1>
        <p className="text-slate-400 text-sm mt-2">Collect installment payments from customers</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
              <AlertCircle size={24} />
              {error}
            </div>
          )}

          {message && (
            <div className="p-4 bg-emerald-900/50 border border-emerald-700 rounded-lg text-emerald-300">
              {message}
            </div>
          )}

          {/* Feature Overview */}
          <div className="bg-slate-800 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText size={24} />
              Features
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700 rounded p-4">
                <h3 className="font-medium text-white mb-2">Track Installments</h3>
                <p className="text-sm text-slate-400">Monitor active payment plans and their status</p>
              </div>
              <div className="bg-slate-700 rounded p-4">
                <h3 className="font-medium text-white mb-2">Collect Payments</h3>
                <p className="text-sm text-slate-400">Record installment payments in real-time</p>
              </div>
              <div className="bg-slate-700 rounded p-4">
                <h3 className="font-medium text-white mb-2">Generate Receipts</h3>
                <p className="text-sm text-slate-400">Create payment receipts and tracking documents</p>
              </div>
              <div className="bg-slate-700 rounded p-4">
                <h3 className="font-medium text-white mb-2">Reports & Analytics</h3>
                <p className="text-sm text-slate-400">View payment history and outstanding amounts</p>
              </div>
            </div>
          </div>

          {/* Active Customers */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Customers with Installments</h2>
            <div className="space-y-2">
              {customers.length === 0 ? (
                <p className="text-slate-400">No customers found</p>
              ) : (
                customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="bg-slate-700 rounded p-4 flex justify-between items-center hover:bg-slate-600 transition cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-white">{customer.name}</p>
                      <p className="text-sm text-slate-400">{customer.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-400">{customer.loyalty_points} points</p>
                      <p className="text-sm text-slate-400">Total spent: {customer.total_spent.toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Implementation Notice */}
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6 text-center">
            <p className="text-blue-300">
              This workflow integrates with the Installments section for full management of payment plans.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
