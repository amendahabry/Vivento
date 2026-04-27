import { Injectable } from '@angular/core';

export interface TranslationKeys {
  // Header
  mainTitle: string;
  subtitle: string;
  
  // Language buttons
  english: string;
  hebrew: string;
  arabic: string;
  
  // Form labels
  yourName: string;
  enterYourName: string;
  
  // Camera controls
  openCamera: string;
  switchCamera: string;
  takePhoto: string;
  closeCamera: string;
  
  // Upload section
  or: string;
  chooseFromGallery: string;
  
  // Progress
  uploadingPhoto: string;
  
  // Messages
  photoUploadedSuccessfully: string;
  thankYouMessage: string;
  eventNotFound: string;
  eventInvalidMessage: string;
  goHome: string;
  checkingEvent: string;
  loading: string;
  
  // Error messages
  cameraNotSupported: string;
  unableToAccessCamera: string;
  fileSizeLimit: string;
  pleaseEnterName: string;
  uploadFailed: string;
  eventValidationError: string;
  
  // Gallery
  myPhotos: string;
  camera: string;
  myPhotosTitle: string;
  myPhotosSubtitle: string;
  loadingPhotos: string;
  noPhotosYet: string;
  noPhotosMessage: string;
  photoDetails: string;
  deletePhoto: string;
  close: string;
  deleteConfirm: string;
  
  // Date formatting
  dateFormat: string;
}

export type Language = 'en' | 'he' | 'ar';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private translations: Record<Language, TranslationKeys> = {
    en: {
      mainTitle: '🎉 TODAY IS THE WEDDING DAY 🎉',
      subtitle: "Let's capture the moments together 📸",
      english: 'EN',
      hebrew: 'עברית',
      arabic: 'العربية',
      yourName: 'Your Name',
      enterYourName: 'Enter your name',
      openCamera: 'Open Camera',
      switchCamera: 'Switch Camera',
      takePhoto: 'Take Photo',
      closeCamera: 'Close Camera',
      or: 'OR',
      chooseFromGallery: 'Choose from Gallery',
      uploadingPhoto: 'Uploading your photo...',
      photoUploadedSuccessfully: 'Photo Uploaded Successfully!',
      thankYouMessage: 'Thank you for sharing this special moment with us! 🙌',
      eventNotFound: 'Event Not Found',
      eventInvalidMessage: 'Sorry, this event link is invalid or has expired.',
      goHome: 'Go Home',
      checkingEvent: 'Checking event...',
      loading: 'Loading...',
      cameraNotSupported: 'Camera not supported on this device',
      unableToAccessCamera: 'Unable to access camera. Please check permissions.',
      fileSizeLimit: 'File size must be less than 10MB',
      pleaseEnterName: 'Please enter your name',
      uploadFailed: 'Failed to upload photo. Please try again.',
      eventValidationError: 'Error validating event',
      myPhotos: 'Album',
      camera: 'Camera',
      myPhotosTitle: '📸 My Photos',
      myPhotosSubtitle: 'Photos you\'ve taken at this event',
      loadingPhotos: 'Loading your photos...',
      noPhotosYet: 'No photos yet',
      noPhotosMessage: 'Take your first photo to see it here!',
      photoDetails: 'Photo Details',
      deletePhoto: 'Delete Photo',
      close: 'Close',
      deleteConfirm: 'Are you sure you want to delete this photo?',
      dateFormat: 'fullDate'
    },
    he: {
      mainTitle: '🎉 היום הוא יום החתונה 🎉',
      subtitle: 'בואו נצלם יחד את הרגעים 📸',
      english: 'EN',
      hebrew: 'עברית',
      arabic: 'العربية',
      yourName: 'שמך',
      enterYourName: 'הכנס את שמך',
      openCamera: 'פתח מצלמה',
      switchCamera: 'החלף מצלמה',
      takePhoto: 'צלם תמונה',
      closeCamera: 'סגור מצלמה',
      or: 'או',
      chooseFromGallery: 'בחר מהגלריה',
      uploadingPhoto: 'מעלה את התמונה שלך...',
      photoUploadedSuccessfully: 'התמונה הועלתה בהצלחה!',
      thankYouMessage: 'תודה ששיתפת איתנו את הרגע המיוחד הזה! 🙌',
      eventNotFound: 'האירוע לא נמצא',
      eventInvalidMessage: 'מצטערים, הקישור לאירוע זה אינו תקין או פג תוקפו.',
      goHome: 'חזור הביתה',
      checkingEvent: 'בודק אירוע...',
      loading: 'טוען...',
      cameraNotSupported: 'המצלמה אינה נתמכת במכשיר זה',
      unableToAccessCamera: 'לא ניתן לגשת למצלמה. אנא בדוק הרשאות.',
      fileSizeLimit: 'גודל הקובץ חייב להיות פחות מ-10MB',
      pleaseEnterName: 'אנא הכנס את שמך',
      uploadFailed: 'העלאת התמונה נכשלה. אנא נסה שוב.',
      eventValidationError: 'שגיאה באימות האירוע',
      myPhotos: 'אלבום',
      camera: 'מצלמה',
      myPhotosTitle: '📸 התמונות שלי',
      myPhotosSubtitle: 'תמונות שצילמת באירוע זה',
      loadingPhotos: 'טוען את התמונות שלך...',
      noPhotosYet: 'אין תמונות עדיין',
      noPhotosMessage: 'צלם את התמונה הראשונה שלך כדי לראות אותה כאן!',
      photoDetails: 'פרטי התמונה',
      deletePhoto: 'מחק תמונה',
      close: 'סגור',
      deleteConfirm: 'האם אתה בטוח שברצונך למחוק תמונה זו?',
      dateFormat: 'fullDate'
    },
    ar: {
      mainTitle: '🎉 اليوم هو يوم الزفاف 🎉',
      subtitle: 'دعونا نلتقط اللحظات معاً 📸',
      english: 'EN',
      hebrew: 'עברית',
      arabic: 'العربية',
      yourName: 'اسمك',
      enterYourName: 'أدخل اسمك',
      openCamera: 'افتح الكاميرا',
      switchCamera: 'بدّل الكاميرا',
      takePhoto: 'التقط صورة',
      closeCamera: 'أغلق الكاميرا',
      or: 'أو',
      chooseFromGallery: 'اختر من المعرض',
      uploadingPhoto: 'جاري رفع صورتك...',
      photoUploadedSuccessfully: 'تم رفع الصورة بنجاح!',
      thankYouMessage: 'شكراً لك على مشاركة هذه اللحظة الخاصة معنا! 🙌',
      eventNotFound: 'المناسبه غير موجوده',
      eventInvalidMessage: 'عذراً، رابط هذه المناسبه غير صالح أو منتهي الصلاحية.',
      goHome: 'اذهب للرئيسية',
      checkingEvent: 'جاري التحقق من المناسبه...',
      loading: 'جاري التحميل...',
      cameraNotSupported: 'الكاميرا غير مدعومة في هذا الجهاز',
      unableToAccessCamera: 'لا يمكن الوصول إلى الكاميرا. يرجى التحقق من الأذونات.',
      fileSizeLimit: 'يجب أن يكون حجم الملف أقل من 10 ميجابايت',
      pleaseEnterName: 'يرجى إدخال اسمك',
      uploadFailed: 'فشل في رفع الصورة. يرجى المحاولة مرة أخرى.',
      eventValidationError: 'خطأ في التحقق من صحة المناسبه',
      myPhotos: 'صوري',
      camera: 'الكاميرا',
      myPhotosTitle: '📸 صوري',
      myPhotosSubtitle: 'الصور التي التقطتها في هذه المناسبه',
      loadingPhotos: 'جاري تحميل صورك...',
      noPhotosYet: 'لا توجد صور بعد',
      noPhotosMessage: 'التقط أول صورة لرؤيتها هنا!',
      photoDetails: 'تفاصيل الصورة',
      deletePhoto: 'حذف الصورة',
      close: 'إغلاق',
      deleteConfirm: 'هل أنت متأكد من أنك تريد حذف هذه الصورة؟',
      dateFormat: 'fullDate'
    }
  };

  private currentLanguage: Language = 'en';

  constructor() {
    // Load saved language from localStorage
    const savedLang = localStorage.getItem('lang') as Language;
    if (savedLang && this.translations[savedLang]) {
      this.currentLanguage = savedLang;
    }
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  setLanguage(lang: Language): void {
    if (this.translations[lang]) {
      this.currentLanguage = lang;
      localStorage.setItem('lang', lang);
      
      // Set document direction for RTL languages
      document.documentElement.dir = (lang === 'he' || lang === 'ar') ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  }

  get(key: keyof TranslationKeys): string {
    return this.translations[this.currentLanguage][key] || this.translations.en[key] || key;
  }

  getAll(): TranslationKeys {
    return this.translations[this.currentLanguage];
  }

  getAvailableLanguages(): Language[] {
    return Object.keys(this.translations) as Language[];
  }

  formatDate(date: string | Date): string {
    const dateObj = new Date(date);
    
    if (this.currentLanguage === 'he') {
      return this.formatHebrewDate(dateObj);
    } else if (this.currentLanguage === 'ar') {
      return this.formatArabicDate(dateObj);
    } else {
      return this.formatEnglishDate(dateObj);
    }
  }

  private formatHebrewDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Intl.DateTimeFormat('he-IL', options).format(date);
  }

  private formatArabicDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', options).format(date);
  }

  private formatEnglishDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  }
} 