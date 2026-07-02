// Receipt generation and printing utility for completed sales

const STORE_NAME = 'JIMWAS ENTERPRISES';
const STORE_TAGLINE = 'Point of Sale';

export interface ReceiptItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface ReceiptData {
  receiptNumber: string;
  createdAt: string;
  cashierName?: string;
  customerName?: string;
  saleType?: string | null;
  items: ReceiptItem[];
  totalAmount: number;
  amountPaid: number;
  changeAmount: number;
  paymentMethod: string;
  loyaltyPointsEarned?: number;
}

const money = (value: number) => `KES ${value.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const formatSaleType = (saleType?: string | null) => {
  if (!saleType) return '';
  if (saleType === 'lipa' || saleType === 'lipa_mdogo') return 'Lipa Mdogo Mdogo';
  return saleType.charAt(0).toUpperCase() + saleType.slice(1);
};

/**
 * Build the printable HTML for a receipt (58mm / 80mm thermal friendly).
 */
export function buildReceiptHtml(data: ReceiptData): string {
  const date = new Date(data.createdAt);
  const dateStr = date.toLocaleString('en-KE');
  const saleTypeLabel = formatSaleType(data.saleType);

  const itemRows = data.items
    .map(
      (item) => `
        <tr>
          <td class="name" colspan="2">${escapeHtml(item.product_name)}</td>
        </tr>
        <tr>
          <td class="qty">${item.quantity} x ${money(item.unit_price)}</td>
          <td class="amt">${money(item.subtotal)}</td>
        </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${escapeHtml(data.receiptNumber)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 8px;
      width: 280px;
      font-size: 12px;
      line-height: 1.4;
    }
    .center { text-align: center; }
    .store { font-size: 16px; font-weight: bold; letter-spacing: 1px; }
    .tagline { font-size: 11px; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 0; vertical-align: top; }
    .name { font-weight: bold; padding-top: 4px; }
    .qty { color: #000; }
    .amt { text-align: right; white-space: nowrap; }
    .row { display: flex; justify-content: space-between; }
    .total { font-size: 14px; font-weight: bold; }
    .meta { font-size: 11px; }
    .footer { font-size: 11px; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="center">
    <div class="store">${escapeHtml(STORE_NAME)}</div>
    <div class="tagline">${escapeHtml(STORE_TAGLINE)}</div>
  </div>
  <div class="divider"></div>
  <div class="meta">
    <div class="row"><span>Receipt:</span><span>${escapeHtml(data.receiptNumber)}</span></div>
    <div class="row"><span>Date:</span><span>${escapeHtml(dateStr)}</span></div>
    ${data.cashierName ? `<div class="row"><span>Cashier:</span><span>${escapeHtml(data.cashierName)}</span></div>` : ''}
    ${data.customerName ? `<div class="row"><span>Customer:</span><span>${escapeHtml(data.customerName)}</span></div>` : ''}
    ${saleTypeLabel ? `<div class="row"><span>Type:</span><span>${escapeHtml(saleTypeLabel)}</span></div>` : ''}
  </div>
  <div class="divider"></div>
  <table>${itemRows}</table>
  <div class="divider"></div>
  <div class="row total"><span>TOTAL</span><span>${money(data.totalAmount)}</span></div>
  <div class="row"><span>Paid (${escapeHtml(data.paymentMethod)})</span><span>${money(data.amountPaid)}</span></div>
  <div class="row"><span>Change</span><span>${money(data.changeAmount)}</span></div>
  ${
    data.loyaltyPointsEarned && data.loyaltyPointsEarned > 0
      ? `<div class="divider"></div><div class="row"><span>Loyalty earned</span><span>+${data.loyaltyPointsEarned} pts</span></div>`
      : ''
  }
  <div class="divider"></div>
  <div class="center footer">
    <div>Thank you for your business!</div>
    <div>Goods once sold are not returnable</div>
  </div>
  <script>
    window.onload = function () {
      window.focus();
      window.print();
      setTimeout(function () { window.close(); }, 300);
    };
  </script>
</body>
</html>`;
}

/**
 * Open a print window and print the receipt.
 */
export function printReceipt(data: ReceiptData): void {
  const html = buildReceiptHtml(data);
  const printWindow = window.open('', '_blank', 'width=320,height=600');

  if (!printWindow) {
    // Popup blocked — fall back to an iframe print.
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }
    setTimeout(() => document.body.removeChild(iframe), 2000);
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Build a sample receipt used to verify the printer is configured correctly.
 */
export function buildTestReceipt(): ReceiptData {
  return {
    receiptNumber: 'TEST-0000',
    createdAt: new Date().toISOString(),
    cashierName: 'Test Cashier',
    customerName: 'Test Customer',
    saleType: null,
    items: [
      { product_name: 'Test Item A', quantity: 2, unit_price: 150, subtotal: 300 },
      { product_name: 'Test Item B', quantity: 1, unit_price: 450, subtotal: 450 },
    ],
    totalAmount: 750,
    amountPaid: 1000,
    changeAmount: 250,
    paymentMethod: 'cash',
    loyaltyPointsEarned: 7,
  };
}

/**
 * Print a sample test receipt so users can confirm their printer works.
 */
export function printTestPage(): void {
  printReceipt(buildTestReceipt());
}
