import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PhotoService, Photo } from '../../core/services/photo.service';
import { EventService, Event as EventData } from '../../core/services/event.service';
import { TranslationService, TranslationKeys, Language } from '../../core/services/translation.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VisitService } from '../../core/services/visit.service';

@Component({
  selector: 'app-upload-photo',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, ReactiveFormsModule, MatProgressSpinnerModule],
  templateUrl: './upload-photo.component.html',
  styleUrls: ['./upload-photo.component.scss']
})
export class UploadPhotoComponent implements OnInit, OnDestroy {

  eventId: string = '';
  loading: boolean = true;
  error: boolean = false;
  checking: boolean = true;
  eventValid: boolean = false;
  eventData: EventData | null = null;

  translations: TranslationKeys;
  currentLang: Language = 'en';

  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement', { static: false }) canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  guestName: string = '';
  usingFrontCamera: boolean = false;
  isCameraActive: boolean = false;
  isUploading: boolean = false;
  uploadProgress: number = 0;
  showSuccess: boolean = false;
  showError: boolean = false;
  errorMessage: string = '';

  stream: MediaStream | null = null;

  // Gallery properties
  showGallery: boolean = false;
  userPhotos: Photo[] = [];
  loadingPhotos: boolean = false;
  selectedPhoto: Photo | null = null;
  showPhotoModal: boolean = false;

  // Add a map to store pre-signed URLs by photo ID
  photoPresignedUrls: { [photoId: number]: string } = {};

  // Add form group for guest name and file
  uploadForm!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private photoService: PhotoService,
    private eventService: EventService,
    private translationService: TranslationService,
    private cdr: ChangeDetectorRef,
    private visitService: VisitService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.translations = this.translationService.getAll();
    this.currentLang = this.translationService.getCurrentLanguage();
  }

  ngOnInit(): void {
    this.uploadForm = this.fb.group({
      guestName: [{ value: '', disabled: this.isUploading == true ? true : false }, Validators.required],
      file: [{ value: '', disabled: this.isUploading == true ? true : false }, null],
    });
    this.route.params.subscribe(params => {
      this.eventId = params['id'] || 'default';
      if (this.eventId === 'default') {
        this.error = true;
        this.checking = false;
        return;
      }

      this.checkeventValidity(this.eventId);
    });

    const savedLang = localStorage.getItem('lang') as Language;
    if (savedLang && ['en', 'he', 'ar'].includes(savedLang)) {
      this.setLanguage(savedLang);
    }
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  checkeventValidity(eventId: string) {
    this.eventService.validateEvent(eventId).subscribe({
      next: (response) => {
        if (response.success && response.data.isValid) {
          this.eventValid = true;
          this.eventData = response.data;
          this.checking = false;
          setTimeout(() => {
            this.loading = false;
            this.loadLanguage(eventId);
            this.cdr.detectChanges();
          }, 1500);
        } else {
          this.error = true;
          this.checking = false;
          setTimeout(() => {
            this.loading = false;
            this.cdr.detectChanges();
          }, 1500);
        }
      },
      error: (err) => {
        console.error('Event validation error:', err);
        this.error = true;
        this.checking = false;
        setTimeout(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }, 1500);
      }
    });
  }

  loadLanguage(eventId: string) {
    // For now, default to English
    // In a real implementation, you would fetch language from your database
    // this.setLanguage(lang);
  }

  setLanguage(lang: Language) {
    this.currentLang = lang;
    this.translationService.setLanguage(lang);
    this.translations = this.translationService.getAll();
  }

  formatEventDate(date: string | Date): string {
    return this.translationService.formatDate(date);
  }
  startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.showErrorMessage(this.translations.cameraNotSupported);
      return;
    }

    const facingMode = this.usingFrontCamera ? "user" : "environment";

    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode,
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    })
      .then((stream) => {
        this.stream = stream;
        this.isCameraActive = true;

        if (this.videoElement && this.videoElement.nativeElement) {
          this.videoElement.nativeElement.srcObject = stream;
          this.videoElement.nativeElement.play();
        }
        this.cdr.detectChanges();
      })
      .catch(err => {
        console.error('Camera error:', err);
        this.showErrorMessage(this.translations.unableToAccessCamera);
      });
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
      this.isCameraActive = false;
    }
  }

  switchCamera() {
    this.stopCamera();
    this.usingFrontCamera = !this.usingFrontCamera;
    setTimeout(() => this.startCamera(), 100);
  }

  takePhoto() {
    if (!this.videoElement || !this.canvasElement) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob and upload
    canvas.toBlob((blob) => {
      if (blob) {
        this.uploadPhoto(blob);
      }
    }, 'image/jpeg', 0.9);
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        this.showErrorMessage(this.translations.fileSizeLimit);
        return;
      }
      this.uploadForm.get('file')?.setValue(file);
      this.uploadPhoto(file);
    }
  }

  uploadPhoto(file: File | Blob) {
    const guestName = this.uploadForm.get('guestName')?.value;
    if (!guestName?.trim()) {
      this.showErrorMessage(this.translations.pleaseEnterName);
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;
    this.showError = false;
    this.cdr.detectChanges();

    const formData = new FormData();
    formData.append('photo', file, 'photo.jpg');
    formData.append('eventId', this.eventId);
    formData.append('guestName', guestName.trim());
    formData.append('deviceId', this.getDeviceId());

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += Math.random() * 10;
      }
    }, 200);

    this.photoService.uploadPhoto(file, this.eventId, guestName.trim(), this.getDeviceId())
      .subscribe({
        next: (response) => {
          clearInterval(progressInterval);
          this.uploadProgress = 100;
          let that = this;
          setTimeout(() => {
            that.isUploading = false;
            that.showSuccess = true;
            that.generateConfetti();
            this.cdr.detectChanges();

            // Refresh gallery if it's currently shown
            if (that.showGallery) {
              that.loadUserPhotos();
            }

            // Reset after 3 seconds
            setTimeout(() => {
              that.showSuccess = false;
              that.uploadProgress = 0;
              that.cdr.detectChanges();
            }, 3000);
          }, 500);
        },
        error: (err: any) => {
          clearInterval(progressInterval);
          this.isUploading = false;
          console.error('Upload error:', err);
          this.showErrorMessage(this.translations.uploadFailed);
        }
      });
  }

  getDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId') || this.visitService.generateDeviceId();
    return deviceId;
  }

  showErrorMessage(message: string) {
    this.errorMessage = message;
    this.showError = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.showError = false;
      this.errorMessage = '';
      this.cdr.detectChanges();
    }, 5000);
  }

  generateConfetti() {
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement("div");
      confetti.classList.add("confetti");
      confetti.style.left = `${Math.random() * 100}vw`;
      confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 70%)`;
      confetti.style.animationDuration = `${Math.random() * 3 + 2}s`;
      document.body.appendChild(confetti);

      // Remove confetti after animation
      setTimeout(() => {
        if (confetti.parentNode) {
          confetti.parentNode.removeChild(confetti);
        }
      }, 5000);
    }
  }

  goHome() {
    this.router.navigate(['/']);
  }

  // Gallery methods
  toggleGallery() {
    this.showGallery = !this.showGallery;
    if (this.showGallery) {
      this.loadUserPhotos();
      this.stopCamera(); // Stop camera when switching to gallery
      // Clear any upload states
      this.isUploading = false;
      this.uploadProgress = 0;
      this.showSuccess = false;
      this.showError = false;
    }
  }

  loadUserPhotos() {
    this.loadingPhotos = true;
    const deviceId = this.getDeviceId();
    this.photoPresignedUrls = {}; // Reset
    this.photoService.getUserEventPhotos(this.eventId, deviceId).subscribe({
      next: (response) => {
        this.userPhotos = response.data;
        // For each photo, fetch its pre-signed URL
        for (const photo of this.userPhotos) {
          this.photoService.getPresignedPhotoUrl(photo.id).subscribe({
            next: (result) => {
              this.photoPresignedUrls[photo.id] = result.url;
              this.cdr.detectChanges();
            },
            error: () => {
              this.photoPresignedUrls[photo.id] = '';
            }
          });
        }
        this.loadingPhotos = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading photos:', err);
        this.loadingPhotos = false;
        this.showErrorMessage(this.translations.uploadFailed || 'Failed to load photos');
      }
    });
  }

  openPhotoModal(photo: Photo) {
    this.selectedPhoto = photo;
    this.showPhotoModal = true;
    // Fetch pre-signed URL for modal if not already fetched
    if (photo && !this.photoPresignedUrls[photo.id]) {
      this.photoService.getPresignedPhotoUrl(photo.id).subscribe({
        next: (result) => {
          this.photoPresignedUrls[photo.id] = result.url;
        },
        error: () => {
          this.photoPresignedUrls[photo.id] = '';
        }
      });
    }
  }

  closePhotoModal() {
    this.selectedPhoto = null;
    this.showPhotoModal = false;
    this.cdr.detectChanges();
  }

  deletePhoto(photo: Photo) {
    if (confirm(this.translations.deleteConfirm)) {
      this.photoService.deletePhoto(photo.id).subscribe({
        next: (response) => {
          if (response.success) {
            // Remove photo from the list
            this.userPhotos = this.userPhotos.filter(p => p.id !== photo.id);
            this.closePhotoModal();
          } else {
            this.showErrorMessage('Failed to delete photo');
          }
        },
        error: (err) => {
          console.error('Error deleting photo:', err);
          this.showErrorMessage('Failed to delete photo');
        }
      });
    }
  }

  formatPhotoDate(date: string): string {
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();
  }

  // Helper method to get photo URL with fallback
  getPhotoUrl(photo: Photo): string {
    return this.photoPresignedUrls[photo.id] || '';
  }

  // TrackBy function for ngFor optimization
  trackByPhotoId(photo: Photo): number {
    return photo.id;
  }
}
