import { analytics } from '@/config/firebase';
import { logEvent } from 'firebase/analytics';

export interface AnalyticsEvent {
  eventName: string;
  parameters?: Record<string, any>;
}

export class AnalyticsCollector {
  private static instance: AnalyticsCollector;
  private sessionData: {
    startTime: number;
    pageViews: number;
    currentPage: string;
  } = {
    startTime: Date.now(),
    pageViews: 0,
    currentPage: '/'
  };

  static getInstance(): AnalyticsCollector {
    if (!AnalyticsCollector.instance) {
      AnalyticsCollector.instance = new AnalyticsCollector();
    }
    return AnalyticsCollector.instance;
  }

  // Track page views
  trackPageView(pagePath: string, pageTitle?: string) {
    if (analytics) {
      logEvent(analytics, 'page_view', {
        page_path: pagePath,
        page_title: pageTitle || document.title,
        timestamp: Date.now()
      });
    }
    
    this.sessionData.pageViews++;
    this.sessionData.currentPage = pagePath;
  }

  // Track custom events
  trackEvent(eventName: string, parameters?: Record<string, any>) {
    if (analytics) {
      logEvent(analytics, eventName, {
        ...parameters,
        timestamp: Date.now()
      });
    }
  }

  // Track user interactions
  trackUserInteraction(action: string, category: string, label?: string) {
    this.trackEvent('user_interaction', {
      action,
      category,
      label,
      page: this.sessionData.currentPage
    });
  }

  // Track e-commerce events
  trackPurchase(transactionId: string, value: number, currency: string = 'USD', items?: any[]) {
    this.trackEvent('purchase', {
      transaction_id: transactionId,
      value,
      currency,
      items
    });
  }

  // Track search events
  trackSearch(searchTerm: string, results?: number) {
    this.trackEvent('search', {
      search_term: searchTerm,
      results_count: results
    });
  }

  // Get session duration
  getSessionDuration(): number {
    return Math.floor((Date.now() - this.sessionData.startTime) / 1000);
  }

  // Get current session info
  getSessionInfo() {
    return {
      ...this.sessionData,
      sessionDuration: this.getSessionDuration()
    };
  }
}

// Hook for React components
export const useAnalytics = () => {
  const collector = AnalyticsCollector.getInstance();
  
  return {
    trackPageView: collector.trackPageView.bind(collector),
    trackEvent: collector.trackEvent.bind(collector),
    trackUserInteraction: collector.trackUserInteraction.bind(collector),
    trackPurchase: collector.trackPurchase.bind(collector),
    trackSearch: collector.trackSearch.bind(collector),
    getSessionInfo: collector.getSessionInfo.bind(collector)
  };
};
