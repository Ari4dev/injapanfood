import { useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PrivacyPolicy = () => {
  const { t, language } = useLanguage();
  
  // Enhanced scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const content = {
    id: {
      title: "Kebijakan Privasi",
      lastUpdated: "Terakhir diperbarui: 15 Januari 2025",
      sections: [
        {
          title: "1. Informasi yang Kami Kumpulkan",
          content: `Kami mengumpulkan informasi yang Anda berikan secara langsung kepada kami, seperti:
          
• Informasi akun (nama, email, nomor telepon)
• Informasi pengiriman (alamat, kode pos, prefektur)
• Riwayat pesanan dan preferensi belanja
• Komunikasi dengan layanan pelanggan kami`
        },
        {
          title: "2. Bagaimana Kami Menggunakan Informasi Anda",
          content: `Kami menggunakan informasi yang dikumpulkan untuk:
          
• Memproses dan mengirim pesanan Anda
• Memberikan layanan pelanggan yang lebih baik
• Mengirim pembaruan tentang pesanan dan promosi
• Meningkatkan pengalaman berbelanja Anda
• Mematuhi kewajiban hukum`
        },
        {
          title: "3. Berbagi Informasi",
          content: `Kami tidak menjual, menyewakan, atau membagikan informasi pribadi Anda kepada pihak ketiga, kecuali:
          
• Untuk memproses pembayaran melalui gateway pembayaran yang aman
• Untuk pengiriman melalui jasa kurir terpercaya
• Jika diwajibkan oleh hukum yang berlaku
• Dengan persetujuan eksplisit dari Anda`
        },
        {
          title: "4. Keamanan Data",
          content: `Kami menerapkan langkah-langkah keamanan yang sesuai untuk melindungi informasi pribadi Anda:
          
• Enkripsi data saat transmisi
• Akses terbatas ke informasi pribadi
• Pemantauan keamanan secara berkala
• Penyimpanan data yang aman`
        },
        {
          title: "5. Hak Anda",
          content: `Anda memiliki hak untuk:
          
• Mengakses informasi pribadi yang kami miliki tentang Anda
• Memperbarui atau mengoreksi informasi yang tidak akurat
• Meminta penghapusan data pribadi Anda
• Menarik persetujuan untuk pemrosesan data`
        },
        {
          title: "6. Cookies dan Teknologi Pelacakan",
          content: `Kami menggunakan cookies dan teknologi serupa untuk:
          
• Mengingat preferensi Anda
• Menganalisis penggunaan situs web
• Menyediakan fitur yang dipersonalisasi
• Meningkatkan kinerja situs web`
        },
        {
          title: "7. Hubungi Kami",
          content: `Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi kami:
          
• Email: privacy@injapanfood.com
• WhatsApp: +817084894699
• Alamat: Injapan Food, Tokyo, Japan`
        }
      ]
    },
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last updated: January 15, 2025",
      sections: [
        {
          title: "1. Information We Collect",
          content: `We collect information you provide directly to us, such as:
          
• Account information (name, email, phone number)
• Shipping information (address, postal code, prefecture)
• Order history and shopping preferences
• Communications with our customer service`
        },
        {
          title: "2. How We Use Your Information",
          content: `We use the collected information to:
          
• Process and ship your orders
• Provide better customer service
• Send order updates and promotions
• Improve your shopping experience
• Comply with legal obligations`
        },
        {
          title: "3. Information Sharing",
          content: `We do not sell, rent, or share your personal information with third parties, except:
          
• To process payments through secure payment gateways
• For shipping through trusted courier services
• When required by applicable law
• With your explicit consent`
        },
        {
          title: "4. Data Security",
          content: `We implement appropriate security measures to protect your personal information:
          
• Data encryption during transmission
• Limited access to personal information
• Regular security monitoring
• Secure data storage`
        },
        {
          title: "5. Your Rights",
          content: `You have the right to:
          
• Access personal information we hold about you
• Update or correct inaccurate information
• Request deletion of your personal data
• Withdraw consent for data processing`
        },
        {
          title: "6. Cookies and Tracking Technologies",
          content: `We use cookies and similar technologies to:
          
• Remember your preferences
• Analyze website usage
• Provide personalized features
• Improve website performance`
        },
        {
          title: "7. Contact Us",
          content: `If you have questions about this privacy policy, please contact us:
          
• Email: privacy@injapanfood.com
• WhatsApp: +817084894699
• Address: Injapan Food, Tokyo, Japan`
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
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  {language === 'en' ? 'Questions?' : 'Ada Pertanyaan?'}
                </h3>
                <p className="text-blue-700 mb-4">
                  {language === 'en' 
                    ? 'If you have any questions about our privacy policy, feel free to contact us.'
                    : 'Jika Anda memiliki pertanyaan tentang kebijakan privasi kami, jangan ragu untuk menghubungi kami.'
                  }
                </p>
                <a
                  href="https://wa.me/817084894699"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.515z"/>
                  </svg>
                  {language === 'en' ? 'Contact Us' : 'Hubungi Kami'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;