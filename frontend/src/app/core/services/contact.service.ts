import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ContactData {
  name: string;
  phone: string;
  email: string;
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {

  constructor(private http: HttpClient) { }

  submitContact(contactData: ContactData): Observable<any> {
    const lang = (localStorage.getItem('language') || localStorage.getItem('lang') || navigator.language || 'ar').split('-')[0];
    return this.http.post(`${environment.apiUrl}/contact/submit`, { ...contactData, lang });
  }
} 