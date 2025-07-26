import React from 'react';
import { Order } from '@/types';
import { formatPrice } from '@/utils/cart';

interface InvoiceProps {
  order: Order;
  invoiceNumber: string;
}

const Invoice = ({ order, invoiceNumber }: InvoiceProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 shadow-lg print-container" id="invoice-content">
      {/* Print-specific styles */}
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 8mm;
            }
            body {
              margin: 0;
              padding: 0;
              font-size: 10px;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              line-height: 1.2;
              background-color: white !important;
              color: black !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            .print-container {
              width: 100%;
              max-width: 100%;
              padding: 0;
              margin: 0;
              box-shadow: none;
              background-color: white !important;
              color: black !important;
              font-size: 10px;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            .page-break-avoid {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            table {
              page-break-inside: avoid;
              break-inside: avoid;
              font-size: 9px;
              width: 100% !important;
              table-layout: fixed;
            }
            tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .invoice-header {
              margin-bottom: 8px;
              height: auto;
            }
            .invoice-section {
              margin-bottom: 6px;
            }
            .invoice-table {
              font-size: 8px;
            }
            .invoice-footer {
              margin-top: 8px;
              font-size: 8px;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              background-color: transparent !important;
            }
            img {
              max-width: 100% !important;
              height: auto !important;
              display: block !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              opacity: 1 !important;
              visibility: visible !important;
            }
            .logo-container {
              width: 40px !important;
              height: 40px !important;
              max-width: 40px !important;
              max-height: 40px !important;
            }
            .logo-container img {
              width: 40px !important;
              height: 40px !important;
              max-width: 40px !important;
              max-height: 40px !important;
              object-fit: contain !important;
            }
            .header-section {
              display: flex !important;
              align-items: center !important;
              margin-bottom: 8px !important;
            }
            .company-info {
              margin-left: 8px !important;
            }
            .company-info h1 {
              font-size: 14px !important;
              margin: 0 !important;
              line-height: 1.2 !important;
            }
            .company-info p {
              font-size: 9px !important;
              margin: 0 !important;
            }
            .invoice-title {
              font-size: 16px !important;
              margin: 0 !important;
            }
            .grid-cols-2 {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 8px !important;
            }
            .info-card {
              padding: 6px !important;
              margin-bottom: 6px !important;
              border: 1px solid #e5e7eb !important;
              border-radius: 4px !important;
              background-color: #f9fafb !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .info-card h3 {
              font-size: 10px !important;
              margin-bottom: 4px !important;
              font-weight: 600 !important;
            }
            .info-card .space-y-1 > * + * {
              margin-top: 2px !important;
            }
            .contact-info {
              font-size: 8px !important;
              margin-bottom: 6px !important;
              padding-bottom: 4px !important;
              border-bottom: 1px solid #e5e7eb !important;
            }
          }
        `}
      </style>

      {/* Header with Logo and Title */}
      <div className="flex justify-between items-center border-b-2 border-gray-200 pb-2 mb-3 page-break-avoid invoice-header">
        <div className="flex items-center space-x-3 header-section">
          <div className="logo-container w-10 h-10 rounded-full overflow-hidden">
            <img 
              src="/logo.png" 
              alt="Injapan Food Logo" 
              className="w-full h-full object-contain bg-white p-0.5 logo-image"
              style={{ 
                maxWidth: '100%', 
                height: 'auto',
                display: 'block',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
                colorAdjust: 'exact',
                opacity: 1,
                visibility: 'visible'
              }}
            />
          </div>
          <div className="company-info">
            <h1 className="text-lg font-bold text-gray-900">Injapan Food</h1>
            <p className="text-xs text-gray-600">Makanan Indonesia di Jepang</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-red-600 invoice-title">INVOICE</h2>
        </div>
      </div>

      {/* Contact Information */}
      <div className="flex justify-between text-xs text-gray-600 mb-3 border-b pb-2 invoice-section contact-info">
        <div className="flex items-center space-x-2">
          <span>📱 WhatsApp: +817084894699</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>📧 info@injapanfood.com</span>
        </div>
      </div>

      {/* Invoice and Customer Info */}
      <div className="grid grid-cols-2 gap-3 mb-3 page-break-avoid invoice-section">
        <div className="bg-gray-50 p-2 rounded-lg info-card">
          <h3 className="text-base font-semibold text-gray-900 mb-2">Informasi Invoice</h3>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="font-medium">No. Invoice:</span>
              <span className="text-red-600 font-bold">{invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Tanggal:</span>
              <span>{formatDate(order.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {order.status === 'pending' ? 'Menunggu Konfirmasi' :
                 order.status === 'confirmed' ? 'Dikonfirmasi' :
                 order.status === 'completed' ? 'Selesai' :
                 order.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Metode Pembayaran:</span>
              <span>{order.customer_info.payment_method || 'COD'}</span>
            </div>
            {order.payment_status && (
              <div className="flex justify-between">
                <span className="font-medium">Status Pembayaran:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.payment_status === 'verified' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {order.payment_status === 'pending' ? 'Menunggu Verifikasi' :
                   order.payment_status === 'verified' ? 'Terverifikasi' :
                   'Ditolak'}
                </span>
              </div>
            )}
            {order.affiliate_id && (
              <div className="flex justify-between">
                <span className="font-medium">Kode Referral:</span>
                <span className="font-mono">{order.affiliate_id}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-2 rounded-lg info-card">
          <h3 className="text-base font-semibold text-gray-900 mb-2">Informasi Penerima</h3>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="font-medium">Nama:</span>
              <span>{order.customer_info.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Email:</span>
              <span>{order.customer_info.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">No. WhatsApp:</span>
              <span>{order.customer_info.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Alamat:</span>
              <span className="text-right">
                {order.customer_info.address}
                {order.customer_info.prefecture && (
                  <>, {order.customer_info.prefecture}</>
                )}
                {order.customer_info.postal_code && (
                  <>, 〒{order.customer_info.postal_code}</>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-3 page-break-avoid invoice-section">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Detail Pesanan</h3>
        <table className="w-full border-collapse invoice-table" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">No.</th>
              <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">Produk</th>
              <th className="border border-gray-300 px-2 py-1 text-center font-semibold text-xs">Qty</th>
              <th className="border border-gray-300 px-2 py-1 text-right font-semibold text-xs">Harga Satuan</th>
              <th className="border border-gray-300 px-2 py-1 text-right font-semibold text-xs">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-2 py-1 text-center text-xs">{index + 1}</td>
                <td className="border border-gray-300 px-2 py-1 text-xs">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                      <div className="text-xs text-gray-600">
                        {Object.entries(item.selectedVariants).map(([type, value]) => `${type}: ${value}`).join(', ')}
                      </div>
                    )}
                  </div>
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center text-xs">{item.quantity}</td>
                <td className="border border-gray-300 px-2 py-1 text-right text-xs">{formatPrice(item.price)}</td>
                <td className="border border-gray-300 px-2 py-1 text-right font-medium text-xs">
                  {formatPrice(item.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total Section */}
      <div className="flex justify-end mb-3 page-break-avoid invoice-section">
        <div className="w-48">
          <div className="bg-gray-50 p-3 rounded-lg border">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="font-medium">Subtotal:</span>
                <span>{formatPrice(order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0))}</span>
              </div>
              <div className="flex justify-between">
                <span>Ongkos Kirim:</span>
                <span>{order.shipping_fee ? formatPrice(order.shipping_fee) : 'Akan dikonfirmasi'}</span>
              </div>
              {order.cod_surcharge && order.cod_surcharge > 0 && (
                <div className="flex justify-between">
                  <span>Biaya Tambahan COD:</span>
                  <span>{formatPrice(order.cod_surcharge)}</span>
                </div>
              )}
              <div className="border-t pt-1 mt-1">
                <div className="flex justify-between text-sm font-bold text-red-600">
                  <span>Total Belanja:</span>
                  <span>{formatPrice(
                    order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 
                    (order.shipping_fee || 0) + 
                    (order.cod_surcharge || 0)
                  )}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Information */}
      {order.customer_info.payment_method && (
        <div className="mb-3 page-break-avoid invoice-section">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-1 text-sm">Informasi Pembayaran:</h4>
            <p className="text-blue-700 font-medium text-xs">{order.customer_info.payment_method}</p>
            
            {order.customer_info.payment_method === 'Bank Transfer (Rupiah)' && (
              <div className="mt-1 text-blue-700 text-xs">
                <p><span className="font-medium">Nama Penerima:</span> PT. Injapan Shop</p>
                <p><span className="font-medium">Nomor Rekening:</span> 1234567890 (BCA)</p>
              </div>
            )}
            
            {order.customer_info.payment_method === 'Bank Transfer (Yucho / ゆうちょ銀行)' && (
              <div className="mt-1 text-blue-700 text-xs">
                <p><span className="font-medium">Nama Penerima:</span> Heri Kurnianta</p>
                <p><span className="font-medium">Account Number:</span> 22210551</p>
                <p><span className="font-medium">Nama Bank:</span> BANK POST</p>
                <p><span className="font-medium">Bank code:</span> 11170</p>
                <p><span className="font-medium">Branch code:</span> 118</p>
                <p><span className="font-medium">Referensi:</span> 24</p>
              </div>
            )}
            
            {order.customer_info.payment_method === 'QRIS / QR Code' && (
              <div className="mt-1 text-blue-700 text-xs">
                <p><span className="font-medium">Metode:</span> QRIS / QR Code</p>
                <p><span className="font-medium">Status:</span> {order.payment_status === 'verified' ? 'Terverifikasi' : order.payment_status === 'rejected' ? 'Ditolak' : 'Menunggu Verifikasi'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Affiliate Information (if available) */}
      {order.affiliate_id && (
        <div className="mb-3 page-break-avoid invoice-section">
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-800 mb-1 text-sm">Informasi Referral:</h4>
            <p className="text-green-700 text-xs">
              Pesanan ini menggunakan kode referral: <span className="font-mono font-bold">{order.affiliate_id}</span>
            </p>
          </div>
        </div>
      )}

      {/* Notes Section */}
      {order.customer_info.notes && (
        <div className="mb-3 page-break-avoid invoice-section">
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-800 mb-1 text-sm">Catatan Pesanan:</h4>
            <p className="text-yellow-700 text-xs">{order.customer_info.notes}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-200 pt-3 text-center page-break-avoid invoice-footer">
        <p className="text-gray-600 mb-1 text-xs" style={{ fontSize: '8px' }}>
          Terima kasih telah berbelanja di Injapan Food!
        </p>
        <p className="text-gray-600 mb-2 text-xs" style={{ fontSize: '8px' }}>
          Untuk pertanyaan lebih lanjut, hubungi kami melalui WhatsApp: +817084894699
        </p>
        <div className="text-xs text-gray-500" style={{ fontSize: '7px' }}>
          <p>Invoice ini dibuat secara otomatis oleh sistem Injapan Food</p>
          <p>
            Dicetak pada: {new Date().toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Invoice;