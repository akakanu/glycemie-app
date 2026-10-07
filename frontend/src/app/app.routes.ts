import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guards';

export const routes: Routes = [
  { path: '', title: 'GlycoSuivi', loadComponent: () => import('./pages/home').then((m) => m.Home) },
  {
    path: 'inscription',
    title: 'Créer un compte · GlycoSuivi',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register').then((m) => m.Register),
  },
  {
    path: 'connexion',
    title: 'Connexion · GlycoSuivi',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login').then((m) => m.Login),
  },
  {
    path: 'mesures/nouvelle',
    title: 'Nouvelle mesure · GlycoSuivi',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/reading-new').then((m) => m.ReadingNew),
  },
  {
    path: 'mesures/:id',
    title: 'Résultat · GlycoSuivi',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/reading-result').then((m) => m.ReadingResult),
  },
  {
    path: 'historique',
    title: 'Historique · GlycoSuivi',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/history').then((m) => m.History),
  },
  { path: '**', redirectTo: '' },
];
