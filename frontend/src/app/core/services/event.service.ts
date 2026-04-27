import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Event {
  id: string;
  name: string;
  date: string;
  location_address: string;
  latitude: number;
  longitude: number;
  google_maps_url: string;
  waze_url: string;
}

export interface EventValidationResponse {
  success: boolean;
  data: Event & {
    isValid: boolean;
  };
}

export interface EventResponse {
  success: boolean;
  data: Event;
}

export interface EventsResponse {
  success: boolean;
  data: Event[];
}

@Injectable({
  providedIn: 'root'
})
export class EventService {

  constructor(private http: HttpClient) { }

  validateEvent(eventId: string): Observable<EventValidationResponse> {
    return this.http.get<EventValidationResponse>(`${environment.apiUrl}/events/validate/${eventId}`);
  }

  getEvent(eventId: string): Observable<EventResponse> {
    return this.http.get<EventResponse>(`${environment.apiUrl}/events/${eventId}`);
  }

  getAllEvents(): Observable<EventsResponse> {
    return this.http.get<EventsResponse>(`${environment.apiUrl}/events`);
  }
} 