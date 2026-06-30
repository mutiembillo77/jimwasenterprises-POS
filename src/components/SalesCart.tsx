import { Trash2, Plus, Minus } from 'lucide-react';
import { CartItem } from '../lib/services/SalesService';

interface SalesCartProps {
  items: CartItem[];
  discount: number;
  taxAmount: number;
  totalAmount: number;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onApplyDiscount?: (amount: number, reason: string) => void;
  saleType: string;
  showTax: boolean;
}

export function SalesCart({
  items,
  discount,
  taxAmount,
  totalAmount,
  onUpdateQuantity,
  onRemoveItem,
  saleType,
  showTax,
}: SalesCartProps) {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="bg-slate-800 rounded-lg p-4 space-y-4">
      {/* Cart Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">Cart</h3>
        <span className="text-sm text-slate-400">{items.length} items</span>
      </div>

      {/* Cart Items */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-8 text-slate-400">Cart is empty</div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-slate-700 rounded p-3 flex justify-between items-start hover:bg-slate-600 transition"
            >
              <div className="flex-1">
                <p className="text-white font-medium text-sm truncate">{item.product_name}</p>
                <p className="text-slate-400 text-xs">
                  {item.unit_price.toLocaleString()} × {item.quantity} = {item.subtotal.toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                  className="p-1 hover:bg-slate-500 rounded text-slate-300 hover:text-white"
                >
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-white text-xs font-medium">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="p-1 hover:bg-slate-500 rounded text-slate-300 hover:text-white"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1 hover:bg-red-900 rounded text-red-400 hover:text-red-300 ml-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      {items.length > 0 && (
        <div className="border-t border-slate-600 pt-4 space-y-2">
          <div className="flex justify-between text-slate-300 text-sm">
            <span>Subtotal:</span>
            <span>{subtotal.toLocaleString()}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-amber-400 text-sm">
              <span>Discount:</span>
              <span>-{discount.toLocaleString()}</span>
            </div>
          )}

          {showTax && taxAmount > 0 && (
            <div className="flex justify-between text-slate-300 text-sm">
              <span>Tax (16%):</span>
              <span>{taxAmount.toLocaleString()}</span>
            </div>
          )}

          <div className="flex justify-between text-white font-bold text-lg border-t border-slate-600 pt-2">
            <span>Total:</span>
            <span className="text-emerald-400">{totalAmount.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
