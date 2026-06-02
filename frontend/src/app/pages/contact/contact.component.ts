import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ContactService, ContactData } from '../../core/services/contact.service';
import termstranslate from './terms-of-service';
import privacytranslate from './privacy-policy';
import { environment } from '../../../environments/environment';

type LanguageCode = 'en' | 'he' | 'ar';
type MessageKey =
  | 'requiredFields'
  | 'phoneLength'
  | 'successMessage'
  | 'errorMessage'
  | 'loginButton'
  | 'formTitle'
  | 'namePlaceholder'
  | 'phonePlaceholder'
  | 'nameError'
  | 'phoneError'
  | 'emailPlaceholder'
  | 'submitButton'
  | 'explainTitle'
  | 'explainIntro'
  | 'featurePhotos'
  | 'featureRSVP'
  | 'featureEventDetails'
  | 'featureMobile'
  | 'featureUniqueLink'
  | 'explainOutro'
  | 'tosLabel'
  | 'tosLink'
  | 'tosError'
  | 'tosTitle'
  | 'tosContent'
  | 'tosAccept'
  | 'privacyLabel'
  | 'privacyLink'
  | 'privacyError'
  | 'privacyTitle'
  | 'privacyContent'
  | 'privacyAccept'
  | 'navTitle'
  | 'navSubtitle'
  | 'navDashboard'
  | 'navDashboardDesc'
  | 'navEvent'
  | 'navEventDesc'
  | 'navPhotos'
  | 'navPhotosDesc';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatInputModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  contactForm!: FormGroup;
  isSubmitting = false;
  submitMessage = '';
  submitSuccess = false;
  currentLanguage: LanguageCode = 'he';
  showTosModal: boolean = false;
  showPrivacyModal: boolean = false;

  private messages: Record<LanguageCode, Record<MessageKey, string>> = {
    en: {
      requiredFields: 'Please fill in all required fields.',
      phoneLength: 'Phone number must be at least 8 characters long.',
      successMessage: 'Thank you! We will contact you soon.',
      errorMessage: 'Sorry, there was an error submitting your information. Please try again later.',
      loginButton: 'Already have an account? Sign in',
      formTitle: 'Sign Up',
      namePlaceholder: 'Name*',
      phonePlaceholder: 'Phone Number*',
      nameError: 'Name is required',
      phoneError: 'Phone is required / only numbers / Min 8 digits',
      emailPlaceholder: 'Your Email',
      submitButton: 'Submit',
      explainTitle: '🎉 Vivento – Event Guest Experience',
      explainIntro: 'This service allows guests to easily participate in the event by:',
      featurePhotos: '📸 Taking and uploading photos directly from their phones',
      featureRSVP: '📝 Sending their RSVP with name, attendance status, and number of guests',
      featureEventDetails: '📆 Viewing personalized event details like event name and event date',
      featureMobile: '🌐 Enjoying a beautiful, mobile-friendly experience with multi-language support',
      featureUniqueLink: '🔗 Using a unique link for each event, ensuring a private and tailored guest journey',
      explainOutro: "It's an interactive, elegant, and fun way to be part of an event—before, during, or after the big day.",
      tosLabel: 'I acknowledge the',
      tosLink: 'Terms of Service',
      tosError: 'You must accept the Terms of Service to continue.',
      tosTitle: 'Terms of Service',
      tosContent: termstranslate.en,
      tosAccept: 'I Accept',
      privacyLabel: 'and the',
      privacyLink: 'Privacy Policy',
      privacyError: 'You must accept the Privacy Policy to continue.',
      privacyTitle: 'Privacy Policy',
      privacyContent: privacytranslate.en,
      privacyAccept: 'I Accept',
      navTitle: 'Examples of our services',
      navSubtitle: 'our sample pages, discover what our platform can do for you.',
      navDashboard: 'Dashboard',
      navDashboardDesc: 'Manage your events and guests',
      navEvent: 'Example for Event',
      navEventDesc: 'Create and view event details',
      navPhotos: 'Example for Take Photos',
      navPhotosDesc: 'Upload and view event photos'
    },
    he: {
      requiredFields: 'אנא מלא את כל השדות הנדרשים.',
      phoneLength: 'מספר הטלפון חייב להיות לפחות 8 תווים.',
      successMessage: 'תודה! נצור איתך קשר בקרוב.',
      errorMessage: 'סליחה, הייתה שגיאה בשליחת המידע שלך. אנא נסה שוב מאוחר יותר.',
      loginButton: 'כבר יש לך חשבון? התחבר',
      formTitle: 'הירשם',
      namePlaceholder: 'שם*',
      phonePlaceholder: 'מספר טלפון*',
      nameError: 'שם חובה',
      phoneError: 'מספר טלפון חובה / רק מספרים / לפחות 8 ספרות',
      emailPlaceholder: 'האימייל שלך',
      submitButton: 'שלח',
      explainTitle: '🎉 Vivento – חווית האורח באירועים',
      explainIntro: 'השירות מאפשר לאורחים להשתתף בקלות באירוע על ידי:',
      featurePhotos: '📸 צילום והעלאת תמונות ישירות מהטלפון',
      featureRSVP: '📝 שליחת אישור הגעה עם שם, סטטוס הגעה ומספר משתתפים',
      featureEventDetails: '📆 צפייה בפרטי אירוע מותאמים אישית כמו שם האירוע ותאריך האירוע',
      featureMobile: '🌐 חווית משתמש יפה, נגישה וניידת עם תמיכה בריבוי שפות',
      featureUniqueLink: '🔗 שימוש בקישור ייחודי לכל אירוע, לחוויה פרטית ומותאמת',
      explainOutro: 'זו דרך אינטראקטיבית, אלגנטית ומהנה להיות חלק מהאירוע – לפני, במהלך או אחרי היום הגדול.',
      tosLabel: 'אני מאשר/ת את',
      tosLink: 'תנאי השימוש',
      tosError: 'יש לאשר את תנאי השימוש כדי להמשיך.',
      tosTitle: 'תנאי השימוש',
      tosContent: termstranslate.he,
      tosAccept: 'אני מאשר/ת',
      privacyLabel: 'ואת',
      privacyLink: 'מדיניות הפרטיות',
      privacyError: 'יש לאשר את מדיניות הפרטיות כדי להמשיך.',
      privacyTitle: 'מדיניות פרטיות',
      privacyContent: privacytranslate.he,
      privacyAccept: 'אני מאשר/ת',
      navTitle: 'דוגמאות לשירותים שלנו',
      navSubtitle: 'לשימושך, הוספנו דפי דוגמא שיעזרו לך להכיר את הפלטפורמה.',
      navDashboard: 'לוח בקרה',
      navDashboardDesc: 'ניהול אירועים ואורחים',
      navEvent: 'אירוע דוגמא',
      navEventDesc: 'יצירה וצפייה בפרטי אירוע',
      navPhotos: 'צילום תמונות דוגמא',
      navPhotosDesc: 'העלאה וצפייה בתמונות אירוע'
    },
    ar: {
      requiredFields: 'يرجى ملء جميع الحقول المطلوبة.',
      phoneLength: 'يجب أن يكون رقم الهاتف 8 أحرف على الأقل.',
      successMessage: 'شكراً لك! سنتواصل معك قريباً.',
      errorMessage: 'عذراً، وقع خطأ في إرسال معلوماتك. يرجى المحاولة مرة أخرى لاحقاً.',
      loginButton: 'هل لديك حساب؟ تسجيل الدخول',
      formTitle: 'سجل معنا',
      namePlaceholder: 'الاسم*',
      phonePlaceholder: 'رقم الهاتف*',
      nameError: 'الاسم اجباري',
      phoneError: 'رقم الهاتف اجباري / فقط ارقام / 8 ارقام على الاقل',
      emailPlaceholder: 'بريدك الإلكتروني',
      submitButton: 'إرسال',
      explainTitle: '🎉 Vivento – تجربة الضيف في المناسبه',
      explainIntro: 'تتيح هذه الخدمة للضيوف المشاركة بسهولة في المناسبه من خلال:',
      featurePhotos: '📸 التقاط وتحميل الصور مباشرة من هواتفهم',
      featureRSVP: '📝 إرسال تأكيد الحضور مع الاسم، حالة الحضور وعدد الضيوف',
      featureEventDetails: '📆 عرض تفاصيل المناسبه الشخصية مثل اسم المناسبه وتاريخه',
      featureMobile: '🌐 الاستمتاع بتجربة جميلة وسهلة الاستخدام مع دعم متعدد اللغات',
      featureUniqueLink: '🔗 استخدام رابط فريد لكل مناسبه، لضمان تجربة خاصة ومخصصة',
      explainOutro: 'إنها طريقة تفاعلية وأنيقة وممتعة لتكون جزءًا من المناسبه – قبل أو أثناء أو بعد اليوم الكبير.',
      tosLabel: 'أقر بـ',
      tosLink: 'شروط الخدمة',
      tosError: 'يجب الموافقة على شروط الخدمة للمتابعة.',
      tosTitle: 'شروط الخدمة',
      tosContent: termstranslate.ar,
      tosAccept: 'أوافق',
      privacyLabel: 'و',
      privacyLink: 'سياسة الخصوصية',
      privacyError: 'يجب الموافقة على سياسة الخصوصية للمتابعة.',
      privacyTitle: 'سياسة الخصوصية',
      privacyContent: privacytranslate.ar,
      privacyAccept: 'أوافق',
      navTitle: 'أمثله لخدماتنا',
      navSubtitle: 'مرفقة أمثله توضيحية لتبدأ باستخدام المنصة.',
      navDashboard: 'لوحة التحكم',
      navDashboardDesc: 'إدارة المناسبه والضيوف',
      navEvent: 'مثال لتأكيد حضور',
      navEventDesc: 'إنشاء وعرض تفاصيل المناسبه',
      navPhotos: 'مثال لالتقاط الصور',
      navPhotosDesc: 'تحميل وعرض الصور الخاصة بالمناسبه'
    }
  };

  constructor(
    private contactService: ContactService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
  }

  ngOnInit(): void {
    // Get language from localStorage or default to Hebrew
    const savedLang = localStorage.getItem('lang') || 'he';
    this.setLanguage(savedLang);
    this.initForm();
  }

  openTosModal(event: Event): void {
    event.preventDefault();
    this.showTosModal = true;
    this.cdr.detectChanges();
  }
  closeTosModal(): void {
    this.showTosModal = false;
    console.log('Terms of Service accepted.');
  }

  openPrivacyModal(event: Event): void {
    event.preventDefault();
    this.showPrivacyModal = true;
    this.cdr.detectChanges();
  }

  closePrivacyModal(): void {
    this.showPrivacyModal = false;
  }

  initForm(): void {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      phone: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.pattern(/^\d+$/)
        ]
      ],
      email: ['', null],
      termsAccepted: [false, Validators.requiredTrue],
      privacyAccepted: [false, Validators.requiredTrue]
    });
  }

  handleSubmit(): void {
    if (this.contactForm.invalid) {
      this.showMessage(this.getTranslation('requiredFields'), false);
      this.contactForm.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    const contactData: ContactData = this.contactForm.value;

    this.isSubmitting = true;

    this.contactService.submitContact(contactData).subscribe({
      next: () => {
        setTimeout(() => {
          this.isSubmitting = false;
          this.showMessage(this.getTranslation('successMessage'), true);
          this.contactForm.reset();
        }, 1000);
      },
      error: (error) => {
        setTimeout(() => {
          this.isSubmitting = false;
          console.error('Error submitting contact:', error);
          this.showMessage(this.getTranslation('errorMessage'), false);
        }, 1000);
      }
    });
  }

  getTranslation(key: MessageKey): string {
    return this.messages[this.currentLanguage][key];
  }

  showMessage(message: string, isSuccess: boolean): void {
    this.submitMessage = message;
    this.submitSuccess = isSuccess;
    this.cdr.detectChanges();
  }

  setLanguage(lang: string) {
    this.currentLanguage = lang as LanguageCode;
    localStorage.setItem("lang", lang);
    this.updateDirection();
  }

  private updateDirection(): void {
    const isRTL = this.currentLanguage === 'he' || this.currentLanguage === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = this.currentLanguage;
  }

  navigateToSignIn(): void {
    this.router.navigate(['/signin']);
  }

  navigateToDashboard(): void {
    const token = localStorage.getItem('token');

    if (!token) {
      // No token → send to login page
      this.router.navigate(['/signin']);
      return;
    }
    this.router.navigate(['/user-dashboard']);
  }

  navigateToEvent(): void {
    // Navigate to demo event from environment config
    this.router.navigate(['/event', environment.demoEventId]);
  }

  navigateToUpload(): void {
    // Navigate to demo photo upload page from environment config
    this.router.navigate(['/upload-photos', environment.demoUploadId]);
  }

  acceptTerms(): void {
    this.contactForm.patchValue({ termsAccepted: true });
    this.closeTosModal();
  }

  acceptPrivacy(): void {
    this.contactForm.patchValue({ privacyAccepted: true });
    this.closePrivacyModal();
  }

}
