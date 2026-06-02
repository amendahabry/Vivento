import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RsvpService } from '../../core/services/rsvp.service';
import { Subject, timer } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rsvp',
  standalone: true,
  templateUrl: './rsvp.component.html',
  styleUrls: ['./rsvp.component.scss'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class RsvpComponent implements OnInit, OnDestroy {
  eventId!: string;
  event: any;
  isLoading = true;
  isSubmitted = false;
  currentLanguage = localStorage.getItem('lang') || navigator.language ? navigator.language.slice(0, 2) : 'en';
  showGuestsField = false;
  destroy$ = new Subject<void>();

  rsvpForm!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private rsvpService: RsvpService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    this.initForm();
    this.loadEvent();
  }

  initForm(): void {
    this.rsvpForm = this.fb.group({
      eventId: [this.eventId, Validators.required],
      name: ['', Validators.required],
      phone: ['', Validators.required],
      status: ['', Validators.required],
      guests: ['1', null]
    });

    this.rsvpForm.get('status')?.valueChanges.subscribe((value) => {
      this.showGuestsField = value === 'coming';
    });
  }

  loadEvent(): void {
    this.isLoading = true;
    this.rsvpService.getEvent(this.eventId).subscribe({
      next: (event) => {
        this.event = event;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading event:', error);
        this.event = null;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (this.rsvpForm.invalid) return;

    const formData = this.rsvpForm.value;
    // You may send `formData` to backend or handle as needed
    console.log('Form submitted:', formData);
    this.rsvpService.submitRsvp(formData).subscribe({
      next: (event) => {
        this.isSubmitted = true;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading event:', error);
        this.cdr.detectChanges();
      }
    })
  }

  setLanguage(lang: string): void {
    this.currentLanguage = lang;
    // update translations if needed
    localStorage.setItem('lang', lang);
  }

  retry(): void {
    this.isLoading = true;
    this.loadEvent();
  }

  getTranslation(key: string): string {
    // Replace with actual translation logic
    const translations: any = {
      checkMessage: { en: 'Checking event', he: 'בודק אירוע', ar: 'جارٍ التحقق من المناسبه' },
      error: { en: 'Event not found', he: 'האירוע לא נמצא', ar: 'لم يتم العثور على المناسبه' },
      retry: { en: 'Retry', he: 'נסה שוב', ar: 'أعد المحاولة' },
      invite: { en: 'You are invited!', he: 'אתה מוזמן!', ar: 'أنت مدعو!' },
      name: { en: 'Name', he: 'שם', ar: 'الاسم' },
      phone: { en: 'Phone', he: 'טלפון', ar: 'الهاتف' },
      statusLabel: { en: 'Will you attend?', he: 'האם תגיע?', ar: 'هل ستحضر؟' },
      optionYes: { en: 'Yes, I will attend', he: 'כן, ברור', ar: 'نعم, سأحضر' },
      optionNo: { en: 'No, I will not attend', he: 'לא, איני יכול', ar: 'لا, لن استطيع' },
      guests: { en: 'Number of guests', he: 'מספר אורחים', ar: 'عدد الضيوف' },
      submit: { en: 'Submit', he: 'אישור', ar: 'إرسال' },
      thanks: { en: 'Thank you for your RSVP!', he: 'תודה על האישור', ar: 'شكرًا لتأكيدك' },
      location: { en: 'Event Location', he: 'מיקום האירוע', ar: 'موقع المناسبه' },
      note: { en: 'Note', he: 'הערה', ar: 'ملاحظه' },
      rsvp: { en: 'Confirm Attendance', he: 'אישור הגעה', ar: 'تأكيد الحضور' }
    };
    return translations[key]?.[this.currentLanguage] || key;
  }

  private isValidUrl(url: string): boolean {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  openGoogleMaps(): void {
    if (this.event?.google_maps_url && this.isValidUrl(this.event.google_maps_url)) {
      window.open(this.event.google_maps_url, '_blank', 'noopener,noreferrer');
    } else {
      console.error('Invalid Google Maps URL');
    }
  }

  openWaze(): void {
    if (this.event?.waze_url && this.isValidUrl(this.event.waze_url)) {
      window.open(this.event.waze_url, '_blank', 'noopener,noreferrer');
    } else {
      console.error('Invalid Waze URL');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
