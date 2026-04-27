import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface VisitData {
  deviceId?: string;
  userAgent?: string;
  language?: string;
  screenResolution?: string;
  timezone?: string;
  referrer?: string;
  pageUrl?: string;
  sessionId?: string;
}

export interface PageVisitData extends VisitData {
  pageName: string;
  pagePath: string;
  previousPage?: string;
  navigationType: 'navigate' | 'reload' | 'back_forward';
}

export interface VisitResponse {
  success: boolean;
  deviceId: string;
  visitId: number;
}

export interface VisitStats {
  total_visits: number;
  unique_devices: number;
  unique_ips: number;
  avg_duration: number;
  first_visit: string;
  last_visit: string;
}

@Injectable({
  providedIn: 'root'
})
export class VisitService {

  constructor(private http: HttpClient) { }

  trackVisit(visitData: VisitData): Observable<VisitResponse> {
    return this.http.post<VisitResponse>(`${environment.apiUrl}/visits/track`, visitData)
      .pipe(
        catchError(error => {
          console.error('Error tracking visit:', error);
          // Return a mock response if the backend is not available
          return of({
            success: false,
            deviceId: visitData.deviceId || this.generateDeviceId(),
            visitId: 0
          });
        })
      );
  }

  trackPageVisit(visitData: PageVisitData): Observable<VisitResponse> {
    return this.http.post<VisitResponse>(`${environment.apiUrl}/visits/track-page`, visitData)
      .pipe(
        catchError(error => {
          console.error('Error tracking page visit:', error);
          // Return a mock response if the backend is not available
          return of({
            success: false,
            deviceId: visitData.deviceId || this.generateDeviceId(),
            visitId: 0
          });
        })
      );
  }

  updateVisitDuration(deviceId: string, sessionId: string, duration: number): Observable<any> {
    return this.http.put(`${environment.apiUrl}/visits/duration`, {
      deviceId,
      sessionId,
      duration
    }).pipe(
      catchError(error => {
        console.error('Error updating visit duration:', error);
        return of({ success: false });
      })
    );
  }

  getVisitStats(startDate?: string, endDate?: string, deviceId?: string): Observable<VisitStats> {
    let params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (deviceId) params.deviceId = deviceId;

    return this.http.get<VisitStats>(`${environment.apiUrl}/visits/stats`, { params })
      .pipe(
        catchError(error => {
          console.error('Error getting visit stats:', error);
          return of({
            total_visits: 0,
            unique_devices: 0,
            unique_ips: 0,
            avg_duration: 0,
            first_visit: '',
            last_visit: ''
          });
        })
      );
  }

  getRecentVisits(limit: number = 50, offset: number = 0): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/visits/recent`, {
      params: { limit: limit.toString(), offset: offset.toString() }
    }).pipe(
      catchError(error => {
        console.error('Error getting recent visits:', error);
        return of([]);
      })
    );
  }

  // Helper method to generate device ID
  generateDeviceId(): string {
    const userAgent = navigator.userAgent;
    const screenRes = `${screen.width}x${screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    
    // Create a unique device fingerprint
    const fingerprint = `${userAgent}-${screenRes}-${timezone}-${language}-${Date.now()}`;
    return this.hashString(fingerprint).substring(0, 16);
  }

  // Helper method to get screen resolution
  getScreenResolution(): string {
    return `${screen.width}x${screen.height}`;
  }

  // Helper method to get timezone
  getTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  // Helper method to get language
  getLanguage(): string {
    return navigator.language;
  }

  // Helper method to get user agent
  getUserAgent(): string {
    return navigator.userAgent;
  }

  // Simple hash function
  private hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }
} 