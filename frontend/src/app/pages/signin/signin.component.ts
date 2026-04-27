import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss'],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterModule, CommonModule]
})
export class SigninComponent implements OnInit {
  form: FormGroup = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required)
  });
  isLoading: boolean = false;
  errorMessage: string = '';
  currentLanguage: string = 'en';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Get language from localStorage, default to 'en'
    this.currentLanguage = localStorage.getItem('lang') || 'en';
  }

  onSubmit(): void {
    this.errorMessage = '';
    if (this.form.invalid) {
      this.errorMessage = this.getTranslation('requiredFields');
      return;
    }
    this.isLoading = true;
    const { username, password } = this.form.value;
    this.http.post<any>(`${environment.apiUrl}/auth/login`, {
      username: username.trim(),
      password: password.trim()
    }).subscribe({
      next: (res) => {
        // Store token securely (for demo, use localStorage; for production, use HttpOnly cookies)
        localStorage.setItem('auth_token', res.token);
        this.isLoading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/user-dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status == 401) this.getTranslation('');
        this.errorMessage = err.error?.message || this.getTranslation('loginFailed');
        this.cdr.detectChanges();
      }
    });
  }

  getTranslation(key: string): string {
    const translations: any = {
      signIn: { en: 'Sign In', he: 'התחברות', ar: 'تسجيل الدخول' },
      username: { en: 'Username*', he: 'שם משתמש*', ar: 'اسم المستخدم*' },
      password: { en: 'Password*', he: 'סיסמה*', ar: 'كلمة المرور*' },
      signingIn: { en: 'Signing in...', he: 'מתחבר...', ar: 'جاري تسجيل الدخول...' },
      requiredFields: { en: 'Username and password are required.', he: 'שם משתמש וסיסמה נדרשים.', ar: 'اسم المستخدم وكلمة المرور مطلوبان.' },
      loginFailed: { en: 'Login failed. Please try again.', he: 'ההתחברות נכשלה. נסה שוב.', ar: 'فشل تسجيل الدخول. حاول مرة أخرى.' }
    };
    return translations[key]?.[this.currentLanguage] || key;
  }
} 