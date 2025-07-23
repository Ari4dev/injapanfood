import { useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const TermsConditions = () => {
  const { t, language } = useLanguage();
  
  // Enhanced scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const content = {
    id: {
      title: "Syarat & Ketentuan",
      lastUpdated: "Terakhir diperbarui: 15 Januari 2025",
      sections: [
        {
          title: "1. Penerimaan Syarat",
          content: `Dengan mengakses dan menggunakan situs web Injapan Food, Anda menyetujui untuk terikat oleh syarat dan ketentuan ini. Jika Anda tidak setuju dengan syarat ini, mohon untuk tidak menggunakan layanan kami.`
        },
        {
          title: "2. Layanan Kami",
          content: `Injapan Food menyediakan platform e-commerce untuk pembelian makanan dan produk Indonesia di Jepang. Layanan kami meliputi:
          
• Katalog produk makanan Indonesia
• Sistem pemesanan online
• Pengiriman ke seluruh Jepang
• Layanan pelanggan melalui WhatsApp`
        },
        {
          title: "3. Akun Pengguna",
          content: `Untuk menggunakan layanan tertentu, Anda mungkin perlu membuat akun. Anda bertanggung jawab untuk:
          
• Menjaga kerahasiaan informasi akun Anda
• Semua aktivitas yang terjadi di bawah akun Anda
• Memberikan informasi yang akurat dan terkini
• Memberi tahu kami jika ada penggunaan akun yang tidak sah`
        },
        {
          title: "4. Pemesanan dan Pembayaran",
          content: `Ketentuan pemesanan:
          
• Semua pesanan tunduk pada ketersediaan stok
• Harga dapat berubah tanpa pemberitahuan sebelumnya
• Pembayaran harus dilakukan sesuai metode yang tersedia
• Kami berhak menolak atau membatalkan pesanan dalam keadaan tertentu`
        },
        {
          title: "5. Pengiriman",
          content: `Kebijakan pengiriman:
          
• Pengiriman tersedia ke seluruh Jepang
• Waktu pengiriman bervariasi tergantung lokasi
• Biaya pengiriman akan dihitung berdasarkan lokasi tujuan
• Risiko kerusakan atau kehilangan selama pengiriman ditanggung oleh jasa kurir`
        },
        {
          title: "6. Pengembalian dan Penukaran",
          content: `Kebijakan pengembalian:
          
• Produk dapat dikembalikan dalam kondisi tertentu
• Pengembalian harus dilaporkan dalam 24 jam setelah penerimaan
• Produk makanan tidak dapat dikembalikan kecuali ada kerusakan
• Biaya pengembalian ditanggung oleh pembeli kecuali ada kesalahan dari kami`
        },
        {
          title: "7. Hak Kekayaan Intelektual",
          content: `Semua konten di situs web ini, termasuk teks, gambar, logo, dan desain, adalah milik Injapan Food dan dilindungi oleh hukum hak cipta. Anda tidak diperkenankan menggunakan konten kami tanpa izin tertulis.`
        },
        {
          title: "8. Batasan Tanggung Jawab",
          content: `Injapan Food tidak bertanggung jawab atas:
          
• Kerugian tidak langsung atau konsekuensial
• Gangguan layanan karena faktor di luar kendali kami
• Kesalahan informasi yang disediakan oleh pihak ketiga
• Kerusakan yang disebabkan oleh penggunaan produk yang tidak sesuai`
        },
        {
          title: "9. Perubahan Syarat",
          content: `Kami berhak mengubah syarat dan ketentuan ini kapan saja. Perubahan akan diberitahukan melalui situs web kami. Penggunaan layanan yang berkelanjutan setelah perubahan dianggap sebagai penerimaan terhadap syarat yang baru.`
        },
        {
          title: "10. Hukum yang Berlaku",
          content: `Syarat dan ketentuan ini diatur oleh hukum Jepang. Setiap sengketa akan diselesaikan melalui pengadilan yang berwenang di Jepang.`
        }
      ]
    },
    en: {
      title: "Terms & Conditions",
      lastUpdated: "Last updated: January 15, 2025",
      sections: [
        {
          title: "1. Acceptance of Terms",
          content: `By accessing and using the Injapan Food website, you agree to be bound by these terms and conditions. If you do not agree to these terms, please do not use our services.`
        },
        {
          title: "2. Our Services",
          content: `Injapan Food provides an e-commerce platform for purchasing Indonesian food and products in Japan. Our services include:
          
• Indonesian food product catalog
• Online ordering system
• Delivery throughout Japan
• Customer service via WhatsApp`
        },
        {
          title: "3. User Accounts",
          content: `To use certain services, you may need to create an account. You are responsible for:
          
• Maintaining the confidentiality of your account information
• All activities that occur under your account
• Providing accurate and current information
• Notifying us of any unauthorized account use`
        },
        {
          title: "4. Orders and Payment",
          content: `Order terms:
          
• All orders are subject to stock availability
• Prices may change without prior notice
• Payment must be made according to available methods
• We reserve the right to refuse or cancel orders under certain circumstances`
        },
        {
          title: "5. Shipping",
          content: `Shipping policy:
          
• Shipping available throughout Japan
• Delivery time varies depending on location
• Shipping costs will be calculated based on destination
• Risk of damage or loss during shipping is borne by the courier service`
        },
        {
          title: "6. Returns and Exchanges",
          content: `Return policy:
          
• Products can be returned under certain conditions
• Returns must be reported within 24 hours of receipt
• Food products cannot be returned except for damage
• Return costs are borne by the buyer unless there is an error on our part`
        },
        {
          title: "7. Intellectual Property Rights",
          content: `All content on this website, including text, images, logos, and designs, is owned by Injapan Food and protected by copyright law. You may not use our content without written permission.`
        },
        {
          title: "8. Limitation of Liability",
          content: `Injapan Food is not responsible for:
          
• Indirect or consequential damages
• Service interruptions due to factors beyond our control
• Incorrect information provided by third parties
• Damage caused by improper use of products`
        },
        {
          title: "9. Changes to Terms",
          content: `We reserve the right to change these terms and conditions at any time. Changes will be notified through our website. Continued use of services after changes is considered acceptance of the new terms.`
        },
        {
          title: "10. Governing Law",
          content: `These terms and conditions are governed by Japanese law. Any disputes will be resolved through competent courts in Japan.`
        }
      ]
    }
  };

  const currentContent = content[language as keyof typeof content];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{currentContent.title}</h1>
              <p className="text-gray-600">{currentContent.lastUpdated}</p>
            </div>

            <div className="prose prose-lg max-w-none">
              {currentContent.sections.map((section, index) => (
                <div key={index} className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">{section.title}</h2>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="bg-yellow-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  {language === 'en' ? 'Important Notice' : 'Pemberitahuan Penting'}
                </h3>
                <p className="text-yellow-700">
                  {language === 'en' 
                    ? 'By using our services, you acknowledge that you have read, understood, and agree to be bound by these terms and conditions.'
                    : 'Dengan menggunakan layanan kami, Anda mengakui bahwa Anda telah membaca, memahami, dan setuju untuk terikat oleh syarat dan ketentuan ini.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TermsConditions;