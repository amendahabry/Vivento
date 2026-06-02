import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver-es';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PhotoService } from '../../core/services/photo.service';
import { forkJoin, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule, MatButtonModule, MatIconModule]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  event: any = null;
  responses: any[] = [];
  stats: any = null;
  isLoading: boolean = true;
  error: string = '';
  eventEdit: any = { name: '', date: '', time: '', location_address: '', latitude: '', longitude: '', note: '' };
  isSavingEvent: boolean = false;
  eventSaveMessage: string = '';
  selectedFile: File | null = null;
  sheetUrl: string = '';
  uploadStatus: string = '';
  uploadError: string = '';
  errorGuestList: any = [];
  eventIdCopyMessage: string = '';
  guests: any[] = [];
  // Selection state for guests
  selectedGuestIds: Set<number> = new Set<number>();
  allGuestsSelected: boolean = false;
  currentLanguage: string = 'en';
  guestSearchTerm: string = '';
  responseSearchTerm: string = '';
  minDate: string = '';
  selectedFileName: string = '';
  isAddingToQueue: boolean = false;
  queueMessage: string = '';
  templateMessage: string = '';

  // New properties for manual guest addition
  showManualGuestForm: boolean = false;
  newGuest: any = { guest_name: '', phone_number: '' };
  isAddingGuest: boolean = false;
  addGuestMessage: string = '';
  addGuestError: string = '';
  token = localStorage.getItem('auth_token');

  // New properties for invitation image
  selectedInvitationImage: File | null = null;
  invitationImageName: string = '';
  isUploadingImage: boolean = false;
  imageUploadMessage: string = '';
  imageUploadError: string = '';
  invitationImageUrl: any = '';
  invitationImageId: number | null = null;

  // Photo gallery properties
  photos: any[] = [];
  isLoadingPhotos: boolean = false;
  selectedPhoto: any = null;
  isDeletingPhoto: boolean = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private photoService: PhotoService,
    private router: Router) { }

  ngOnInit(): void {
    // Get language from localStorage, default to 'en'
    this.currentLanguage = localStorage.getItem('lang') || 'en';
    this.fetchDashboardData();
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    this.minDate = today.toISOString().split('T')[0];
  }

  getTranslation(key: string): string {
    const translations: any = {
      userDashboard: { en: 'User Dashboard', he: 'מסך ניהול', ar: 'لوحة التحكم' },
      loading: { en: 'Loading...', he: 'טוען...', ar: 'جاري التحميل...' },
      notAuthenticated: { en: 'Not authenticated.', he: 'לא מאומת.', ar: 'غير مصادق عليه.' },
      signIn: { en: 'Sign in', he: 'התחבר', ar: 'تسجيل الدخول' },
      failedToLoad: { en: 'Failed to load dashboard data.', he: 'נכשל בטעינת נתוני מסך הניהול.', ar: 'فشل في تحميل بيانات لوحة التحكم.' },
      eventDetails: { en: 'Event Details', he: 'פרטי האירוע', ar: 'تفاصيل المناسبه' },
      copyEventId: { en: 'Copy Event Url', he: 'העתק קישור לאירוע', ar: 'نسخ رابط المناسبه' },
      eventIdCopied: { en: 'Event Url copied!', he: 'קישור האירוע הועתק!', ar: 'تم نسخ رابط المناسبه!' },
      failedToCopy: { en: 'Failed to copy Event Url.', he: 'נכשל בהעתקת קישור האירוע.', ar: 'فشل في نسخ رابط المناسبه.' },
      name: { en: 'Name', he: 'שם', ar: 'الاسم' },
      date: { en: 'Date', he: 'תאריך', ar: 'التاريخ' },
      time: { en: 'Time', he: 'שעה', ar: 'الساعه' },
      location: { en: 'Location (like in google/waze)', he: ' מיקום (כפי שזה רשום בגוגל/וויז)', ar: 'كما كتب في جوجل/ويز' },
      note: { en: 'Note', he: 'הערה', ar: 'ملاحظه' },
      saving: { en: 'Saving...', he: 'שומר...', ar: 'جاري الحفظ...' },
      save: { en: 'Save', he: 'שמור', ar: 'حفظ' },
      eventUpdated: { en: 'Event updated successfully!', he: 'האירוע עודכן בהצלחה!', ar: 'تم تحديث المناسبه بنجاح!' },
      failedToUpdate: { en: 'Failed to update event.', he: 'נכשל בעדכון האירוע.', ar: 'فشل في تحديث المناسبه.' },
      noEventFound: { en: 'No event found.', he: 'לא נמצא אירוע.', ar: 'لم يتم العثور على المناسبه.' },
      statistics: { en: 'Statistics', he: 'סטטיסטיקות', ar: 'الإحصائيات' },
      totalGuests: { en: 'Total Invites:', he: 'סך הכל מוזמנים:', ar: 'إجمالي المدعويين:' },
      coming: { en: 'Coming:', he: 'באים:', ar: 'قادمين:' },
      notComing: { en: 'Not Coming:', he: 'לא באים:', ar: 'غير قادمين:' },
      rsvpRate: { en: 'RSVP Rate:', he: 'אחוז אישור:', ar: 'معدل التأكيد:' },
      noStatsAvailable: { en: 'No statistics available.', he: 'אין סטטיסטיקות זמינות.', ar: 'لا توجد إحصائيات متاحة.' },
      uploadGuestList: { en: 'Upload Guest List', he: 'העלה רשימת אורחים', ar: 'تحميل قائمة الضيوف' },
      downloadExcelOrCsv: { en: 'Download CSV template', he: 'הורדת טמפלט CSV', ar: 'تنزيل مثال لملف CSV' },
      uploadExcelOrCsv: { en: 'Upload Excel or CSV file', he: 'העלה קובץ Excel או CSV', ar: 'تحميل ملف Excel أو CSV' },
      or: { en: 'or', he: 'או', ar: 'أو' },
      openGoogleSheet: { en: 'Open Google Sheet', he: 'פתח Google Sheet', ar: 'افتح Google Sheet' },
      googleSheetLink: { en: 'Google Sheet link', he: 'קישור ל Google Sheet', ar: 'رابط Google Sheet' },
      upload: { en: 'Upload', he: 'העלה', ar: 'تحميل' },
      uploading: { en: 'Uploading...', he: 'מעלה...', ar: 'جاري التحميل...' },
      noEventLoaded: { en: 'No event loaded.', he: 'לא נטען אירוע.', ar: 'لم يتم تحميل المناسبه.' },
      selectFileOrLink: { en: 'Please select a file or enter a Google Sheet link.', he: 'אנא בחר קובץ או הזן קישור לגיליון Google.', ar: 'يرجى تحديد ملف أو إدخال رابط جدول بيانات Google.' },
      guestListUploaded: { en: 'Guest list uploaded successfully!', he: 'רשימת האורחים הועלתה בהצלחה!', ar: 'تم تحميل قائمة الضيوف بنجاح!' },
      failedToUpload: { en: 'Failed to upload guest list.', he: 'נכשל בהעלאת רשימת האורחים.', ar: 'فشل في تحميل قائمة الضيوف.' },
      guestResponseList: { en: 'Guest Response List', he: 'רשימת תגובות אורחים', ar: 'قائمة ردود الضيوف' },
      noGuestsFound: { en: 'No guests found.', he: 'לא נמצאו אורחים.', ar: 'لم يتم العثور على ضيوف.' },
      exportToExcel: { en: 'Export to Excel', he: 'ייצא ל-Excel', ar: 'تنزيل إلى Excel' },
      guestList: { en: 'Guest List', he: 'רשימת אורחים', ar: 'قائمة الضيوف' },
      GuestName: { en: 'GuestName', he: 'שם אורח', ar: 'اسم الضيف' },
      PhoneNumber: { en: 'PhoneNumber', he: 'מספר טלפון', ar: 'رقم الهاتف' },
      Status: { en: 'Sent', he: 'נשלח', ar: 'أرسل' },
      home: { en: 'Home', he: 'בית', ar: 'الرئيسية' },
      searchGuests: { en: 'Search guests...', he: 'חפש אורחים...', ar: 'البحث عن الضيوف...' },
      searchResponses: { en: 'Search responses...', he: 'חפש תגובות...', ar: 'البحث في الردود...' },
      addToMessagingQueue: { en: 'Send invites', he: 'שלח הזמנות', ar: 'أرسل دعوات' },
      addingToQueue: { en: 'Adding to queue...', he: 'מוסיף לתור...', ar: 'جاري الإضافة إلى القائمة...' },
      guestsAddedToQueue: { en: 'Sent to guests successfully!', he: 'נשלח לאורחים בהצלחה!', ar: 'تم الارسال بنجاح!' },
      failedToAddToQueue: { en: 'Failed to send messages.', he: 'נכשל בשליחת ההודעות.', ar: 'فشل في ارسال الرسائل.' },
      noGuestsToAdd: { en: 'No guests to send.', he: 'אין אורחים לשליחת הודעות.', ar: 'لا توجد ضيوف لارسال الرسائل.' },
      selectGuestsToSend: { en: 'Select guests to send invitations', he: 'בחר אורחים לשליחת הזמנות', ar: 'اختر الضيوف لإرسال الدعوات' },
      selectGuestsFirst: { en: 'Select Guests First', he: 'בחר אורחים תחילה', ar: 'اختر الضيوف أولاً' },
      guestsSelected: { en: 'guests selected', he: 'אורחים נבחרו', ar: 'ضيوف محددين' },
      // New translations for manual guest addition
      addGuestManually: { en: 'Add Guest Manually', he: 'הוסף אורח ידנית', ar: 'أضف ضيف يدوياً' },
      guestName: { en: 'Guest Name', he: 'שם האורח', ar: 'اسم الضيف' },
      phoneNumber: { en: 'Phone Number', he: 'מספר טלפון', ar: 'رقم الهاتف' },
      addGuest: { en: 'Add Guest', he: 'הוסף אורח', ar: 'أضف ضيف' },
      addingGuest: { en: 'Adding Guest...', he: 'מוסיף אורח...', ar: 'جاري إضافة الضيف...' },
      guestAddedSuccessfully: { en: 'Guest added successfully!', he: 'האורח נוסף בהצלחה!', ar: 'تم إضافة الضيف بنجاح!' },
      failedToAddGuest: { en: 'Failed to add guest.', he: 'נכשל בהוספת האורח.', ar: 'فشل في إضافة الضيف.' },
      guestNameRequired: { en: 'Guest name is required.', he: 'שם האורח נדרש.', ar: 'اسم الضيف مطلوب.' },
      phoneNumberRequired: { en: 'Phone number is required.', he: 'מספר הטלפון נדרש.', ar: 'رقم الهاتف مطلوب.' },
      cancel: { en: 'Cancel', he: 'ביטול', ar: 'إلغاء' },
      showManualForm: { en: 'Add Guest Manually', he: 'הוסף אורח ידנית', ar: 'أضف ضيف يدوياً' },
      hideManualForm: { en: 'Hide Form', he: 'הסתר טופס', ar: 'إخفاء النموذج' },
      // Deletion translations
      delete: { en: 'Delete', he: 'מחק', ar: 'حذف' },
      deleteSelected: { en: 'Delete Selected', he: 'מחק נבחרים', ar: 'حذف المحددين' },
      selectAll: { en: 'Select All', he: 'בחר הכל', ar: 'تحديد الكل' },
      deselectAll: { en: 'Deselect All', he: 'בטל בחירה', ar: 'إلغاء التحديد' },
      confirmDeleteOne: { en: 'Delete this guest?', he: 'למחוק אורח זה?', ar: 'حذف هذا الضيف؟' },
      confirmDeleteMany: { en: 'Delete selected guests?', he: 'למחוק את האורחים שנבחרו?', ar: 'حذف الضيوف المحددين؟' },
      failedToDelete: { en: 'Failed to delete.', he: 'מחיקה נכשלה.', ar: 'فشل الحذف.' },
      deletedSuccessfully: { en: 'Deleted successfully.', he: 'נמחק בהצלחה.', ar: 'تم الحذف بنجاح.' },
      // URL generation translations
      generatedUrls: { en: 'Generated URLs', he: 'קישורים שנוצרו', ar: 'الروابط المُنشأة' },
      googleMaps: { en: 'Google Maps', he: 'גוגל מפות', ar: 'خرائط جوجل' },
      waze: { en: 'Waze', he: 'וויז', ar: 'ويز' },
      openInGoogleMaps: { en: 'Open in Google Maps', he: 'פתח בגוגל מפות', ar: 'افتح في خرائط جوجل' },
      openInWaze: { en: 'Open in Waze', he: 'פתח בוויז', ar: 'افتح في ويز' },
      savedUrls: { en: 'Saved URLs', he: 'קישורים שמורים', ar: 'الروابط المحفوظة' },
      latitude: { en: 'Latitude', he: 'קו רוחב', ar: 'خط العرض' },
      longitude: { en: 'Longitude', he: 'קו אורך', ar: 'خط الطول' },
      generatedUrlsFromAddress: { en: 'Generated URLs from Address', he: 'קישורים שנוצרו מכתובת', ar: 'الروابط المُنشأة من العنوان' },
      getCoordinatesFromAddress: { en: 'Get Coordinates from Address', he: 'קבל קואורדינטות מכתובת', ar: 'احصل على الإحداثيات من العنوان' },
      coordinateHelpText: { en: 'Click to automatically get coordinates from the address above', he: 'לחץ כדי לקבל קואורדינטות אוטומטית מהכתובת למעלה', ar: 'انقر للحصول على الإحداثيات تلقائياً من العنوان أعلاه' },
      gettingCoordinates: { en: 'Getting coordinates...', he: 'מקבל קואורדינטות...', ar: 'جاري الحصول على الإحداثيات...' },
      coordinatesFound: { en: 'Coordinates found!', he: 'נמצאו קואורדינטות!', ar: 'تم العثور على الإحداثيات!' },
      coordinatesNotFound: { en: 'Could not find coordinates for this address', he: 'לא ניתן למצוא קואורדינטות לכתובת זו', ar: 'لا يمكن العثور على إحداثيات لهذا العنوان' },
      // Photo gallery translations
      eventPhotos: { en: 'Event Photos', he: 'תמונות האירוע', ar: 'صور المناسبه' },
      photos: { en: 'photos', he: 'תמונות', ar: 'صور' },
      loadingPhotos: { en: 'Loading photos...', he: 'טוען תמונות...', ar: 'جاري تحميل الصور...' },
      refreshPhotos: { en: 'Refresh Photos', he: 'רענן תמונות', ar: 'تحديث الصور' },
      noPhotosYet: { en: 'No photos yet', he: 'אין תמונות עדיין', ar: 'لا توجد صور بعد' },
      photosWillAppearHere: { en: 'Photos uploaded by guests will appear here', he: 'תמונות שהועלו על ידי אורחים יופיעו כאן', ar: 'ستظهر الصور التي يرفعها الضيوف هنا' },
      uploadedBy: { en: 'Uploaded by', he: 'הועלה על ידי', ar: 'تم الرفع بواسطة' },
      uploadDate: { en: 'Upload date', he: 'תאריך העלאה', ar: 'تاريخ الرفع' },
      deviceId: { en: 'Device ID', he: 'מזהה מכשיר', ar: 'معرف الجهاز' },
      deletePhoto: { en: 'Delete Photo', he: 'מחק תמונה', ar: 'حذف الصورة' },
      deleting: { en: 'Deleting...', he: 'מוחק...', ar: 'جاري الحذف...' },
      photoDeleted: { en: 'Photo deleted successfully', he: 'התמונה נמחקה בהצלחה', ar: 'تم حذف الصورة بنجاح' },
      failedToDeletePhoto: { en: 'Failed to delete photo', he: 'נכשל במחיקת התמונה', ar: 'فشل في حذف الصورة' }
    };
    return translations[key]?.[this.currentLanguage] || key;
  }

  fetchDashboardData(): void {
    this.isLoading = true;
    this.error = '';
    if (!this.token) {
      this.error = this.getTranslation('notAuthenticated');
      this.isLoading = false;
      this.router.navigate(['/signin']);
      return;
    }
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.token}` });

    forkJoin({
      event: this.http.get(`${environment.apiUrl}/dashboard/event`, { headers }),
      responses: this.http.get(`${environment.apiUrl}/dashboard/responses`, { headers }),
      guests: this.http.get(`${environment.apiUrl}/dashboard/guests`, { headers }),
      stats: this.http.get(`${environment.apiUrl}/dashboard/stats`, { headers }),
      events: this.http.get(`${environment.apiUrl}/events`, { headers })
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data: any) => {
        this.event = data.event;
        this.responses = data.responses as any[];
        this.guests = data.guests as any[];
        this.stats = data.stats;
        this.isLoading = false;
        if (this.event) {
          this.eventEdit = {
            name: this.event.name || '',
            date: this.event.date || '',
            time: this.event.time || '',
            location_address: this.event.location_address || '',
            latitude: this.event.latitude || '',
            longitude: this.event.longitude || '',
            google_maps_url: this.event.google_maps_url || '',
            waze_url: this.event.waze_url || '',
            note: this.event.note || ''
          };

          // Load invitation image information
          this.getPreSignedUrls(this.event);
          this.invitationImageName = this.event.invitation_image_name || '';

          // Load event photos
          this.loadEventPhotos();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.message || this.getTranslation('failedToLoad');
        this.isLoading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/signin']);
      }
    });
  }

  getPreSignedUrls(event: any): void {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.token}` });
    this.http.get(`${environment.apiUrl}/photos/${event.invitation_image_id}/presignedForInvitations`, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.invitationImageUrl = res.url;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err.error?.message;
          this.cdr.detectChanges();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveEventDetails(): void {
    if (!this.event || !this.event.id) return;
    this.isSavingEvent = true;
    this.eventSaveMessage = '';

    // Generate Google Maps and Waze URLs from coordinates
    const googleMapsUrl = this.generateGoogleMapsUrlFromCoordinates(this.eventEdit.latitude, this.eventEdit.longitude);
    const wazeUrl = this.generateWazeUrlFromCoordinates(this.eventEdit.latitude, this.eventEdit.longitude);

    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    const body = {
      name: this.eventEdit.name,
      date: this.eventEdit.date,
      time: this.eventEdit.time,
      location_address: this.eventEdit.location_address,
      latitude: this.eventEdit.latitude,
      longitude: this.eventEdit.longitude,
      google_maps_url: googleMapsUrl,
      waze_url: wazeUrl,
      note: this.eventEdit.note
    };
    this.http.put(`${environment.apiUrl}/events/update/${this.event.id}`, body, { headers }).subscribe({
      next: (res: any) => {
        this.eventSaveMessage = this.getTranslation('eventUpdated');
        this.isSavingEvent = false;
        // Optionally update the main event object
        this.event = { ...this.event, ...body };
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.eventSaveMessage = err.error?.message || this.getTranslation('failedToUpdate');
        this.isSavingEvent = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Generate Google Maps URL from coordinates
  public generateGoogleMapsUrlFromCoordinates(latitude: string, longitude: string): string {
    if (!latitude || !longitude || latitude === '' || longitude === '') return '';
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) return '';

    return `https://www.google.com/maps?q=${lng},${lat}`;
  }

  // Generate Waze URL from coordinates
  public generateWazeUrlFromCoordinates(latitude: string, longitude: string): string {
    if (!latitude || !longitude || latitude === '' || longitude === '') return '';
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) return '';

    return `https://waze.com/ul?ll=${lng},${lat}&navigate=yes`;
  }

  // Get coordinates from address using geocoding
  public async getCoordinatesFromAddress(): Promise<void> {
    if (!this.eventEdit.location_address || this.eventEdit.location_address.trim() === '') {
      return;
    }

    const address = this.eventEdit.location_address.trim();

    try {
      // Use OpenStreetMap Nominatim API (free and no API key required)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        this.eventEdit.latitude = result.lat;
        this.eventEdit.longitude = result.lon;

        // Show success message
        this.eventSaveMessage = this.getTranslation('coordinatesFound');
        setTimeout(() => {
          this.eventSaveMessage = '';
          this.cdr.detectChanges();
        }, 3000);

        this.cdr.detectChanges();
      } else {
        this.eventSaveMessage = this.getTranslation('coordinatesNotFound');
        setTimeout(() => {
          this.eventSaveMessage = '';
          this.cdr.detectChanges();
        }, 3000);
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Error getting coordinates:', error);
      this.eventSaveMessage = this.getTranslation('coordinatesNotFound');
      setTimeout(() => {
        this.eventSaveMessage = '';
        this.cdr.detectChanges();
      }, 3000);
      this.cdr.detectChanges();
    }
  }

  onFileSelected(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
      this.selectedFileName = this.selectedFile?.name || '';
    }
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    this.selectedFileName = '';
    // Reset the file input field
    const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onSheetUrlChange(event: any): void {
    this.sheetUrl = event.target.value;
  }

  uploadGuestList(): void {
    if (!this.event || !this.event.id) {
      this.uploadError = this.getTranslation('noEventLoaded');
      return;
    }
    this.uploadStatus = this.getTranslation('uploading');
    this.uploadError = '';
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    const formData = new FormData();
    formData.append('event_id', this.event.id);
    formData.append('user_id', this.event.user_id);
    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    } else if (this.sheetUrl) {
      formData.append('sheet_url', this.sheetUrl);
    } else {
      this.uploadError = this.getTranslation('selectFileOrLink');
      this.uploadStatus = '';
      return;
    }
    this.http.post(`${environment.apiUrl}/events/guests/upload`, formData, { headers }).subscribe({
      next: (res: any) => {
        this.uploadStatus = this.getTranslation('guestListUploaded');
        this.uploadError = res.errors.length == 0 ? '' : 'Error';
        this.errorGuestList = res.errors;
        this.selectedFile = null;
        this.sheetUrl = '';
        this.getOnlyGuestsList();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.uploadStatus = '';
        this.uploadError = err.error?.error || this.getTranslation('failedToUpload');
        this.cdr.detectChanges();
      }
    });
  }

  shareEventId(): void {
    if (this.event && this.event.id) {
      const textToCopy = `https://viventoevents.com/event/${this.event.id.toString()}`;

      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          this.showCopySuccess();
        }).catch(() => {
          // Fallback to older method if modern API fails
          this.fallbackCopyTextToClipboard(textToCopy);
        });
      } else {
        // Use fallback method for older browsers or non-secure contexts
        this.fallbackCopyTextToClipboard(textToCopy);
      }
    }
  }

  private fallbackCopyTextToClipboard(text: string): void {
    try {
      // Create a temporary textarea element
      const textArea = document.createElement('textarea');
      textArea.value = text;

      // Make the element invisible
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';

      document.body.appendChild(textArea);

      // Focus and select the text
      textArea.focus();
      textArea.select();

      // Try to copy using document.execCommand
      const successful = document.execCommand('copy');

      // Clean up
      document.body.removeChild(textArea);

      if (successful) {
        this.showCopySuccess();
      } else {
        this.showCopyError();
      }
    } catch (err) {
      this.showCopyError();
    }
  }

  private showCopySuccess(): void {
    this.eventIdCopyMessage = this.getTranslation('eventIdCopied');
    setTimeout(() => {
      this.eventIdCopyMessage = '';
      this.cdr.detectChanges();
    }, 2000);
    this.cdr.detectChanges();
  }

  private showCopyError(): void {
    this.eventIdCopyMessage = this.getTranslation('failedToCopy');
    setTimeout(() => {
      this.eventIdCopyMessage = '';
      this.cdr.detectChanges();
    }, 2000);
    this.cdr.detectChanges();
  }

  signin(): void {
    this.router.navigate(['/signin']);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  exportToExcel(list: any): void {
    const worksheet = XLSX.utils.json_to_sheet(list);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Guests');

    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const data: Blob = new Blob([excelBuffer], {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });

    saveAs(data, 'guest_list.xlsx');
  }

  get filteredGuests(): any[] {
    if (!this.guestSearchTerm.trim()) {
      return this.guests;
    }
    const searchTerm = this.guestSearchTerm.toLowerCase();
    return this.guests.filter(guest =>
      guest.guest_name?.toLowerCase().includes(searchTerm) ||
      guest.phone_number?.toLowerCase().includes(searchTerm) ||
      guest.status?.toLowerCase().includes(searchTerm)
    );
  }

  // Selection helpers
  toggleSelectAll(): void {
    this.allGuestsSelected = !this.allGuestsSelected;
    this.selectedGuestIds.clear();
    if (this.allGuestsSelected) {
      this.filteredGuests.forEach(g => {
        // if (g.sent_at == '-')
          this.selectedGuestIds.add(g.id);
      });
    }
  }

  toggleGuestSelection(guestId: number, checked: boolean): void {
    if (checked) {
      this.selectedGuestIds.add(guestId);
    } else {
      this.selectedGuestIds.delete(guestId);
      this.allGuestsSelected = false;
    }
  }

  deleteSingleGuest(guest: any): void {
    if (!confirm(this.getTranslation('confirmDeleteOne'))) return;
    if (!this.event || !this.event.id) return;
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    const body = { id: guest.id, event_id: this.event.id };
    this.http.post(`${environment.apiUrl}/events/guests/delete`, body, { headers }).subscribe({
      next: () => {
        this.queueMessage = this.getTranslation('deletedSuccessfully');

        this.getOnlyGuestsList();

        this.cdr.detectChanges();
        setTimeout(() => { this.queueMessage = ''; this.cdr.detectChanges(); }, 2000);
      },
      error: (err) => {
        this.queueMessage = err.error?.error || this.getTranslation('failedToDelete');
        this.cdr.detectChanges();
        setTimeout(() => { this.queueMessage = ''; this.cdr.detectChanges(); }, 2000);
      }
    });
  }

  deleteSelectedGuests(): void {
    const ids = Array.from(this.selectedGuestIds);
    if (ids.length === 0) return;
    if (!confirm(this.getTranslation('confirmDeleteMany'))) return;
    if (!this.event || !this.event.id) return;
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    const body = { ids, event_id: this.event.id };
    this.http.post(`${environment.apiUrl}/events/guests/delete-bulk`, body, { headers }).subscribe({
      next: () => {
        this.queueMessage = this.getTranslation('deletedSuccessfully');
        this.selectedGuestIds.clear();
        this.allGuestsSelected = false;

        this.getOnlyGuestsList();

        this.cdr.detectChanges();
        setTimeout(() => { this.queueMessage = ''; this.cdr.detectChanges(); }, 2000);
      },
      error: (err) => {
        this.queueMessage = err.error?.error || this.getTranslation('failedToDelete');
        this.cdr.detectChanges();
        setTimeout(() => { this.queueMessage = ''; this.cdr.detectChanges(); }, 2000);
      }
    });
  }

  addGuestsToMessagingQueue(): void {
    // Check if any guests are selected
    if (this.selectedGuestIds.size === 0) {
      this.queueMessage = this.getTranslation('noGuestsToAdd');
      setTimeout(() => {
        this.queueMessage = '';
        this.cdr.detectChanges();
      }, 3000);
      return;
    }

    this.isAddingToQueue = true;
    this.queueMessage = '';
    const token = localStorage.getItem('auth_token');
    const lang = (localStorage.getItem('language') || localStorage.getItem('lang') || navigator.language || 'ar').split('-')[0];
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`, 'x-lang': lang });

    // Get the selected guest IDs
    const selectedGuestIds = Array.from(this.selectedGuestIds);

    // Send only the selected guest IDs to the backend
    this.http.post(`${environment.apiUrl}/dashboard/add-selected-guests-to-queue`, {
      selectedGuestIds: selectedGuestIds
    }, { headers }).subscribe({
      next: (res: any) => {
        this.queueMessage = res.message || this.getTranslation('guestsAddedToQueue');
        this.isAddingToQueue = false;

        // Clear selection after successful addition
        this.selectedGuestIds.clear();
        this.allGuestsSelected = false;

        this.getOnlyGuestsList();

        // Clear the message after 3 seconds
        setTimeout(() => {
          this.queueMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        this.queueMessage = err.error?.message || this.getTranslation('failedToAddToQueue');
        this.isAddingToQueue = false;
        this.cdr.detectChanges();

        // Clear the error message after 3 seconds
        setTimeout(() => {
          this.queueMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      }
    });
  }

  downloadCsvTemplate(): void {
    const headers = 'guest_name,phone_number\n';
    const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vivento_guests_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.templateMessage = 'CSV template downloaded.';
    setTimeout(() => { this.templateMessage = ''; this.cdr.detectChanges(); }, 2500);
  }

  async openGoogleSheetTemplate(): Promise<void> {
    try {
      const headers = 'guest_name,phone_number\n';
      await navigator.clipboard.writeText(headers);
      window.open('https://sheets.new', '_blank');
      this.templateMessage = 'Headers copied to clipboard. Paste into the new sheet.';
    } catch (err) {
      // Fallback: show message if clipboard API not available
      this.templateMessage = 'Open Sheets and paste: guest_name, phone_number';
    }
    this.cdr.detectChanges();
    setTimeout(() => { this.templateMessage = ''; this.cdr.detectChanges(); }, 4000);
  }

  get filteredResponses(): any[] {
    if (!this.responseSearchTerm.trim()) {
      return this.responses;
    }
    const searchTerm = this.responseSearchTerm.toLowerCase();
    return this.responses.filter(response =>
      response.guest_name?.toLowerCase().includes(searchTerm) ||
      response.status?.toLowerCase().includes(searchTerm)
    );
  }

  // New methods for manual guest addition
  toggleManualGuestForm(): void {
    this.showManualGuestForm = !this.showManualGuestForm;
    if (!this.showManualGuestForm) {
      this.resetNewGuestForm();
    }
  }

  resetNewGuestForm(): void {
    this.newGuest = { guest_name: '', phone_number: '' };
    this.addGuestMessage = '';
    this.addGuestError = '';
  }

  addGuestManually(): void {
    // Validate inputs
    if (!this.newGuest.guest_name?.trim()) {
      this.addGuestError = this.getTranslation('guestNameRequired');
      return;
    }

    if (!this.newGuest.phone_number?.trim()) {
      this.addGuestError = this.getTranslation('phoneNumberRequired');
      return;
    }

    if (!this.event || !this.event.id) {
      this.addGuestError = this.getTranslation('noEventLoaded');
      return;
    }

    this.isAddingGuest = true;
    this.addGuestError = '';
    this.addGuestMessage = '';

    // const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.token}` });

    const guestData = {
      event_id: this.event.id,
      user_id: this.event.user_id,
      guest_name: this.newGuest.guest_name.trim(),
      phone_number: this.newGuest.phone_number.trim()
    };

    this.http.post(`${environment.apiUrl}/events/guests/add`, guestData, { headers }).subscribe({
      next: (res: any) => {
        this.addGuestMessage = this.getTranslation('guestAddedSuccessfully');
        this.isAddingGuest = false;
        this.resetNewGuestForm();
        // this.fetchDashboardData(); // Refresh guest list
        this.cdr.detectChanges();

        this.getOnlyGuestsList();

        // Clear success message after 3 seconds
        setTimeout(() => {
          this.addGuestMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        this.addGuestError = err.error?.error || this.getTranslation('failedToAddGuest');
        this.isAddingGuest = false;
        this.cdr.detectChanges();
      }
    });
  }

  getOnlyGuestsList() {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.token}` });
    // Refresh the guest list to update the sent_at status
    Promise.all([
      this.http.get(`${environment.apiUrl}/dashboard/guests`, { headers }).toPromise(),
    ]).then(([guests]) => {
      this.guests = guests as any[];
      this.cdr.detectChanges();
    }).catch(err => {
      this.error = err.error?.message || this.getTranslation('failedToLoad');
      this.cdr.detectChanges();
    });
  }

  // Invitation image methods
  onInvitationImageSelected(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedInvitationImage = event.target.files[0];
      this.invitationImageName = this.selectedInvitationImage?.name || '';
      this.uploadInvitationImage();
    }
  }

  removeSelectedInvitationImage(): void {
    this.selectedInvitationImage = null;
    this.invitationImageName = '';
    // Reset the file input field
    const fileInput = document.getElementById('invitationImageUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  uploadInvitationImage(): void {
    if (!this.event || !this.event.id) {
      this.imageUploadError = this.getTranslation('noEventLoaded');
      return;
    }

    if (!this.selectedInvitationImage) {
      this.imageUploadError = 'Please select an image file.';
      return;
    }

    this.isUploadingImage = true;
    this.imageUploadMessage = '';
    this.imageUploadError = '';

    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    const formData = new FormData();
    formData.append('invitationImage', this.selectedInvitationImage);

    this.http.post(`${environment.apiUrl}/invitation-images/upload/${this.event.id}`, formData, { headers }).subscribe({
      next: (res: any) => {
        this.imageUploadMessage = res.message || 'Invitation image uploaded successfully!';
        this.invitationImageUrl = res.s3Url;
        this.invitationImageId = res.imageId;
        this.isUploadingImage = false;
        this.selectedInvitationImage = null;
        this.invitationImageName = '';

        // Refresh event data to get updated image info
        this.fetchDashboardData();

        this.cdr.detectChanges();

        // Clear the message after 3 seconds
        setTimeout(() => {
          this.imageUploadMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        this.imageUploadMessage = '';
        this.imageUploadError = err.error?.error || 'Failed to upload invitation image.';
        this.isUploadingImage = false;
        this.cdr.detectChanges();

        // Clear the error message after 3 seconds
        setTimeout(() => {
          this.imageUploadError = '';
          this.cdr.detectChanges();
        }, 3000);
      }
    });
  }

  deleteInvitationImage(): void {
    if (!this.event || !this.event.id) {
      return;
    }

    if (!confirm('Are you sure you want to delete this invitation image?')) {
      return;
    }

    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.delete(`${environment.apiUrl}/invitation-images/${this.event.id}`, { headers }).subscribe({
      next: (res: any) => {
        this.imageUploadMessage = res.message || 'Invitation image deleted successfully!';
        this.invitationImageUrl = '';
        this.invitationImageId = null;

        // Refresh event data
        this.fetchDashboardData();

        this.cdr.detectChanges();

        // Clear the message after 3 seconds
        setTimeout(() => {
          this.imageUploadMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        this.imageUploadError = err.error?.error || 'Failed to delete invitation image.';
        this.cdr.detectChanges();

        // Clear the error message after 3 seconds
        setTimeout(() => {
          this.imageUploadError = '';
          this.cdr.detectChanges();
        }, 3000);
      }
    });
  }

  // Photo gallery methods
  loadEventPhotos(): void {
    if (!this.event || !this.event.id) return;
    
    this.isLoadingPhotos = true;
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.token}` });
    
    this.http.get(`${environment.apiUrl}/photos/event/${this.event.id}`, { headers }).subscribe({
      next: (res: any) => {
        this.photos = res.data || [];
        this.isLoadingPhotos = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading photos:', err);
        this.photos = [];
        this.isLoadingPhotos = false;
        this.cdr.detectChanges();
      }
    });
  }

  openPhotoModal(photo: any): void {
    this.selectedPhoto = photo;
  }

  closePhotoModal(): void {
    this.selectedPhoto = null;
  }

  onPhotoError(event: any, photo: any): void {
    // Handle photo loading error
    console.error('Photo loading error:', event);
    photo.presignedUrl = null;
  }

  deletePhoto(photo: any): void {
    if (!confirm(this.getTranslation('confirmDeleteOne'))) return;
    
    this.isDeletingPhoto = true;
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.token}` });
    
    this.http.delete(`${environment.apiUrl}/photos/${photo.id}`, { headers }).subscribe({
      next: (res: any) => {
        this.queueMessage = this.getTranslation('photoDeleted');
        this.isDeletingPhoto = false;
        this.closePhotoModal();
        this.loadEventPhotos(); // Refresh the photo list
        this.cdr.detectChanges();
        setTimeout(() => { 
          this.queueMessage = ''; 
          this.cdr.detectChanges(); 
        }, 3000);
      },
      error: (err) => {
        this.queueMessage = err.error?.message || this.getTranslation('failedToDeletePhoto');
        this.isDeletingPhoto = false;
        this.cdr.detectChanges();
        setTimeout(() => { 
          this.queueMessage = ''; 
          this.cdr.detectChanges(); 
        }, 3000);
      }
    });
  }
} 