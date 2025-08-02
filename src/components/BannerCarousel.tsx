import { useState, useEffect } from 'react';
import { useActiveBanners } from '@/hooks/useBanners';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BannerCarousel = () => {
  const { data: banners = [], isLoading, error } = useActiveBanners();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  // Reset index if banners change
  useEffect(() => {
    setCurrentIndex(0);
  }, [banners]);

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? banners.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === banners.length - 1 ? 0 : currentIndex + 1);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const handleBannerClick = (banner: any) => {
    if (banner.link_url) {
      // Check if it's an external URL
      if (banner.link_url.startsWith('http://') || banner.link_url.startsWith('https://')) {
        window.open(banner.link_url, '_blank', 'noopener,noreferrer');
      } else {
        // Internal link
        window.location.href = banner.link_url;
      }
    }
  };

  // Don't render if loading or no banners
  if (isLoading || error || banners.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-gray-50">
      <div className="w-full">
        <div className="relative w-full">
          {/* Banner Container */}
          <div className="relative overflow-hidden bg-white">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {banners.map((banner, index) => (
                <div
                  key={banner.id}
                  className="w-full flex-shrink-0 relative"
                >
                  <div
                    className={`relative w-full ${
                      banner.link_url ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => handleBannerClick(banner)}
                  >
                    {/* Responsive container with aspect ratio */}
                    <div className="relative w-full aspect-[16/9] sm:aspect-[20/9] md:aspect-[24/9] lg:aspect-[32/9]">
                      <img
                        src={banner.image_url}
                        alt={`Banner ${index + 1}`}
                        className="absolute inset-0 w-full h-full object-contain sm:object-cover bg-gray-100"
                        loading={index === 0 ? 'eager' : 'lazy'}
                      />
                    </div>
                    
                    {/* Overlay for better text readability if needed */}
                    <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                    
                    {/* Click indicator for linked banners */}
                    {banner.link_url && (
                      <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-white bg-opacity-90 px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-medium text-gray-700">
                        Klik untuk info lebih lanjut
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            {banners.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 rounded-full shadow-md w-8 h-8 md:w-10 md:h-10"
                  onClick={goToPrevious}
                  aria-label="Previous banner"
                >
                  <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 rounded-full shadow-md w-8 h-8 md:w-10 md:h-10"
                  onClick={goToNext}
                  aria-label="Next banner"
                >
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
              </>
            )}

            {/* Dots Indicator */}
            {banners.length > 1 && (
              <div className="absolute bottom-2 md:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? 'bg-white shadow-md'
                        : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                    }`}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to banner ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BannerCarousel;