import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LandingPageService } from '@shared/services/landing-page.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';

@Component({
  selector: 'app-shop-landing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    LoadingComponent
  ],
  template: `
    <div class="landing-container">
      <div class="landing-header">
        <div>
          <h1>Ma Page Boutique</h1>
          <p class="subtitle">Personnalisez la page de votre boutique</p>
        </div>
        <div class="header-actions">
          <mat-slide-toggle
            [checked]="landing()?.isPublished"
            (change)="togglePublish($event.checked)"
            color="primary">
            {{ landing()?.isPublished ? 'Publiée' : 'Non publiée' }}
          </mat-slide-toggle>
          <button mat-raised-button color="primary" (click)="save()" [disabled]="isSaving()">
            @if (isSaving()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              <mat-icon>save</mat-icon>
            }
            Enregistrer
          </button>
        </div>
      </div>

      @if (isLoading()) {
        <app-loading message="Chargement..."></app-loading>
      } @else {
        <mat-tab-group>
          <!-- External URL Option -->
          <mat-tab label="Lien externe">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Redirection vers un site externe</mat-card-title>
                  <mat-card-subtitle>Redirigez les visiteurs vers votre propre site web</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="form-section">
                    <mat-slide-toggle [(ngModel)]="formData.shopContent.useExternalUrl" color="primary">
                      Utiliser un lien externe
                    </mat-slide-toggle>

                    @if (formData.shopContent.useExternalUrl) {
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>URL de votre site</mat-label>
                        <input matInput [(ngModel)]="formData.shopContent.externalUrl"
                               placeholder="https://www.votre-site.com">
                        <mat-hint>Les visiteurs seront redirigés vers cette URL</mat-hint>
                      </mat-form-field>
                    }
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Hero Section -->
          <mat-tab label="Hero">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Section Hero</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="form-section">
                    <mat-slide-toggle [(ngModel)]="formData.hero.enabled" color="primary">
                      Activer la section Hero
                    </mat-slide-toggle>

                    @if (formData.hero.enabled) {
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Titre</mat-label>
                        <input matInput [(ngModel)]="formData.hero.title">
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Sous-titre</mat-label>
                        <textarea matInput [(ngModel)]="formData.hero.subtitle" rows="2"></textarea>
                      </mat-form-field>

                      <div class="form-row">
                        <mat-form-field appearance="outline">
                          <mat-label>Texte du bouton</mat-label>
                          <input matInput [(ngModel)]="formData.hero.ctaText">
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Lien du bouton</mat-label>
                          <input matInput [(ngModel)]="formData.hero.ctaLink">
                        </mat-form-field>
                      </div>

                      <div class="image-upload">
                        <label>Image de fond</label>
                        @if (formData.hero.backgroundImage) {
                          <div class="image-preview">
                            <img [src]="formData.hero.backgroundImage" alt="Hero">
                            <button mat-icon-button color="warn" (click)="formData.hero.backgroundImage = ''">
                              <mat-icon>delete</mat-icon>
                            </button>
                          </div>
                        }
                        <button mat-stroked-button (click)="heroInput.click()">
                          <mat-icon>upload</mat-icon>
                          {{ formData.hero.backgroundImage ? 'Changer' : 'Ajouter une image' }}
                        </button>
                        <input type="file" #heroInput (change)="uploadHeroImage($event)" accept="image/*" hidden>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- About -->
          <mat-tab label="À propos">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>À propos de votre boutique</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="form-section">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Description</mat-label>
                      <textarea matInput [(ngModel)]="formData.shopContent.aboutUs" rows="6"
                                placeholder="Présentez votre boutique..."></textarea>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Message promotionnel</mat-label>
                      <textarea matInput [(ngModel)]="formData.shopContent.promotionalText" rows="3"
                                placeholder="Promotion en cours, offre spéciale..."></textarea>
                    </mat-form-field>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Theme -->
          <mat-tab label="Thème">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Personnalisation visuelle</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="form-section">
                    <div class="color-row">
                      <div class="color-field">
                        <label>Couleur principale</label>
                        <input type="color" [(ngModel)]="formData.shopContent.theme.primaryColor">
                        <span>{{ formData.shopContent.theme.primaryColor }}</span>
                      </div>
                      <div class="color-field">
                        <label>Couleur secondaire</label>
                        <input type="color" [(ngModel)]="formData.shopContent.theme.secondaryColor">
                        <span>{{ formData.shopContent.theme.secondaryColor }}</span>
                      </div>
                      <div class="color-field">
                        <label>Couleur d'accent</label>
                        <input type="color" [(ngModel)]="formData.shopContent.theme.accentColor">
                        <span>{{ formData.shopContent.theme.accentColor }}</span>
                      </div>
                    </div>

                    <mat-divider></mat-divider>

                    <div class="display-options">
                      <h4>Options d'affichage</h4>
                      <mat-slide-toggle [(ngModel)]="formData.shopContent.showReviews" color="primary">
                        Afficher les avis clients
                      </mat-slide-toggle>
                      <mat-slide-toggle [(ngModel)]="formData.shopContent.showLocation" color="primary">
                        Afficher la localisation
                      </mat-slide-toggle>
                      <mat-slide-toggle [(ngModel)]="formData.shopContent.showContact" color="primary">
                        Afficher les coordonnées
                      </mat-slide-toggle>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Banners -->
          <mat-tab label="Bannières">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Bannières promotionnelles</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="banners-section">
                    @for (banner of banners(); track banner._id) {
                      <div class="banner-item">
                        <img [src]="banner.image" [alt]="banner.title" class="banner-preview">
                        <div class="banner-info">
                          <span>{{ banner.title || 'Sans titre' }}</span>
                        </div>
                        <button mat-icon-button color="warn" (click)="deleteBanner(banner)">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    }

                    @if (banners().length === 0) {
                      <p class="no-banners">Aucune bannière</p>
                    }

                    <div class="add-banner">
                      <mat-form-field appearance="outline">
                        <mat-label>Titre</mat-label>
                        <input matInput [(ngModel)]="newBanner.title">
                      </mat-form-field>
                      <input type="file" #bannerInput (change)="onBannerSelect($event)" accept="image/*">
                      <button mat-raised-button color="primary" (click)="addBanner()"
                              [disabled]="!selectedBannerFile || isAddingBanner()">
                        @if (isAddingBanner()) {
                          <mat-spinner diameter="20"></mat-spinner>
                        } @else {
                          <mat-icon>add</mat-icon>
                        }
                        Ajouter
                      </button>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .landing-container {
      padding: 24px;
    }

    .landing-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;

      h1 {
        font-size: 2rem;
        margin: 0;
      }

      .subtitle {
        color: var(--text-secondary);
        margin: 4px 0 0 0;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 16px;
      }
    }

    .tab-content {
      padding: 24px 0;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px 0;
    }

    .full-width {
      width: 100%;
    }

    .form-row {
      display: flex;
      gap: 16px;

      mat-form-field {
        flex: 1;
      }
    }

    .image-upload {
      label {
        display: block;
        margin-bottom: 8px;
        color: var(--text-secondary);
      }

      .image-preview {
        position: relative;
        max-width: 300px;
        margin-bottom: 8px;

        img {
          width: 100%;
          border-radius: 8px;
        }

        button {
          position: absolute;
          top: 8px;
          right: 8px;
          background: white;
        }
      }
    }

    .color-row {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }

    .color-field {
      display: flex;
      flex-direction: column;
      gap: 8px;

      label {
        color: var(--text-secondary);
        font-size: 0.9rem;
      }

      input[type="color"] {
        width: 60px;
        height: 40px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
      }

      span {
        font-family: monospace;
        font-size: 0.85rem;
      }
    }

    .display-options {
      padding: 16px 0;

      h4 {
        margin: 0 0 16px 0;
        color: var(--text-secondary);
      }

      mat-slide-toggle {
        display: block;
        margin-bottom: 12px;
      }
    }

    .banners-section {
      padding: 16px 0;
    }

    .banner-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px;
      background: var(--bg-secondary);
      border-radius: 8px;
      margin-bottom: 8px;

      .banner-preview {
        width: 100px;
        height: 50px;
        object-fit: cover;
        border-radius: 4px;
      }

      .banner-info {
        flex: 1;
      }
    }

    .no-banners {
      text-align: center;
      color: var(--text-secondary);
      padding: 24px;
    }

    .add-banner {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      padding: 16px;
      background: var(--bg-secondary);
      border-radius: 8px;
      border: 2px dashed var(--border-color);
      margin-top: 16px;
    }

    mat-divider {
      margin: 16px 0;
    }

    @media (max-width: 768px) {
      .landing-header {
        flex-direction: column;
        gap: 16px;
      }

      .form-row {
        flex-direction: column;
      }

      .color-row {
        flex-direction: column;
      }

      .add-banner {
        flex-direction: column;
      }
    }
  `]
})
export class ShopLandingComponent implements OnInit {
  landing = signal(null);
  banners = signal([]);
  isLoading = signal(true);
  isSaving = signal(false);
  isAddingBanner = signal(false);

  formData = {
    hero: {
      enabled: true,
      title: '',
      subtitle: '',
      backgroundImage: '',
      ctaText: '',
      ctaLink: ''
    },
    shopContent: {
      useExternalUrl: false,
      externalUrl: '',
      aboutUs: '',
      promotionalText: '',
      theme: {
        primaryColor: '#3f51b5',
        secondaryColor: '#ff4081',
        accentColor: '#ffab00'
      },
      showReviews: true,
      showLocation: true,
      showContact: true
    }
  };

  newBanner = { title: '' };
  selectedBannerFile = null;

  constructor(
    private landingService: LandingPageService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadLanding();
  }

  loadLanding() {
    this.landingService.getShopLanding().subscribe({
      next: (response: any) => {
        if (response.success && response.data?.landing) {
          const landing = response.data.landing;
          this.landing.set(landing);
          this.banners.set(landing.banners || []);

          this.formData = {
            hero: {
              enabled: landing.hero?.enabled ?? true,
              title: landing.hero?.title || '',
              subtitle: landing.hero?.subtitle || '',
              backgroundImage: landing.hero?.backgroundImage || '',
              ctaText: landing.hero?.ctaText || '',
              ctaLink: landing.hero?.ctaLink || ''
            },
            shopContent: {
              useExternalUrl: landing.shopContent?.useExternalUrl ?? false,
              externalUrl: landing.shopContent?.externalUrl || '',
              aboutUs: landing.shopContent?.aboutUs || '',
              promotionalText: landing.shopContent?.promotionalText || '',
              theme: {
                primaryColor: landing.shopContent?.theme?.primaryColor || '#3f51b5',
                secondaryColor: landing.shopContent?.theme?.secondaryColor || '#ff4081',
                accentColor: landing.shopContent?.theme?.accentColor || '#ffab00'
              },
              showReviews: landing.shopContent?.showReviews ?? true,
              showLocation: landing.shopContent?.showLocation ?? true,
              showContact: landing.shopContent?.showContact ?? true
            }
          };
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  save() {
    this.isSaving.set(true);

    this.landingService.updateShopLanding({
      hero: this.formData.hero,
      shopContent: this.formData.shopContent
    }).subscribe({
      next: () => {
        this.snackBar.open('Configuration enregistrée', 'OK', { duration: 3000 });
        this.isSaving.set(false);
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'enregistrement', 'OK', { duration: 3000 });
        this.isSaving.set(false);
      }
    });
  }

  togglePublish(publish) {
    this.landingService.toggleShopPublish(publish).subscribe({
      next: () => {
        this.landing.update(l => l ? { ...l, isPublished: publish } : null);
        this.snackBar.open(publish ? 'Page publiée' : 'Page dépubliée', 'OK', { duration: 3000 });
      }
    });
  }

  uploadHeroImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.landingService.uploadShopHeroImage(file).subscribe({
      next: (response: any) => {
        if (response.success && response.data?.imageUrl) {
          this.formData.hero.backgroundImage = response.data.imageUrl;
          this.snackBar.open('Image uploadée', 'OK', { duration: 3000 });
        }
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'upload', 'OK', { duration: 3000 });
      }
    });
  }

  onBannerSelect(event) {
    this.selectedBannerFile = event.target.files?.[0] || null;
  }

  addBanner() {
    if (!this.selectedBannerFile) return;

    this.isAddingBanner.set(true);

    this.landingService.addShopBanner({ title: this.newBanner.title }, this.selectedBannerFile).subscribe({
      next: () => {
        this.loadLanding();
        this.newBanner = { title: '' };
        this.selectedBannerFile = null;
        this.snackBar.open('Bannière ajoutée', 'OK', { duration: 3000 });
        this.isAddingBanner.set(false);
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'ajout', 'OK', { duration: 3000 });
        this.isAddingBanner.set(false);
      }
    });
  }

  deleteBanner(banner) {
    if (!confirm('Supprimer cette bannière ?')) return;

    this.landingService.deleteShopBanner(banner._id).subscribe({
      next: () => {
        this.banners.update(b => b.filter(x => x._id !== banner._id));
        this.snackBar.open('Bannière supprimée', 'OK', { duration: 3000 });
      }
    });
  }
}
