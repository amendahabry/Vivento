import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PhotoUploadResponse {
  success: boolean;
  message: string;
  data?: {
    photoId: number;
    s3Key: string;
  };
}

export interface Photo {
  id: number;
  guest_name: string;
  device_id: string;
  file_id: string;
  presignedUrl?: string;
  expiresIn?: number;
  uploaded_at: string;
}

export interface EventPhotosResponse {
  success: boolean;
  data: Photo[];
}

export interface AlbumStatsResponse {
  success: boolean;
  data: {
    eventId: string;
    totalPhotos: number;
    totalSize: number;
    averageSize: number;
    databasePhotoCount: number;
    s3PhotoCount: number;
    syncStatus: 'synced' | 'out_of_sync';
  };
}

@Injectable({
  providedIn: 'root'
})
export class PhotoService {

  constructor(private http: HttpClient) { }

  uploadPhoto(
    file: File | Blob,
    eventId: string,
    guestName: string,
    deviceId: string
  ): Observable<PhotoUploadResponse> {
    const formData = new FormData();
    formData.append('photo', file, 'photo.jpg');
    formData.append('eventId', eventId);
    formData.append('guestName', guestName);
    formData.append('deviceId', deviceId);

    return this.http.post<PhotoUploadResponse>(`${environment.apiUrl}/photos/upload`, formData);
  }

  getEventPhotos(eventId: string): Observable<EventPhotosResponse> {
    return this.http.get<EventPhotosResponse>(`${environment.apiUrl}/photos/event/${eventId}`);
  }

  getUserEventPhotos(eventId: string, deviceId: string): Observable<EventPhotosResponse> {
    return this.http.get<EventPhotosResponse>(`${environment.apiUrl}/photos/user/${eventId}/${deviceId}`);
  }

  getEventAlbumStats(eventId: string): Observable<AlbumStatsResponse> {
    return this.http.get<AlbumStatsResponse>(`${environment.apiUrl}/photos/event/${eventId}/stats`);
  }

  deletePhoto(photoId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${environment.apiUrl}/photos/${photoId}`);
  }

  getPresignedPhotoUrl(photoId: number): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${environment.apiUrl}/photos/${photoId}/presigned`);
  }
} 