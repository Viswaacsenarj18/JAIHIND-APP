import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Order } from '../context/OrderContext';
import { LOGO_BASE64, SIGNATURE_BASE64 } from '../assets/base64Assets';

// --- Helper: Convert Number to Words (Indian Numbering System) ---
const numberToWords = (num: number): string => {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const convert = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + convert(n % 10000000) : "");
  };

  if (num === 0) return "Zero Rupees";
  const str = convert(Math.floor(num));
  return str + " Rupees only";
};

const generateBillHTML = (order: Order): string => {
  const invoiceDate = order.date || new Date().toLocaleDateString("en-IN");
  const invoiceNo = `${order.id.slice(-6).toUpperCase()}`;
  const totalQty = order.items.reduce((s, i) => s + (i.quantity || 0), 0);
  const grandTotal = order.total || 0;
  
  // Subtotal calculations (accounting for simulated shipping logic)
  const subTotal = grandTotal >= 1000 ? grandTotal : grandTotal - 49;
  const shippingCharge = grandTotal >= 1000 ? "FREE" : "₹49.00";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tax Invoice - ${invoiceNo}</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #000;
            margin: 0;
            padding: 10px;
            background-color: #fff;
        }
        .invoice-container {
            border: 1.5px solid #000;
            padding: 0;
            max-width: 800px;
            margin: auto;
            background: #fff;
            box-sizing: border-box;
        }
        
        /* 1. Logo & Company Details Header */
        .company-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1.5px solid #000;
            padding: 12px 18px;
            box-sizing: border-box;
        }
        .logo-box {
            width: 170px;
            display: flex;
            align-items: center;
        }
        .logo-img {
            max-width: 100%;
            height: auto;
            max-height: 80px;
        }
        .company-info {
            text-align: right;
            font-size: 12px;
            line-height: 1.35;
        }
        .company-info h2 {
            margin: 0 0 4px 0;
            color: #000;
            font-size: 20px;
            font-weight: 800;
            letter-spacing: 0.5px;
        }
        .company-info p {
            margin: 1px 0;
        }
        .company-email {
            margin-top: 3px !important;
        }

        /* 2. Billing Grid (Bill To & Invoice Details) */
        .billing-grid {
            display: flex;
            border-bottom: 1.5px solid #000;
            box-sizing: border-box;
        }
        .billing-col {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        .bill-to {
            border-right: 1.5px solid #000;
        }
        .block-title {
            background-color: #f3f4f6;
            font-weight: bold;
            font-size: 11px;
            padding: 5px 12px;
            border-bottom: 1.5px solid #000;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .block-body {
            padding: 8px 12px;
            font-size: 12px;
            line-height: 1.4;
        }
        .block-body h3 {
            margin: 0 0 4px 0;
            font-size: 14px;
            font-weight: 700;
        }
        .block-body p {
            margin: 1px 0;
        }

        /* 3. Items Table styling */
        table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 1.5px solid #000;
            box-sizing: border-box;
        }
        th {
            background-color: #f3f4f6;
            border-bottom: 1.5px solid #000;
            border-right: 1px solid #000;
            padding: 7px;
            font-size: 10px;
            font-weight: bold;
            text-align: left;
            text-transform: uppercase;
        }
        th:last-child {
            border-right: none;
        }
        td {
            border-bottom: 1px solid #e5e7eb;
            border-right: 1px solid #000;
            padding: 7px;
            font-size: 11px;
            vertical-align: middle;
        }
        td:last-child {
            border-right: none;
        }
        .table-total-row td {
            background-color: #f9fafb;
            border-top: 1.5px solid #000;
            border-bottom: 1.5px solid #000;
            font-weight: bold;
        }

        /* 4. Bottom Summary and Sign section */
        .summary-and-sign {
            display: flex;
            border-bottom: none;
            box-sizing: border-box;
        }
        .left-box {
            flex: 1.1;
            border-right: 1.5px solid #000;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 12px;
            box-sizing: border-box;
        }
        .right-box {
            flex: 1;
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
        }
        .calc-table {
            border-bottom: 1.5px solid #000;
            padding: 8px 12px;
            box-sizing: border-box;
        }
        .calc-row {
            display: flex;
            justify-content: space-between;
            font-size: 11.5px;
            padding: 3px 0;
        }
        .grand-total-row {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 5px 0;
            margin: 3px 0;
            font-size: 12px;
        }
        .words-row {
            flex-direction: column;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            padding: 5px;
            margin: 5px 0;
            border-radius: 3px;
        }
        .words-title {
            font-size: 9px;
            color: #6b7280;
            font-weight: bold;
            text-transform: uppercase;
        }
        .words-val {
            font-size: 10px;
            font-weight: bold;
            margin-top: 1px;
        }
        .balance-row {
            color: #E11D48;
            font-size: 12px;
            border-top: 1px solid #000;
            padding-top: 4px;
            margin-top: 3px;
        }
        .terms-box {
            border: 1px solid #e5e7eb;
            border-radius: 3px;
            padding: 6px;
            background: #f9fafb;
        }
        .terms-title {
            font-size: 10px;
            font-weight: bold;
            color: #000;
            margin-bottom: 3px;
            text-transform: uppercase;
        }
        .terms-body {
            font-size: 10px;
            color: #4b5563;
        }
        .sign-container {
            padding: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            box-sizing: border-box;
        }
        .sign-title {
            font-size: 10px;
            font-weight: bold;
            align-self: flex-start;
            margin-bottom: 4px;
        }
        .sign-img-box {
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 4px 0;
        }
        .sign-img {
            height: 100%;
            max-width: 140px;
            object-fit: contain;
        }
        .sign-label {
            font-size: 9.5px;
            font-weight: bold;
            text-transform: uppercase;
            border-top: 1px solid #000;
            padding-top: 3px;
            width: 80%;
            margin-top: 3px;
        }

        /* 5. Title Bar Overlay */
        .invoice-title-main {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
            color: #000;
        }

        /* 6. Mobile Responsiveness */
        @media only screen and (max-width: 850px) {
            body {
                padding: 4px;
            }
            .company-header {
                flex-direction: column;
                align-items: center;
                text-align: center;
                gap: 8px;
                padding: 10px;
            }
            .company-info {
                text-align: center;
            }
            .billing-grid {
                flex-direction: column;
            }
            .bill-to {
                border-right: none;
                border-bottom: 1.5px solid #000;
            }
            .summary-and-sign {
                flex-direction: column;
            }
            .left-box {
                border-right: none;
                border-bottom: 1.5px solid #000;
                padding: 10px;
            }
            .right-box {
                width: 100%;
            }
            th, td {
                padding: 5px;
                font-size: 9.5px;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-title-main">Tax Invoice</div>
    <div class="invoice-container">
        
        <!-- 1. Company Header Row -->
        <div class="company-header">
            <div class="logo-box">
                <img src="${LOGO_BASE64}" alt="Logo" class="logo-img" />
            </div>
            <div class="company-info">
                <h2>JAIHIND SPORTS</h2>
                <p>Mettupalayam -TRICHY</p>
                <p>Phone: <strong>8637450696</strong></p>
                <p>State: <strong>33-Tamil Nadu</strong></p>
                <p class="company-email">Email: <strong>sethupathi51469@gmail.com</strong></p>
            </div>
        </div>

        <!-- 2. Billing Grid -->
        <div class="billing-grid">
            <div class="billing-col bill-to">
                <div class="block-title">Bill To:</div>
                <div class="block-body">
                    <h3><strong>${order.name.toUpperCase()}</strong></h3>
                    <p>Contact No: <strong>${order.phone}</strong></p>
                    ${order.address ? `<p>Address: <strong>${order.address}</strong></p>` : ''}
                </div>
            </div>
            <div class="billing-col invoice-details">
                <div class="block-title">Invoice Details:</div>
                <div class="block-body">
                    <p>No: <strong>${invoiceNo}</strong></p>
                    <p>Date: <strong>${invoiceDate}</strong></p>
                </div>
            </div>
        </div>

        <!-- 3. Items Table -->
        <table>
            <thead>
                <tr>
                    <th style="width: 5%; text-align: center;">#</th>
                    <th style="width: 45%;">Item Name</th>
                    <th style="width: 12%; text-align: center;">HSN/ SAC</th>
                    <th style="width: 8%; text-align: center;">Qty</th>
                    <th style="width: 8%; text-align: center;">Unit</th>
                    <th style="width: 11%; text-align: right;">Price/ Unit (₹)</th>
                    <th style="width: 11%; text-align: right;">Amount(₹)</th>
                </tr>
            </thead>
            <tbody>
                ${order.items.map((item: any, idx) => {
                    const name = item.name || item.product?.name || 'Product';
                    const price = typeof item.price === 'number' ? item.price : (item.product?.price || 0);
                    const quantity = item.quantity || 0;
                    const amount = price * quantity;
                    return `
                        <tr>
                            <td style="text-align: center;">${idx + 1}</td>
                            <td><strong>${name}</strong></td>
                            <td style="text-align: center; color: #6b7280;">-</td>
                            <td style="text-align: center;">${quantity}</td>
                            <td style="text-align: center; color: #6b7280;">Nos</td>
                            <td style="text-align: right;">₹${price.toFixed(2)}</td>
                            <td style="text-align: right;">₹${amount.toFixed(2)}</td>
                        </tr>
                    `;
                }).join('')}
                <tr class="table-total-row">
                    <td style="text-align: center;">Total</td>
                    <td></td>
                    <td></td>
                    <td style="text-align: center;">${totalQty}</td>
                    <td></td>
                    <td></td>
                    <td style="text-align: right;">₹${subTotal.toFixed(2)}</td>
                </tr>
            </tbody>
        </table>

        <!-- 4. Summary & Sign Row -->
        <div class="summary-and-sign">
            <div class="left-box">
                <div style="flex-grow: 1;"></div>
                <div class="terms-box">
                    <div class="terms-title">Terms And Conditions:</div>
                    <div class="terms-body">Thank you for doing business with us.</div>
                </div>
            </div>
            
            <div class="right-box">
                <div class="calc-table">
                    <div class="calc-row">
                        <span>Sub Total</span>
                        <span>₹${subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div class="calc-row">
                        <span>Delivery Charges</span>
                        <span>${shippingCharge}</span>
                    </div>
                    <div class="calc-row grand-total-row">
                        <span><strong>Total</strong></span>
                        <span><strong>₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                    </div>
                    
                    <div class="calc-row words-row">
                        <div class="words-title">Invoice Amount In Words :</div>
                        <div class="words-val">${numberToWords(grandTotal)}</div>
                    </div>
                    
                    <div class="calc-row">
                        <span>Received</span>
                        <span>₹0.00</span>
                    </div>
                    <div class="calc-row balance-row">
                        <span><strong>Balance</strong></span>
                        <span><strong>₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                    </div>
                </div>
                
                <div class="sign-container">
                    <div class="sign-title">For JAIHIND SPORTS:</div>
                    <div class="sign-img-box">
                        <img src="${SIGNATURE_BASE64}" alt="Signature" class="sign-img" />
                    </div>
                    <div class="sign-label">Authorized Signatory</div>
                </div>
            </div>
        </div>

    </div>
</body>
</html>
  `;

  return html;
};

// 1. Direct local download via Native OS PDF printer dialogue
export const downloadBillPDF = async (order: Order) => {
  try {
    const html = generateBillHTML(order);
    await Print.printAsync({ html });
    console.log('PDF print/download dialogue opened successfully');
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
};

// 2. Share PDF document to external apps (WhatsApp, Email, etc.)
export const shareBillPDF = async (order: Order) => {
  try {
    const html = generateBillHTML(order);
    const { uri } = await Print.printToFileAsync({ html });
    console.log('PDF generated for sharing at:', uri);
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('Error sharing PDF:', error);
    throw error;
  }
};
