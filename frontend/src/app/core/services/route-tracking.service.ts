import { Injectable, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { filter, takeUntil, Subject } from 'rxjs';
import { VisitService, PageVisitData } from './visit.service';

@Injectable({
  providedIn: 'root'
})
export class RouteTrackingService implements OnDestroy {
  private currentPage: string = '';
  private previousPage: string = '';
  private deviceId: string = '';
  private sessionId: string = '';
  private visitStartTime: number = 0;
  private visitDurationInterval: any;
  private destroy$ = new Subject<void>();

  // Page name mapping for better analytics
  private pageNames: { [key: string]: string } = {
    '/home': 'Home',
    '/contact': 'Contact',
    '/user-dashboard': 'User Dashboard',
    '/error': 'Error Page',
    '/not-found-page': 'Not Found Page',
    '/signin': 'Sign In',
    '/event': 'Event RSVP',
    '/upload-photos': 'Photo Upload'
  };

  constructor(
    private router: Router,
    private visitService: VisitService
  ) {
    this.initializeTracking();
  }

  private initializeTracking(): void {

    // Get or generate device ID
    this.deviceId = localStorage.getItem('deviceId') || this.visitService.generateDeviceId();
    if (!localStorage.getItem('deviceId')) {
      localStorage.setItem('deviceId', this.deviceId);
    }

    // Generate session ID
    this.sessionId = this.generateSessionId();
    this.visitStartTime = Date.now();

    // Listen to route changes
    this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      this.trackPageVisit(event.urlAfterRedirects);
    });

    // Track initial page load
    this.trackPageVisit(this.router.url);

    // Start visit duration tracking
    this.startVisitDurationTracking();
  }

  private trackPageVisit(url: string): void {
    // Skip if it's the same page (except for initial load)
    if (this.currentPage === url && this.currentPage !== '') {
      return;
    }

    this.previousPage = this.currentPage;
    this.currentPage = url;

    // Determine navigation type
    const navigationType = this.getNavigationType();

    // Get page name from URL
    const pageName = this.getPageName(url);
    const pagePath = this.extractPagePath(url);

    // Add visible logging to show the service is working
    // console.log('🚀 RouteTrackingService: Page navigation detected!');
    // console.log(`📍 From: ${this.previousPage || 'Initial Load'}`);
    // console.log(`📍 To: ${url}`);
    // console.log(`📄 Page Name: ${pageName}`);
    // console.log(`🔗 Page Path: ${pagePath}`);
    // console.log(`🧭 Navigation Type: ${navigationType}`);

    // Prepare visit data
    const visitData: PageVisitData = {
      deviceId: this.deviceId,
      userAgent: this.visitService.getUserAgent(),
      language: this.visitService.getLanguage(),
      screenResolution: this.visitService.getScreenResolution(),
      timezone: this.visitService.getTimezone(),
      referrer: this.previousPage || document.referrer,
      pageUrl: window.location.origin + url,
      sessionId: this.sessionId,
      pageName: pageName,
      pagePath: pagePath,
      previousPage: this.previousPage ? this.getPageName(this.previousPage) : undefined,
      navigationType: navigationType
    };

    // Track the visit (excluding certain IPs as in your original code)
    this.visitService.trackPageVisit(visitData).subscribe({
      next: (response: any) => {
        
      },
      error: (error: any) => {
        console.error(`❌ Error tracking page visit for ${pageName}:`, error);
      }
    });
  }

  private getPageName(url: string): string {
    // Extract the main path
    const path = this.extractPagePath(url);

    // Return the friendly name or the path itself
    return this.pageNames[path] || path || 'Unknown Page';
  }

  private extractPagePath(url: string): string {
    // Remove query parameters and hash
    const cleanUrl = url.split('?')[0].split('#')[0];

    // Handle dynamic routes like /event/:id
    if (cleanUrl.startsWith('/event/')) {
      return '/event';
    }
    if (cleanUrl.startsWith('/upload-photos/')) {
      return '/upload-photos';
    }

    return cleanUrl;
  }

  private getNavigationType(): 'navigate' | 'reload' | 'back_forward' {
    // This is a simplified detection - you could enhance this with more sophisticated logic
    if (this.previousPage === '') {
      return 'reload';
    }

    // Check if it's a back/forward navigation (you could enhance this with more logic)
    const navigationEntry = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming);
    if (navigationEntry && navigationEntry.type === 'back_forward') {
      return 'back_forward';
    }

    return 'navigate';
  }

  private startVisitDurationTracking(): void {
    // Update visit duration every 30 seconds
    this.visitDurationInterval = setInterval(() => {
      if (this.deviceId && this.visitStartTime) {
        const duration = Math.floor((Date.now() - this.visitStartTime) / 1000);
        this.visitService.updateVisitDuration(this.deviceId, this.sessionId, duration).subscribe({
          error: (error) => {
            console.error('Error updating visit duration:', error);
          }
        });
      }
    }, 30000); // Update every 30 seconds
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Public method to manually track a page visit (useful for components that need custom tracking)
  public trackCustomPageVisit(pageName: string, additionalData?: any): void {
    const visitData: PageVisitData = {
      deviceId: this.deviceId,
      userAgent: this.visitService.getUserAgent(),
      language: this.visitService.getLanguage(),
      screenResolution: this.visitService.getScreenResolution(),
      timezone: this.visitService.getTimezone(),
      referrer: this.previousPage || document.referrer,
      pageUrl: window.location.href,
      sessionId: this.sessionId,
      pageName: pageName,
      pagePath: window.location.pathname,
      previousPage: this.previousPage ? this.getPageName(this.previousPage) : undefined,
      navigationType: 'navigate',
      ...additionalData
    };

    this.visitService.trackPageVisit(visitData).subscribe({
      next: (response: any) => {
        console.log(`Custom page visit tracked successfully for ${pageName}:`, response);
      },
      error: (error: any) => {
        console.error(`Error tracking custom page visit for ${pageName}:`, error);
      }
    });
  }

  // Public method to get current page info
  public getCurrentPageInfo(): { pageName: string; pagePath: string; previousPage?: string } {
    return {
      pageName: this.getPageName(this.currentPage),
      pagePath: this.extractPagePath(this.currentPage),
      previousPage: this.previousPage ? this.getPageName(this.previousPage) : undefined
    };
  }

  ngOnDestroy(): void {
    // Update visit duration when service is destroyed
    if (this.deviceId && this.visitStartTime) {
      const duration = Math.floor((Date.now() - this.visitStartTime) / 1000);
      this.visitService.updateVisitDuration(this.deviceId, this.sessionId, duration).subscribe();
    }

    // Clear interval
    if (this.visitDurationInterval) {
      clearInterval(this.visitDurationInterval);
    }

    this.destroy$.next();
    this.destroy$.complete();
  }
} 