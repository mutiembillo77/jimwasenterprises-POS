import { useState, useEffect, useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import {
  getAllInstallmentPlans,
  saveInstallmentPlan,
  getInstallmentPaymentsByPlan,
  saveInstallmentPayment,
  generateId,
} from '../lib/db';
import {
  syncInsertInstallmentPlan,
  syncUpdateInstallmentPlan,
  syncInsertInstallmentPayment,
} from '../lib/sync';
import type { InstallmentPlan, InstallmentPayment } from '../lib/types';

export function InstallmentsPage() {
  const [plans, setPlans] = useState<InstallmentPlan[]>([]);
  const [payments, setPayments] = useState<InstallmentPayment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [showPayment, setShowPayment] = useState<InstallmentPlan | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [plansData, paymentsData] = await Promise.all([
        getAllInstallmentPlans(),
        (async () => {
          const allPayments: InstallmentPayment[] = [];
          const allPlans = await getAllInstallmentPlans();
          for (const plan of allPlans) {
            const planPayments = await getInstallmentPaymentsByPlan(plan.id);
            allPayments.push(...planPayments);
          }
          return allPayments;
        })(),
      ]);
      setPlans(plansData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter plans by search
  const filteredPlans = useMemo(() => {
    return plans.filter(
      (plan) =>
        plan.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [plans, searchTerm]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: plans.length,
      active: plans.filter((p) => p.status === 'active').length,
      completed: plans.filter((p) => p.status === 'completed').length,
      totalAmount: plans.reduce((sum, p) => sum + p.total_amount, 0),
      totalCollected: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    };
  }, [plans, payments]);

  const handleCreatePlan = async (plan: InstallmentPlan) => {
    await saveInstallmentPlan(plan);
    syncInsertInstallmentPlan(plan);
    await loadData();
    setShowNewPlan(false);
  };

  const handleRecordPayment = async (planId: string, amount: number, method: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    const newAmountPaid = plan.amount_paid + amount;
    const isComplete = newAmountPaid >= plan.total_amount;

    const payment: InstallmentPayment = {
      id: generateId(),
      plan_id: planId,
      amount,
      payment_method: method as any,
      created_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    await saveInstallmentPayment(payment);
    syncInsertInstallmentPayment(payment);

    const updatedPlan: InstallmentPlan = {
      ...plan,
      amount_paid: newAmountPaid,
      status: isComplete ? 'completed' : 'active',
      product_released: isComplete,
      release_date: isComplete ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    await saveInstallmentPlan(updatedPlan);
    syncUpdateInstallmentPlan(updatedPlan);
    await loadData();
    setShowPayment(null);
  };

  const getProgress = (plan: InstallmentPlan) => {
    return Math.min(100, (plan.amount_paid / plan.total_amount) * 100);
  };

  const getRemainingAmount = (plan: InstallmentPlan) => {
    return Math.max(0, plan.total_amount - plan.amount_paid);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading installments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lipa Mdogo Mdogo</h1>
          <p className="text-sm text-gray-600">Manage installment plans</p>
        </div>
        <button
          onClick={() => setShowNewPlan(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Plan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Plans', value: stats.total, color: 'bg-blue-50 text-blue-600' },
          { label: 'Active', value: stats.active, color: 'bg-amber-50 text-amber-600' },
          { label: 'Completed', value: stats.completed, color: 'bg-green-50 text-green-600' },
          {
            label: 'Collection Rate',
            value:
              stats.totalAmount > 0
                ? `${Math.round((stats.totalCollected / stats.totalAmount) * 100)}%`
                : '0%',
            color: 'bg-purple-50 text-purple-600',
          },
        ].map((stat, i) => (
          <div
            key={i}
            className={`rounded-lg p-4 border border-gray-200 ${stat.color}`}
          >
            <p className="text-sm font-medium opacity-75">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search plans..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Plans Grid */}
      {filteredPlans.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            {searchTerm ? 'No plans found' : 'No installment plans yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPlans.map((plan) => {
            const progress = getProgress(plan);
            const remaining = getRemainingAmount(plan);
            const planPayments = payments.filter((p) => p.plan_id === plan.id);

            return (
              <div
                key={plan.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{plan.product_name}</h3>
                    {plan.notes && <p className="text-sm text-gray-600 mt-1">{plan.notes}</p>}
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      plan.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {plan.status}
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total</p>
                    <p className="font-semibold text-gray-900">
                      Ksh {plan.total_amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Paid</p>
                    <p className="font-semibold text-green-600">
                      Ksh {plan.amount_paid.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Remaining</p>
                    <p className="font-semibold text-orange-600">Ksh {remaining.toLocaleString()}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 bg-blue-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {progress.toFixed(0)}% • {planPayments.length} payments
                  </p>
                </div>

                {/* Actions */}
                {plan.status === 'active' && (
                  <button
                    onClick={() => setShowPayment(plan)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
                  >
                    Record Payment
                  </button>
                )}
                {plan.status === 'completed' && (
                  <div className="w-full bg-green-50 text-green-700 text-center font-medium py-2 rounded-lg">
                    Fully Paid
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <PaymentRecordModal
          plan={showPayment}
          onClose={() => setShowPayment(null)}
          onSubmit={handleRecordPayment}
        />
      )}

      {/* New Plan Modal */}
      {showNewPlan && (
        <NewPlanModal onClose={() => setShowNewPlan(false)} onSubmit={handleCreatePlan} />
      )}
    </div>
  );
}

// Payment Recording Modal
function PaymentRecordModal({
  plan,
  onClose,
  onSubmit,
}: {
  plan: InstallmentPlan;
  onClose: () => void;
  onSubmit: (planId: string, amount: number, method: string) => void;
}) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const remaining = plan.total_amount - plan.amount_paid;

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0 || parsedAmount > remaining) return;
    onSubmit(plan.id, parsedAmount, method);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">{plan.product_name}</h2>

        <div className="bg-gray-50 rounded p-3 mb-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span>Total Amount:</span>
            <span className="font-medium">Ksh {plan.total_amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Already Paid:</span>
            <span className="font-medium text-green-600">Ksh {plan.amount_paid.toLocaleString()}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Outstanding:</span>
            <span className="text-orange-600">Ksh {remaining.toLocaleString()}</span>
          </div>
        </div>

        <input
          type="number"
          placeholder="Amount (Ksh)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          max={remaining}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="grid grid-cols-3 gap-2 mb-4">
          {(['cash', 'card', 'mobile'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`py-2 rounded font-medium transition ${
                method === m
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > remaining}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
          >
            Record Payment
          </button>
        </div>
      </div>
    </div>
  );
}

// New Plan Modal
function NewPlanModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (plan: InstallmentPlan) => void;
}) {
  const [productName, setProductName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!productName || !totalAmount) return;

    const plan: InstallmentPlan = {
      id: generateId(),
      customer_id: 'general',
      product_id: 'general',
      product_name: productName,
      total_amount: parseFloat(totalAmount),
      amount_paid: 0,
      installment_count: 1,
      status: 'active',
      product_released: false,
      notes: notes || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    onSubmit(plan);
    setProductName('');
    setTotalAmount('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">New Installment Plan</h2>

        <input
          type="text"
          placeholder="Product Name"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="number"
          placeholder="Total Amount (Ksh)"
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!productName || !totalAmount}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
          >
            Create Plan
          </button>
        </div>
      </div>
    </div>
  );
}
