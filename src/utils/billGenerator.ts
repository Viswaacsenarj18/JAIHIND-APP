import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Order } from '../context/OrderContext';

export const generateBillPDF = async (order: Order) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - ${order.id.slice(-6)}</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        .invoice-box {
            max-width: 800px;
            margin: auto;
            padding: 30px;
            border: 1px solid #eee;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
            font-size: 16px;
            line-height: 24px;
            background: #fff;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #E11D48;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #E11D48;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .invoice-title {
            text-align: right;
        }
        .invoice-title h1 {
            margin: 0;
            color: #E11D48;
            font-size: 28px;
        }
        .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .info-box h3 {
            margin: 0 0 10px 0;
            color: #E11D48;
            font-size: 14px;
            text-transform: uppercase;
        }
        .info-box p {
            margin: 0;
            font-size: 14px;
            line-height: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        th {
            background: #F9FAFB;
            color: #6B7280;
            font-weight: bold;
            text-align: left;
            padding: 12px;
            border-bottom: 2px solid #E5E7EB;
            font-size: 12px;
            text-transform: uppercase;
        }
        td {
            padding: 12px;
            border-bottom: 1px solid #E5E7EB;
            font-size: 14px;
        }
        .text-right {
            text-align: right;
        }
        .totals {
            width: 250px;
            margin-left: auto;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
        }
        .total-row.grand-total {
            border-top: 2px solid #E11D48;
            margin-top: 10px;
            padding-top: 10px;
            font-weight: bold;
            font-size: 18px;
            color: #E11D48;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #9CA3AF;
            border-top: 1px solid #E5E7EB;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="invoice-box">
        <div class="header">
            <div class="logo">Jaihind Sports</div>
            <div class="invoice-title">
                <h1>INVOICE</h1>
                <p>#${order.id.slice(-6).toUpperCase()}</p>
            </div>
        </div>

        <div class="info-section">
            <div class="info-box">
                <h3>Billed To:</h3>
                <p><strong>${order.name}</strong></p>
                <p>${order.address}</p>
                <p>Phone: ${order.phone}</p>
            </div>
            <div class="info-box text-right">
                <h3>Order Details:</h3>
                <p>Date: ${order.date}</p>
                <p>Status: ${order.status.toUpperCase()}</p>
                <p>Payment: ${order.paymentStatus.toUpperCase()}</p>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th class="text-right">Price</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${order.items.map(item => `
                    <tr>
                        <td>${item.name || (item as any).product?.name}</td>
                        <td class="text-right">₹${(item.price || (item as any).product?.price).toLocaleString('en-IN')}</td>
                        <td class="text-right">${item.quantity}</td>
                        <td class="text-right">₹${((item.price || (item as any).product?.price) * item.quantity).toLocaleString('en-IN')}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="totals">
            <div class="total-row">
                <span>Subtotal:</span>
                <span>₹${order.total >= 1000 ? order.total.toLocaleString('en-IN') : (order.total - 49).toLocaleString('en-IN')}</span>
            </div>
            <div class="total-row">
                <span>Delivery:</span>
                <span>${order.total >= 1000 ? 'FREE' : '₹49'}</span>
            </div>
            <div class="total-row grand-total">
                <span>Grand Total:</span>
                <span>₹${order.total.toLocaleString('en-IN')}</span>
            </div>
        </div>

        <div class="footer">
            <p>Thank you for shopping with Jaihind Sports!</p>
            <p>This is a computer generated invoice and does not require a signature.</p>
        </div>
    </div>
</body>
</html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    console.log('PDF generated at:', uri);
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
