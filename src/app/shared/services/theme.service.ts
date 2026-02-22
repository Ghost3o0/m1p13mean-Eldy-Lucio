import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_STORAGE_KEY = 'app-theme';
  private readonly DARK_MODE_CLASS = 'dark-mode';

  // Signal pour le thème actuel
  currentTheme = signal<Theme>(this.getStoredTheme());

  constructor() {
    // Appliquer le thème au démarrage
    this.applyTheme(this.currentTheme());

    // Écouter les changements de thème et les appliquer au DOM
    effect(() => {
      const theme = this.currentTheme();
      this.applyTheme(theme);
      localStorage.setItem(this.THEME_STORAGE_KEY, theme);
    });

    // Écouter les changements de préférence système
    this.watchSystemTheme();
  }

  /**
   * Initialiser le thème au démarrage de l'application
   */
  initializeTheme(): void {
    this.applyTheme(this.currentTheme());
  }

  /**
   * Bascule entre le mode clair et le mode sombre
   */
  toggleTheme(): void {
    const newTheme: Theme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.currentTheme.set(newTheme);
  }

  /**
   * Définir un thème spécifique
   */
  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
  }

  /**
   * Récupérer le thème stocké ou utiliser la préférence système
   */
  private getStoredTheme(): Theme {
    const stored = localStorage.getItem(this.THEME_STORAGE_KEY) as Theme | null;
    
    if (stored) {
      return stored;
    }

    // Utiliser la préférence système si disponible
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  /**
   * Appliquer le thème au document
   */
  private applyTheme(theme: Theme): void {
    const html = document.documentElement;
    
    if (theme === 'dark') {
      html.classList.add(this.DARK_MODE_CLASS);
      html.setAttribute('data-theme', 'dark');
    } else {
      html.classList.remove(this.DARK_MODE_CLASS);
      html.setAttribute('data-theme', 'light');
    }
  }

  /**
   * Surveiller les changements de préférence système
   */
  private watchSystemTheme(): void {
    if (!window.matchMedia) return;

    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    darkModeQuery.addEventListener('change', (e) => {
      // Appliquer seulement si rien n'est sauvegardé
      if (!localStorage.getItem(this.THEME_STORAGE_KEY)) {
        this.currentTheme.set(e.matches ? 'dark' : 'light');
      }
    });
  }

  /**
   * Vérifier si le mode sombre est actif
   */
  isDarkMode(): boolean {
    return this.currentTheme() === 'dark';
  }
}
