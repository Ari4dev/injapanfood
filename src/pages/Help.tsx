import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MessageCircle, Mail, Phone, HelpCircle } from 'lucide-react';

const Help = () => {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Enhanced scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const faqData = {
    id: [
      {
        id: 'shipping',
        question: 'Berapa lama waktu pengiriman?',
        answer: 'Waktu pengiriman biasanya 2-5 hari kerja tergantung lokasi Anda di Jepang. Untuk area Tokyo dan sekitarnya biasanya 1-2 hari kerja, sedangkan untuk daerah terpencil bisa memakan waktu hingga 5 hari kerja.'
      },
      {
        id: 'payment',
        question: 'Metode pembayaran apa saja yang tersedia?',
        answer: 'Kami menerima berbagai metode pembayaran: Bank Transfer (Rupiah), Bank Transfer (Yucho Bank), QRIS/QR Code, dan COD (Cash on Delivery) untuk area tertentu.'
      },
      {
        id: 'halal',
        question: 'Apakah semua produk dijamin halal?',
        answer: 'Ya, semua produk yang kami jual adalah produk halal dan telah melewati seleksi ketat untuk memastikan kualitas dan status kehalalannya.'
      },
      {
        id: 'order-cancel',
        question: 'Bagaimana cara membatalkan pesanan?',
        answer: 'Anda dapat membatalkan pesanan sebelum status berubah menjadi "Dikonfirmasi". Hubungi kami melalui WhatsApp di +817084894699 dengan menyertakan nomor pesanan Anda.'
      },
      {
        id: 'stock',
        question: 'Bagaimana jika produk yang saya pesan habis stok?',
        answer: 'Jika produk habis stok setelah Anda memesan, kami akan segera menghubungi Anda untuk memberikan opsi: menunggu restock, mengganti dengan produk serupa, atau refund.'
      },
      {
        id: 'return',
        question: 'Apakah bisa mengembalikan produk?',
        answer: 'Produk dapat dikembalikan dalam kondisi tertentu seperti kerusakan atau kesalahan pengiriman. Laporkan dalam 24 jam setelah penerimaan. Produk makanan umumnya tidak dapat dikembalikan kecuali ada kerusakan.'
      },
      {
        id: 'account',
        question: 'Apakah harus membuat akun untuk berbelanja?',
        answer: 'Tidak wajib. Anda dapat berbelanja sebagai guest, namun membuat akun akan memudahkan Anda untuk melacak pesanan dan menyimpan alamat pengiriman.'
      },
      {
        id: 'shipping-cost',
        question: 'Bagaimana cara mengetahui ongkos kirim?',
        answer: 'Ongkos kirim akan dihitung otomatis berdasarkan prefektur tujuan saat Anda mengisi alamat pengiriman di halaman checkout.'
      },
      {
        id: 'affiliate',
        question: 'Apa itu program affiliate?',
        answer: 'Program affiliate memungkinkan Anda mendapatkan komisi dari setiap pembelian yang dilakukan melalui link referral Anda. Daftar di halaman Affiliate untuk mendapatkan kode referral unik.'
      },
      {
        id: 'contact',
        question: 'Bagaimana cara menghubungi customer service?',
        answer: 'Anda dapat menghubungi kami melalui WhatsApp di +817084894699 (24/7), email di info@injapanfood.com, atau melalui form kontak di website.'
      }
    ],
    en: [
      {
        id: 'shipping',
        question: 'How long does shipping take?',
        answer: 'Shipping usually takes 2-5 business days depending on your location in Japan. For Tokyo and surrounding areas, it typically takes 1-2 business days, while remote areas may take up to 5 business days.'
      },
      {
        id: 'payment',
        question: 'What payment methods are available?',
        answer: 'We accept various payment methods: Bank Transfer (Rupiah), Bank Transfer (Yucho Bank), QRIS/QR Code, and COD (Cash on Delivery) for certain areas.'
      },
      {
        id: 'halal',
        question: 'Are all products guaranteed halal?',
        answer: 'Yes, all products we sell are halal products and have passed strict selection to ensure quality and halal status.'
      },
      {
        id: 'order-cancel',
        question: 'How do I cancel an order?',
        answer: 'You can cancel an order before the status changes to "Confirmed". Contact us via WhatsApp at +817084894699 with your order number.'
      },
      {
        id: 'stock',
        question: 'What if the product I ordered is out of stock?',
        answer: 'If a product is out of stock after you order, we will immediately contact you to provide options: wait for restock, replace with similar product, or refund.'
      },
      {
        id: 'return',
        question: 'Can I return products?',
        answer: 'Products can be returned under certain conditions such as damage or shipping errors. Report within 24 hours of receipt. Food products generally cannot be returned except for damage.'
      },
      {
        id: 'account',
        question: 'Do I need to create an account to shop?',
        answer: 'Not required. You can shop as a guest, but creating an account will make it easier to track orders and save shipping addresses.'
      },
      {
        id: 'shipping-cost',
        question: 'How do I know the shipping cost?',
        answer: 'Shipping costs will be calculated automatically based on the destination prefecture when you fill in the shipping address on the checkout page.'
      },
      {
        id: 'affiliate',
        question: 'What is the affiliate program?',
        answer: 'The affiliate program allows you to earn commission from every purchase made through your referral link. Register on the Affiliate page to get your unique referral code.'
      },
      {
        id: 'contact',
        question: 'How do I contact customer service?',
        answer: 'You can contact us via WhatsApp at +817084894699 (24/7), email at info@injapanfood.com, or through the contact form on the website.'
      }
    ]
  };

  const currentFAQ = faqData[language as keyof typeof faqData];
  
  // Filter FAQ based on search term
  const filteredFAQ = currentFAQ.filter(item => 
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {language === 'en' ? 'Help Center' : 'Pusat Bantuan'}
            </h1>
            <p className="text-xl text-gray-600">
              {language === 'en' 
                ? 'Find answers to frequently asked questions and get support'
                : 'Temukan jawaban atas pertanyaan yang sering diajukan dan dapatkan bantuan'
              }
            </p>
          </div>

          {/* Search Section */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder={language === 'en' ? 'Search for help...' : 'Cari bantuan...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-3 text-lg"
              />
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900">
                {language === 'en' ? 'Frequently Asked Questions' : 'Pertanyaan yang Sering Diajukan'}
              </h2>
            </div>
            
            <div className="p-6">
              {filteredFAQ.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {filteredFAQ.map((item) => (
                    <AccordionItem key={item.id} value={item.id}>
                      <AccordionTrigger className="text-left font-medium">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600 whitespace-pre-line">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {language === 'en' ? 'No results found' : 'Tidak ada hasil ditemukan'}
                  </h3>
                  <p className="text-gray-500">
                    {language === 'en' 
                      ? 'Try different keywords or contact our support team'
                      : 'Coba kata kunci yang berbeda atau hubungi tim dukungan kami'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Support Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900">
                {language === 'en' ? 'Still Need Help?' : 'Masih Butuh Bantuan?'}
              </h2>
              <p className="text-gray-600 mt-2">
                {language === 'en' 
                  ? 'Our customer service team is ready to help you 24/7'
                  : 'Tim layanan pelanggan kami siap membantu Anda 24/7'
                }
              </p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* WhatsApp */}
                <div className="text-center p-6 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">WhatsApp</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {language === 'en' ? 'Chat with us instantly' : 'Chat dengan kami secara langsung'}
                  </p>
                  <a
                    href="https://wa.me/817084894699"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {language === 'en' ? 'Start Chat' : 'Mulai Chat'}
                  </a>
                </div>

                {/* Email */}
                <div className="text-center p-6 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {language === 'en' ? 'Send us an email' : 'Kirim email kepada kami'}
                  </p>
                  <a
                    href="mailto:info@injapanfood.com"
                    className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {language === 'en' ? 'Send Email' : 'Kirim Email'}
                  </a>
                </div>

                {/* Phone */}
                <div className="text-center p-6 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {language === 'en' ? 'Phone' : 'Telepon'}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {language === 'en' ? 'Call us directly' : 'Hubungi kami langsung'}
                  </p>
                  <a
                    href="tel:+817084894699"
                    className="inline-flex items-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    +81 708 489 4699
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-8 bg-gray-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'en' ? 'Quick Links' : 'Tautan Cepat'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a href="/how-to-buy" className="text-blue-600 hover:text-blue-800 text-sm">
                {language === 'en' ? 'How to Buy' : 'Cara Membeli'}
              </a>
              <a href="/orders" className="text-blue-600 hover:text-blue-800 text-sm">
                {language === 'en' ? 'Order History' : 'Riwayat Pesanan'}
              </a>
              <a href="/referral" className="text-blue-600 hover:text-blue-800 text-sm">
                {language === 'en' ? 'Affiliate Program' : 'Program Affiliate'}
              </a>
              <a href="/privacy-policy" className="text-blue-600 hover:text-blue-800 text-sm">
                {language === 'en' ? 'Privacy Policy' : 'Kebijakan Privasi'}
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Help;