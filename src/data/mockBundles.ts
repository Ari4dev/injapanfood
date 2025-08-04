import { BundleWithItems } from '@/types/bundle';

export const mockBundles: BundleWithItems[] = [
  {
    id: '1',
    name: 'Paket Hemat Ramen',
    description: 'Nikmati berbagai varian ramen dengan harga hemat',
    bundle_type: 'fixed',
    bundle_price: 45000,
    original_price: 60000,
    savings: 15000,
    status: 'active',
    priority: 1,
    min_items: 3,
    max_items: 3,
    total_items: 3,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-12-31'),
    created_at: new Date(),
    updated_at: new Date(),
    image_url: '/images/bundles/ramen-bundle.jpg',
    items: [
      {
        id: '1-1',
        bundle_id: '1',
        product_id: 'ramen-1',
        quantity: 1,
        is_required: true,
        product: {
          id: 'ramen-1',
          name: 'Ramen Shoyu',
          price: 25000,
          category: 'Ramen',
          image_url: '/images/products/ramen-shoyu.jpg',
          description: 'Ramen dengan kuah shoyu yang gurih'
        }
      },
      {
        id: '1-2',
        bundle_id: '1',
        product_id: 'ramen-2',
        quantity: 1,
        is_required: true,
        product: {
          id: 'ramen-2',
          name: 'Ramen Miso',
          price: 20000,
          category: 'Ramen',
          image_url: '/images/products/ramen-miso.jpg',
          description: 'Ramen dengan kuah miso yang kaya rasa'
        }
      },
      {
        id: '1-3',
        bundle_id: '1',
        product_id: 'gyoza-1',
        quantity: 1,
        is_required: true,
        product: {
          id: 'gyoza-1',
          name: 'Gyoza (5pcs)',
          price: 15000,
          category: 'Appetizer',
          image_url: '/images/products/gyoza.jpg',
          description: 'Gyoza isi daging dengan kulit yang crispy'
        }
      }
    ]
  },
  {
    id: '2',
    name: 'Paket Sushi Deluxe',
    description: 'Pilihan sushi terbaik dengan berbagai varian segar',
    bundle_type: 'mix_and_match',
    bundle_price: 85000,
    original_price: 110000,
    savings: 25000,
    status: 'active',
    priority: 2,
    min_items: 2,
    max_items: 4,
    total_items: 4,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-12-31'),
    created_at: new Date(),
    updated_at: new Date(),
    image_url: '/images/bundles/sushi-bundle.jpg',
    items: [
      {
        id: '2-1',
        bundle_id: '2',
        product_id: 'sushi-1',
        quantity: 1,
        is_required: false,
        product: {
          id: 'sushi-1',
          name: 'Salmon Sushi (2pcs)',
          price: 30000,
          category: 'Sushi',
          image_url: '/images/products/salmon-sushi.jpg',
          description: 'Sushi salmon segar dengan nori premium'
        }
      },
      {
        id: '2-2',
        bundle_id: '2',
        product_id: 'sushi-2',
        quantity: 1,
        is_required: false,
        product: {
          id: 'sushi-2',
          name: 'Tuna Sushi (2pcs)',
          price: 35000,
          category: 'Sushi',
          image_url: '/images/products/tuna-sushi.jpg',
          description: 'Sushi tuna segar berkualitas tinggi'
        }
      },
      {
        id: '2-3',
        bundle_id: '2',
        product_id: 'roll-1',
        quantity: 1,
        is_required: false,
        product: {
          id: 'roll-1',
          name: 'California Roll (8pcs)',
          price: 25000,
          category: 'Sushi Roll',
          image_url: '/images/products/california-roll.jpg',
          description: 'California roll dengan alpukat dan kepiting'
        }
      },
      {
        id: '2-4',
        bundle_id: '2',
        product_id: 'roll-2',
        quantity: 1,
        is_required: false,
        product: {
          id: 'roll-2',
          name: 'Spicy Tuna Roll (8pcs)',
          price: 30000,
          category: 'Sushi Roll',
          image_url: '/images/products/spicy-tuna-roll.jpg',
          description: 'Roll tuna pedas dengan mayo spicy'
        }
      }
    ]
  },
  {
    id: '3',
    name: 'Paket Bento Lengkap',
    description: 'Bento box dengan lauk lengkap dan nasi hangat',
    bundle_type: 'fixed',
    bundle_price: 55000,
    original_price: 75000,
    savings: 20000,
    status: 'active',
    priority: 3,
    min_items: 4,
    max_items: 4,
    total_items: 4,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-12-31'),
    created_at: new Date(),
    updated_at: new Date(),
    image_url: '/images/bundles/bento-bundle.jpg',
    items: [
      {
        id: '3-1',
        bundle_id: '3',
        product_id: 'bento-1',
        quantity: 1,
        is_required: true,
        product: {
          id: 'teriyaki-chicken',
          name: 'Teriyaki Chicken Bento',
          price: 35000,
          category: 'Bento',
          image_url: '/images/products/teriyaki-chicken-bento.jpg',
          description: 'Bento dengan ayam teriyaki, nasi, dan sayuran'
        }
      },
      {
        id: '3-2',
        bundle_id: '3',
        product_id: 'miso-soup',
        quantity: 1,
        is_required: true,
        product: {
          id: 'miso-soup',
          name: 'Miso Soup',
          price: 15000,
          category: 'Soup',
          image_url: '/images/products/miso-soup.jpg',
          description: 'Sup miso hangat dengan tahu dan rumput laut'
        }
      },
      {
        id: '3-3',
        bundle_id: '3',
        product_id: 'salad',
        quantity: 1,
        is_required: true,
        product: {
          id: 'seaweed-salad',
          name: 'Seaweed Salad',
          price: 12000,
          category: 'Salad',
          image_url: '/images/products/seaweed-salad.jpg',
          description: 'Salad rumput laut segar dengan dressing wijen'
        }
      },
      {
        id: '3-4',
        bundle_id: '3',
        product_id: 'green-tea',
        quantity: 1,
        is_required: true,
        product: {
          id: 'green-tea',
          name: 'Green Tea',
          price: 8000,
          category: 'Drinks',
          image_url: '/images/products/green-tea.jpg',
          description: 'Teh hijau hangat tradisional Jepang'
        }
      }
    ]
  },
  {
    id: '4',
    name: 'Paket Dessert Paradise',
    description: 'Koleksi dessert Jepang yang manis dan lezat',
    bundle_type: 'mix_and_match',
    bundle_price: 40000,
    original_price: 55000,
    savings: 15000,
    status: 'active',
    priority: 1,
    min_items: 2,
    max_items: 3,
    total_items: 4,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-12-31'),
    created_at: new Date(),
    updated_at: new Date(),
    image_url: '/images/bundles/dessert-bundle.jpg',
    items: [
      {
        id: '4-1',
        bundle_id: '4',
        product_id: 'mochi-1',
        quantity: 1,
        is_required: false,
        product: {
          id: 'mochi-1',
          name: 'Mochi Ice Cream (3pcs)',
          price: 18000,
          category: 'Dessert',
          image_url: '/images/products/mochi-ice-cream.jpg',
          description: 'Mochi es krim dengan berbagai rasa'
        }
      },
      {
        id: '4-2',
        bundle_id: '4',
        product_id: 'dorayaki',
        quantity: 1,
        is_required: false,
        product: {
          id: 'dorayaki',
          name: 'Dorayaki (2pcs)',
          price: 15000,
          category: 'Dessert',
          image_url: '/images/products/dorayaki.jpg',
          description: 'Pancake Jepang dengan isian kacang merah'
        }
      },
      {
        id: '4-3',
        bundle_id: '4',
        product_id: 'taiyaki',
        quantity: 1,
        is_required: false,
        product: {
          id: 'taiyaki',
          name: 'Taiyaki (2pcs)',
          price: 12000,
          category: 'Dessert',
          image_url: '/images/products/taiyaki.jpg',
          description: 'Kue ikan dengan isian custard manis'
        }
      },
      {
        id: '4-4',
        bundle_id: '4',
        product_id: 'matcha-latte',
        quantity: 1,
        is_required: false,
        product: {
          id: 'matcha-latte',
          name: 'Matcha Latte',
          price: 20000,
          category: 'Drinks',
          image_url: '/images/products/matcha-latte.jpg',
          description: 'Latte matcha dengan foam yang creamy'
        }
      }
    ]
  },
  {
    id: '5',
    name: 'Paket Yakitori Set',
    description: 'Berbagai varian yakitori dengan bumbu autentik',
    bundle_type: 'fixed',
    bundle_price: 65000,
    original_price: 85000,
    savings: 20000,
    status: 'active',
    priority: 2,
    min_items: 3,
    max_items: 3,
    total_items: 3,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-12-31'),
    created_at: new Date(),
    updated_at: new Date(),
    image_url: '/images/bundles/yakitori-bundle.jpg',
    items: [
      {
        id: '5-1',
        bundle_id: '5',
        product_id: 'yakitori-1',
        quantity: 3,
        is_required: true,
        product: {
          id: 'yakitori-chicken',
          name: 'Yakitori Chicken (3 sticks)',
          price: 30000,
          category: 'Grilled',
          image_url: '/images/products/yakitori-chicken.jpg',
          description: 'Sate ayam Jepang dengan saus tare'
        }
      },
      {
        id: '5-2',
        bundle_id: '5',
        product_id: 'yakitori-2',
        quantity: 2,
        is_required: true,
        product: {
          id: 'yakitori-beef',
          name: 'Yakitori Beef (2 sticks)',
          price: 35000,
          category: 'Grilled',
          image_url: '/images/products/yakitori-beef.jpg',
          description: 'Sate daging sapi dengan bumbu khas Jepang'
        }
      },
      {
        id: '5-3',
        bundle_id: '5',
        product_id: 'edamame',
        quantity: 1,
        is_required: true,
        product: {
          id: 'edamame',
          name: 'Edamame',
          price: 12000,
          category: 'Appetizer',
          image_url: '/images/products/edamame.jpg',
          description: 'Kacang edamame rebus dengan garam laut'
        }
      }
    ]
  }
];
