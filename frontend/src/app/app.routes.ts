import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./pages/home/home').then(m => m.Home) },
  { path: 'contact', loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent) },
  {
    path: 'user-dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  { path: 'error', loadComponent: () => import('./pages/error/error.component').then(m => m.ErrorComponent) },
  { path: 'not-found-page', loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent) },
  { path: 'event/:id', loadComponent: () => import('./pages/rsvp/rsvp.component').then(m => m.RsvpComponent) },
  { path: 'signin', loadComponent: () => import('./pages/signin/signin.component').then(m => m.SigninComponent) },
  { path: 'upload-photos/:id', loadComponent: () => import('./pages/upload-photo/upload-photo.component').then(m => m.UploadPhotoComponent) },
  { path: '**', redirectTo: 'home' }
];
