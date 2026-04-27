import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Event {
  id: string;
  name: string;
  date: string;
  location_address: string;
  google_maps_url: string;
  waze_url: string;
}

export interface RsvpData {
  eventId: string;
  name: string;
  phone: string;
  status: 'coming' | 'not_coming';
  guests: string;
}

@Injectable({
  providedIn: 'root'
})
export class RsvpService {

  constructor(private http: HttpClient) { }

  getEvent(eventId: string): Observable<Event> {
    // Call backend API to get event details by ID
    return this.http.get<Event>(`${environment.apiUrl}/events/${eventId}`);
  }

  submitRsvp(rsvpData: RsvpData): Observable<any> {
    // Send selected language alongside the RSVP
    const lang = (localStorage.getItem('language') || localStorage.getItem('lang') || navigator.language || 'ar').split('-')[0];
    return this.http.post(`${environment.apiUrl}/rsvp/submit_response`, { ...rsvpData, lang });
  }

  getRsvps(eventId?: string): Observable<any[]> {
    const url = eventId ? `${environment.apiUrl}?eventId=${eventId}` : environment.apiUrl;
    return this.http.get<any[]>(url);
  }

  getEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${environment.apiUrl}/events`);
  }

  addEvent(event: Event): Observable<any> {
    return this.http.post(`${environment.apiUrl}/events`, event);
  }
}
