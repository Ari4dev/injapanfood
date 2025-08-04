import { db } from '@/config/firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';

// Sample analytics data structure
const analyticsData = [
  {
    id: 'daily_stats_2024_08_01',
    date: '2024-08-01',
    type: 'daily_stats',
    visitors: 2400,
    pageViews: 4800,
    bounceRate: 35,
    avgSessionDuration: 225, // in seconds
    devices: {
      desktop: 45,
      mobile: 35,
      tablet: 20
    },
    trafficSources: {
      google: { visitors: 1080, percentage: 45.0 },
      direct: { visitors: 720, percentage: 30.0 },
      social: { visitors: 360, percentage: 15.0 },
      referral: { visitors: 240, percentage: 10.0 }
    },
    topPages: [
      { page: '/', views: 1200, bounce: 28 },
      { page: '/products', views: 960, bounce: 32 },
      { page: '/bundles', views: 720, bounce: 25 },
      { page: '/auth', views: 480, bounce: 45 },
      { page: '/cart', views: 360, bounce: 15 }
    ]
  },
  {
    id: 'daily_stats_2024_08_02',
    date: '2024-08-02',
    type: 'daily_stats',
    visitors: 1398,
    pageViews: 2800,
    bounceRate: 42,
    avgSessionDuration: 195,
    devices: {
      desktop: 42,
      mobile: 38,
      tablet: 20
    },
    trafficSources: {
      google: { visitors: 629, percentage: 45.0 },
      direct: { visitors: 419, percentage: 30.0 },
      social: { visitors: 210, percentage: 15.0 },
      referral: { visitors: 140, percentage: 10.0 }
    },
    topPages: [
      { page: '/', views: 700, bounce: 30 },
      { page: '/products', views: 560, bounce: 35 },
      { page: '/bundles', views: 420, bounce: 28 },
      { page: '/auth', views: 280, bounce: 48 },
      { page: '/cart', views: 210, bounce: 18 }
    ]
  },
  {
    id: 'daily_stats_2024_08_03',
    date: '2024-08-03',
    type: 'daily_stats',
    visitors: 9800,
    pageViews: 15600,
    bounceRate: 28,
    avgSessionDuration: 280,
    devices: {
      desktop: 48,
      mobile: 32,
      tablet: 20
    },
    trafficSources: {
      google: { visitors: 4410, percentage: 45.0 },
      direct: { visitors: 2940, percentage: 30.0 },
      social: { visitors: 1470, percentage: 15.0 },
      referral: { visitors: 980, percentage: 10.0 }
    },
    topPages: [
      { page: '/', views: 4680, bounce: 25 },
      { page: '/products', views: 3744, bounce: 30 },
      { page: '/bundles', views: 2808, bounce: 22 },
      { page: '/auth', views: 1872, bounce: 42 },
      { page: '/cart', views: 1404, bounce: 12 }
    ]
  },
  {
    id: 'daily_stats_2024_08_04',
    date: '2024-08-04',
    type: 'daily_stats',
    visitors: 3908,
    pageViews: 7800,
    bounceRate: 31,
    avgSessionDuration: 240,
    devices: {
      desktop: 46,
      mobile: 34,
      tablet: 20
    },
    trafficSources: {
      google: { visitors: 1759, percentage: 45.0 },
      direct: { visitors: 1172, percentage: 30.0 },
      social: { visitors: 586, percentage: 15.0 },
      referral: { visitors: 391, percentage: 10.0 }
    },
    topPages: [
      { page: '/', views: 1954, bounce: 28 },
      { page: '/products', views: 1563, bounce: 33 },
      { page: '/bundles', views: 1172, bounce: 26 },
      { page: '/auth', views: 781, bounce: 44 },
      { page: '/cart', views: 586, bounce: 16 }
    ]
  },
  {
    id: 'weekly_summary_2024_w31',
    date: '2024-07-29',
    type: 'weekly_summary',
    period: 'week_31_2024',
    totalVisitors: 28500,
    totalPageViews: 64200,
    avgBounceRate: 32.4,
    avgSessionDuration: 225,
    devices: {
      desktop: 45,
      mobile: 35,
      tablet: 20
    },
    trafficSources: {
      google: { visitors: 12825, percentage: 45.0 },
      direct: { visitors: 8550, percentage: 30.0 },
      social: { visitors: 4275, percentage: 15.0 },
      referral: { visitors: 2850, percentage: 10.0 }
    },
    topPages: [
      { page: '/', views: 15420, bounce: 28 },
      { page: '/products', views: 12350, bounce: 32 },
      { page: '/bundles', views: 8940, bounce: 25 },
      { page: '/auth', views: 6780, bounce: 45 },
      { page: '/cart', views: 4560, bounce: 15 }
    ],
    dailyBreakdown: [
      { date: 'Sen', visitors: 2400, pageViews: 4800, bounceRate: 35 },
      { date: 'Sel', visitors: 1398, pageViews: 2800, bounceRate: 42 },
      { date: 'Rab', visitors: 9800, pageViews: 15600, bounceRate: 28 },
      { date: 'Kam', visitors: 3908, pageViews: 7800, bounceRate: 31 },
      { date: 'Jum', visitors: 4800, pageViews: 9600, bounceRate: 33 },
      { date: 'Sab', visitors: 3800, pageViews: 7200, bounceRate: 29 },
      { date: 'Min', visitors: 4300, pageViews: 8600, bounceRate: 34 }
    ]
  }
];

const seedAnalyticsData = async () => {
  try {
    console.log('Starting to seed analytics data...');
    
    for (const data of analyticsData) {
      // Use setDoc with specific document ID to avoid duplicates
      await setDoc(doc(db, 'analytics', data.id), data);
      console.log(`Added analytics data: ${data.id}`);
    }
    
    console.log('Analytics data seeding completed successfully!');
    console.log(`Total documents added: ${analyticsData.length}`);
    
  } catch (error) {
    console.error('Error seeding analytics data:', error);
  }
};

// Export the function for use in other scripts
export { seedAnalyticsData };

// Run the seeding if this file is executed directly
if (typeof window === 'undefined') {
  seedAnalyticsData();
}
