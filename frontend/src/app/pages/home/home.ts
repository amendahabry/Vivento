import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

type LanguageCode = 'en' | 'he' | 'ar';
type MessageKey =
  | 'heroTitle'
  | 'screenshotTitle'
  | 'heroSubtitle'
  | 'bestRvsp'
  | 'sharedAlbum'
  | 'startEventButton'
  | 'easyRsvpTitle'
  | 'easyRsvpDesc'
  | 'sharedAlbumTitle'
  | 'sharedAlbumDesc'
  | 'qrCodeTitle'
  | 'qrCodeDesc'
  | 'useCasesTitle'
  | 'weddingsTitle'
  | 'weddingsDesc'
  | 'birthdayTitle'
  | 'birthdayDesc'
  | 'genderRevealTitle'
  | 'genderRevealDesc'
  | 'ctaBannerTitle'
  | 'ctaBannerSubtitle'
  | 'tryViventoButton'
  | 'gatheringTitle'
  | 'gatheringDesc';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  currentLanguage: LanguageCode = 'en';

  private messages: Record<LanguageCode, Record<MessageKey, string>> = {
    en: {
      heroTitle: 'Everything you need to organize your event — in one simple link',
      screenshotTitle: 'Examples for some of our services',
      bestRvsp: 'Best rsvp for your guests',
      sharedAlbum: 'Shared Album with your guests',
      heroSubtitle: 'Smart invitations, RSVP tracking, and a shared photo album — without any complicated apps. Vivento gives you a simple, modern way to invite guests, track who’s coming, and let everyone upload their favorite photos to one shared album that captures every moment. All through a single link, sent in seconds, and works smoothly on any device — no downloads needed.',
      startEventButton: 'Start Your Event',
      easyRsvpTitle: 'Easy RSVP',
      easyRsvpDesc: 'Send personalized invitations to the guest viA whatsapp and track responses in real-time.',
      sharedAlbumTitle: 'Shared Album',
      sharedAlbumDesc: 'Your guests can instantly upload their favorite photos to a single event album.',
      qrCodeTitle: 'QR Code Access',
      qrCodeDesc: 'No apps — guests just scan and share.',
      useCasesTitle: 'Perfect for Every Occasion',
      weddingsTitle: 'Weddings',
      weddingsDesc: 'Capture every magical moment from "Yes I do" to "honeymoon."',
      birthdayTitle: 'Birthday Parties',
      birthdayDesc: 'Invite guests and collect unforgettable memories.',
      genderRevealTitle: 'Gender Reveals',
      genderRevealDesc: 'Let the surprise live forever through your guests\' eyes.',
      gatheringTitle: 'Private Gatherings & Events',
      gatheringDesc: 'Let us document the full story of your event, as seen through the eyes of the attendees..',
      ctaBannerTitle: 'Start Your Event for Free',
      ctaBannerSubtitle: 'No credit card needed. No downloads. Just the memories.',
      tryViventoButton: 'Try Vivento Now'
    },
    he: {
      heroTitle: 'כל מה שאתם צריכים כדי לארגן את האירוע שלכם בלינק אחד',
      screenshotTitle: 'דוגמא לחלק מהשירותים שלנו',
      bestRvsp: 'אישורי הגעה הכי טובים',
      sharedAlbum: 'שיתוף אלבום תמונות עם המוזמנים',
      heroSubtitle: 'הזמנה חכמה, אישור הגעה, ואלבום תמונות משותף — בלי אפליקציות מסובכות. Vivento מציע לכם דרך פשוטה ומודרנית להזמין אורחים, לעקוב אחרי אישורי ההגעה, ולאפשר לכולם להעלות את הרגעים הכי יפים שלהם לאלבום אחד משותף. הכול דרך קישור אחד, שנשלח תוך שניות, ועובד חלק בכל מכשיר — בלי צורך בהורדה',
      startEventButton: 'התחל את האירוע שלך',
      easyRsvpTitle: 'אישור הגעה פשוט',
      easyRsvpDesc: 'שלח הזמנות מותאמות אישית לאורחים דרך הוואטסאפ ועקוב אחר תגובות בזמן אמת.',
      sharedAlbumTitle: 'אלבום משותף',
      sharedAlbumDesc: 'האורחים שלך יכולים להעלות מיד את התמונות האהובות שלהם לאלבום אירוע אחד.',
      qrCodeTitle: 'גישה באמצעות קוד QR',
      qrCodeDesc: 'ללא אפליקציות — אורחים פשוט סורקים ומשתפים.',
      useCasesTitle: 'מושלם לכל אירוע',
      weddingsTitle: 'חתונות',
      weddingsDesc: 'תפוס כל רגע קסום מ"כן מסכימה" ועד "ירח דבש".',
      birthdayTitle: 'ימי הולדת',
      birthdayDesc: 'הזמן אורחים ואסוף זיכרונות בלתי נשכחים.',
      genderRevealTitle: 'גילוי מגדר',
      genderRevealDesc: 'תן להפתעה לחיות לנצח דרך עיני האורחים שלך.',
      gatheringTitle: 'כנסים ואירועים פרטיים.',
      gatheringDesc: 'תנו לנו לתעד את הסיפור המלא של האירוע, דרך העיניים של המשתתפים.',
      ctaBannerTitle: 'התחל את האירוע שלך בחינם',
      ctaBannerSubtitle: 'לא נדרש כרטיס אשראי. ללא הורדות. רק הזיכרונות.',
      tryViventoButton: 'נסה Vivento עכשיו'
    },
    ar: {
      heroTitle: 'كل ما تحتاجه لتنظيم مناسبتك في رابط واحد',
      screenshotTitle: 'امثله لقسم من خدماتنا',
      bestRvsp: 'أفضل تأكيد حضور',
      sharedAlbum: 'مشاركة البوم صور مع الحاضرين',
      heroSubtitle: 'دعوة ذكية، تأكيد حضور، وألبوم صور مشترك — بدون تطبيقات معقدة. Vivento يوفّر لك طريقة سهلة وعصرية لدعوة ضيوفك، متابعة من سيحضر، والسماح للجميع بمشاركة صورهم في ألبوم واحد يخلّد أجمل اللحظات. كل ذلك من خلال رابط بسيط يُرسل في ثواني، ويعمل بسلاسة على أي جهاز، بدون تحميل.',
      startEventButton: 'ابدأ مناسبتك',
      easyRsvpTitle: 'تأكيد حضور سهل',
      easyRsvpDesc: 'أرسل دعوات مخصصة للضيوف عبر الواتساب وتتبع الردود بالوقت الفعلي.',
      sharedAlbumTitle: 'ألبوم مشترك',
      sharedAlbumDesc: 'يمكن لضيوفك رفع صورهم المفضلة فوراً إلى ألبوم مناسبه واحد.',
      qrCodeTitle: 'الوصول عبر كود QR',
      qrCodeDesc: 'بدون تطبيقات — الضيوف يصورون ويشاركون فقط.',
      useCasesTitle: 'مثالي لكل مناسبة',
      weddingsTitle: 'الأعراس',
      weddingsDesc: 'التقط كل لحظة سحرية من "نعم اوافق" الى "شهر العسل".',
      birthdayTitle: 'حفلات الميلاد',
      birthdayDesc: 'ادع الضيوف واجمع ذكريات لا تنسى.',
      genderRevealTitle: 'كشف جنس المولود',
      genderRevealDesc: 'دع المفاجأة تعيش للأبد من خلال عيون ضيوفك.',
      gatheringTitle: 'لقاءات وفعاليات خاصة',
      gatheringDesc: 'دعنا نوثق القصة الكاملة للمناسبه، كما يراها المشاركون.',
      ctaBannerTitle: 'ابدأ مناسبتك مجاناً',
      ctaBannerSubtitle: 'لا تحتاج بطاقة ائتمان. لا تحميلات. فقط الذكريات.',
      tryViventoButton: 'جرب Vivento الآن'
    }
  };

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    let savedLang = localStorage.getItem('lang');

    if (!savedLang) {
      // Get the browser language (first two letters)
      const browserLang = navigator.language ? navigator.language.slice(0, 2) : 'en';
      // Set allowed languages
      const supportedLangs = ['en', 'he', 'ar'];
      // If browser language is supported, use it; otherwise default to English
      savedLang = supportedLangs.includes(browserLang) ? browserLang : 'en';
      // Save it to localStorage for future visits
      localStorage.setItem('lang', savedLang);
    }
    this.setLanguage(savedLang);
    const pos = await this.getPosition();
    console.log(pos.coords.latitude, pos.coords.longitude);
  }

  getPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) return reject('Geolocation not supported');
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60_000
      });
    });
  }

  setLanguage(lang: string) {
    this.currentLanguage = lang as LanguageCode;
    localStorage.setItem("lang", lang);
    this.updateDirection();
    this.cdr.detectChanges();
  }

  private updateDirection(): void {
    const isRTL = this.currentLanguage === 'he' || this.currentLanguage === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = this.currentLanguage;
  }

  getTranslation(key: MessageKey): string {
    return this.messages[this.currentLanguage][key];
  }

  navigateToContact() {
    this.router.navigate(['/contact']);
  }
}
