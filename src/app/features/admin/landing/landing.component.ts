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
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { LandingPageService } from '@shared/services/landing-page.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';

@Component({
  selector: 'app-admin-landing',
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
    DragDropModule,
    LoadingComponent
  ],
  template: `
    <div class="landing-container">
      <div class="landing-header">
        <div>
          <h1>Configuration Landing Page</h1>
          <p class="subtitle">Personnalisez la page d'accueil de la plateforme</p>
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
        <app-loading message="Chargement de la configuration..."></app-loading>
      } @else {
        <mat-tab-group>
          <!-- Hero Section -->
          <mat-tab label="Hero">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Section Hero</mat-card-title>
                  <mat-card-subtitle>La section principale en haut de la page</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="form-section">
                    <mat-slide-toggle [(ngModel)]="formData.hero.enabled" color="primary">
                      Activer la section Hero
                    </mat-slide-toggle>

                    @if (formData.hero.enabled) {
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Titre</mat-label>
                        <input matInput [(ngModel)]="formData.hero.title" placeholder="Bienvenue...">
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Sous-titre</mat-label>
                        <textarea matInput [(ngModel)]="formData.hero.subtitle" rows="2"
                                  placeholder="Découvrez nos boutiques..."></textarea>
                      </mat-form-field>

                      <div class="form-row">
                        <mat-form-field appearance="outline">
                          <mat-label>Texte du bouton CTA</mat-label>
                          <input matInput [(ngModel)]="formData.hero.ctaText" placeholder="Découvrir">
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                          <mat-label>Lien du bouton CTA</mat-label>
                          <input matInput [(ngModel)]="formData.hero.ctaLink" placeholder="/shops">
                        </mat-form-field>
                      </div>

                      <div class="image-upload">
                        <label>Image de fond</label>
                        @if (formData.hero.backgroundImage) {
                          <div class="image-preview">
                            <img [src]="formData.hero.backgroundImage" alt="Hero background">
                            <button mat-icon-button color="warn" (click)="formData.hero.backgroundImage = ''">
                              <mat-icon>delete</mat-icon>
                            </button>
                          </div>
                        }
                        <button mat-stroked-button (click)="heroImageInput.click()">
                          <mat-icon>upload</mat-icon>
                          {{ formData.hero.backgroundImage ? 'Changer l\'image' : 'Ajouter une image' }}
                        </button>
                        <input type="file" #heroImageInput (change)="uploadHeroImage($event)" accept="image/*" hidden>
                      </div>
                    }
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
                  <mat-card-subtitle>Glissez-déposez pour réorganiser</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="banners-section">
                    <div class="banners-list" cdkDropList (cdkDropListDropped)="dropBanner($event)">
                      @for (banner of banners(); track banner._id; let i = $index) {
                        <div class="banner-item" cdkDrag>
                          <div class="drag-handle" cdkDragHandle>
                            <mat-icon>drag_indicator</mat-icon>
                          </div>
                          <div class="banner-preview">
                            <img [src]="banner.image" [alt]="banner.title || 'Banner'">
                          </div>
                          <div class="banner-info">
                            <span class="banner-title">{{ banner.title || 'Sans titre' }}</span>
                            <span class="banner-subtitle">{{ banner.subtitle || '-' }}</span>
                          </div>
                          <div class="banner-actions">
                            <mat-slide-toggle
                              [checked]="banner.isActive"
                              (change)="toggleBanner(banner, $event.checked)"
                              color="primary">
                            </mat-slide-toggle>
                            <button mat-icon-button color="warn" (click)="deleteBanner(banner)">
                              <mat-icon>delete</mat-icon>
                            </button>
                          </div>
                        </div>
                      }
                    </div>

                    @if (banners().length === 0) {
                      <div class="empty-banners">
                        <mat-icon>image</mat-icon>
                        <p>Aucune bannière</p>
                      </div>
                    }

                    <div class="add-banner">
                      <h4>Ajouter une bannière</h4>
                      <div class="form-row">
                        <mat-form-field appearance="outline">
                          <mat-label>Titre</mat-label>
                          <input matInput [(ngModel)]="newBanner.title">
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Sous-titre</mat-label>
                          <input matInput [(ngModel)]="newBanner.subtitle">
                        </mat-form-field>
                      </div>
                      <div class="form-row">
                        <mat-form-field appearance="outline">
                          <mat-label>Lien</mat-label>
                          <input matInput [(ngModel)]="newBanner.link" placeholder="https://...">
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Texte du lien</mat-label>
                          <input matInput [(ngModel)]="newBanner.linkText" placeholder="En savoir plus">
                        </mat-form-field>
                      </div>
                      <div class="form-row">
                        <input type="file" #bannerImageInput (change)="onBannerImageSelect($event)" accept="image/*">
                        <button mat-raised-button color="primary" (click)="addBanner()"
                                [disabled]="!selectedBannerImage || isAddingBanner()">
                          @if (isAddingBanner()) {
                            <mat-spinner diameter="20"></mat-spinner>
                          } @else {
                            <mat-icon>add</mat-icon>
                          }
                          Ajouter
                        </button>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- General Info -->
          <mat-tab label="Informations">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Informations générales</mat-card-title>
                  <mat-card-subtitle>Coordonnées et horaires du centre commercial</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="form-section">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Adresse</mat-label>
                      <textarea matInput [(ngModel)]="formData.platformContent.generalInfo.address" rows="2"></textarea>
                    </mat-form-field>

                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>Téléphone</mat-label>
                        <input matInput [(ngModel)]="formData.platformContent.generalInfo.phone">
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Email</mat-label>
                        <input matInput [(ngModel)]="formData.platformContent.generalInfo.email" type="email">
                      </mat-form-field>
                    </div>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Horaires d'ouverture</mat-label>
                      <textarea matInput [(ngModel)]="formData.platformContent.generalInfo.hours" rows="3"
                                placeholder="Lundi - Samedi: 9h - 20h&#10;Dimanche: 10h - 18h"></textarea>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Description</mat-label>
                      <textarea matInput [(ngModel)]="formData.platformContent.generalInfo.description" rows="4"
                                placeholder="Présentation du centre commercial..."></textarea>
                    </mat-form-field>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Social Links -->
          <mat-tab label="Réseaux sociaux">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Réseaux sociaux</mat-card-title>
                  <mat-card-subtitle>Liens vers vos pages sociales</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="form-section social-links">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Facebook</mat-label>
                      <mat-icon matPrefix>facebook</mat-icon>
                      <input matInput [(ngModel)]="formData.platformContent.socialLinks.facebook" placeholder="https://facebook.com/...">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Instagram</mat-label>
                      <mat-icon matPrefix>photo_camera</mat-icon>
                      <input matInput [(ngModel)]="formData.platformContent.socialLinks.instagram" placeholder="https://instagram.com/...">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Twitter/X</mat-label>
                      <mat-icon matPrefix>tag</mat-icon>
                      <input matInput [(ngModel)]="formData.platformContent.socialLinks.twitter" placeholder="https://twitter.com/...">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>YouTube</mat-label>
                      <mat-icon matPrefix>play_circle</mat-icon>
                      <input matInput [(ngModel)]="formData.platformContent.socialLinks.youtube" placeholder="https://youtube.com/...">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>LinkedIn</mat-label>
                      <mat-icon matPrefix>business</mat-icon>
                      <input matInput [(ngModel)]="formData.platformContent.socialLinks.linkedin" placeholder="https://linkedin.com/...">
                    </mat-form-field>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- SEO -->
          <mat-tab label="SEO">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Référencement (SEO)</mat-card-title>
                  <mat-card-subtitle>Optimisation pour les moteurs de recherche</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="form-section">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Meta Title</mat-label>
                      <input matInput [(ngModel)]="formData.platformContent.seo.metaTitle"
                             placeholder="Titre affiché dans les résultats de recherche">
                      <mat-hint>Recommandé: 50-60 caractères</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Meta Description</mat-label>
                      <textarea matInput [(ngModel)]="formData.platformContent.seo.metaDescription" rows="3"
                                placeholder="Description affichée dans les résultats de recherche"></textarea>
                      <mat-hint>Recommandé: 150-160 caractères</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Mots-clés</mat-label>
                      <input matInput [(ngModel)]="seoKeywords"
                             placeholder="centre commercial, shopping, boutiques (séparés par des virgules)">
                      <mat-hint>Mots-clés séparés par des virgules</mat-hint>
                    </mat-form-field>
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

    mat-card {
      margin-bottom: 24px;
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
      align-items: flex-start;

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
        width: 100%;
        max-width: 400px;
        margin-bottom: 8px;

        img {
          width: 100%;
          border-radius: 8px;
        }

        button {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(255, 255, 255, 0.9);
        }
      }
    }

    .banners-section {
      padding: 16px 0;
    }

    .banners-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 24px;
    }

    .banner-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px;
      background: var(--bg-secondary);
      border-radius: 8px;
      cursor: move;

      &:hover {
        background: var(--gray-200);
      }

      .drag-handle {
        color: var(--text-secondary);
      }

      .banner-preview {
        width: 120px;
        height: 60px;
        border-radius: 4px;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .banner-info {
        flex: 1;
        display: flex;
        flex-direction: column;

        .banner-title {
          font-weight: 500;
        }

        .banner-subtitle {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
      }

      .banner-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }

    .empty-banners {
      text-align: center;
      padding: 32px;
      color: var(--text-secondary);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }
    }

    .add-banner {
      padding: 16px;
      background: var(--bg-secondary);
      border-radius: 8px;
      border: 2px dashed var(--border-color);

      h4 {
        margin: 0 0 16px 0;
      }
    }

    .social-links {
      mat-icon {
        color: var(--text-secondary);
      }
    }

    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 8px;
      box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
                  0 8px 10px 1px rgba(0, 0, 0, 0.14),
                  0 3px 14px 2px rgba(0, 0, 0, 0.12);
    }

    .cdk-drag-placeholder {
      opacity: 0;
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    @media (max-width: 768px) {
      .landing-header {
        flex-direction: column;
        gap: 16px;
      }

      .form-row {
        flex-direction: column;
      }
    }
  `]
})
export class AdminLandingComponent implements OnInit {
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
    platformContent: {
      generalInfo: { hours: '', address: '', phone: '', email: '', description: '' },
      socialLinks: { facebook: '', instagram: '', twitter: '', youtube: '', linkedin: '' },
      seo: { metaTitle: '', metaDescription: '', keywords: [] }
    }
  };

  seoKeywords = '';
  newBanner = { title: '', subtitle: '', link: '', linkText: '' };
  selectedBannerImage = null;

  constructor(
    private landingService: LandingPageService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadLanding();
  }

  loadLanding() {
    this.landingService.getPlatformLandingAdmin().subscribe({
      next: (response: any) => {
        if (response.success && response.data?.landing) {
          const landing = response.data.landing;
          this.landing.set(landing);
          this.banners.set(landing.banners || []);

          this.formData.hero = {
            enabled: landing.hero?.enabled ?? true,
            title: landing.hero?.title || '',
            subtitle: landing.hero?.subtitle || '',
            backgroundImage: landing.hero?.backgroundImage || '',
            ctaText: landing.hero?.ctaText || '',
            ctaLink: landing.hero?.ctaLink || ''
          };

          this.formData.platformContent = {
            generalInfo: {
              hours: landing.platformContent?.generalInfo?.hours || '',
              address: landing.platformContent?.generalInfo?.address || '',
              phone: landing.platformContent?.generalInfo?.phone || '',
              email: landing.platformContent?.generalInfo?.email || '',
              description: landing.platformContent?.generalInfo?.description || ''
            },
            socialLinks: {
              facebook: landing.platformContent?.socialLinks?.facebook || '',
              instagram: landing.platformContent?.socialLinks?.instagram || '',
              twitter: landing.platformContent?.socialLinks?.twitter || '',
              youtube: landing.platformContent?.socialLinks?.youtube || '',
              linkedin: landing.platformContent?.socialLinks?.linkedin || ''
            },
            seo: {
              metaTitle: landing.platformContent?.seo?.metaTitle || '',
              metaDescription: landing.platformContent?.seo?.metaDescription || '',
              keywords: landing.platformContent?.seo?.keywords || []
            }
          };

          this.seoKeywords = this.formData.platformContent.seo.keywords.join(', ');
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
    this.formData.platformContent.seo.keywords = this.seoKeywords.split(',').map(k => k.trim()).filter(k => k);

    this.landingService.updatePlatformLanding({
      hero: this.formData.hero,
      platformContent: this.formData.platformContent
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
    this.landingService.togglePlatformPublish(publish).subscribe({
      next: () => {
        this.landing.update(l => l ? { ...l, isPublished: publish } : null);
        this.snackBar.open(publish ? 'Page publiée' : 'Page dépubliée', 'OK', { duration: 3000 });
      }
    });
  }

  uploadHeroImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.landingService.uploadPlatformHeroImage(file).subscribe({
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

  onBannerImageSelect(event) {
    this.selectedBannerImage = event.target.files?.[0] || null;
  }

  addBanner() {
    if (!this.selectedBannerImage) return;
    this.isAddingBanner.set(true);

    this.landingService.addPlatformBanner(this.newBanner, this.selectedBannerImage).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.loadLanding();
          this.newBanner = { title: '', subtitle: '', link: '', linkText: '' };
          this.selectedBannerImage = null;
          this.snackBar.open('Bannière ajoutée', 'OK', { duration: 3000 });
        }
        this.isAddingBanner.set(false);
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'ajout', 'OK', { duration: 3000 });
        this.isAddingBanner.set(false);
      }
    });
  }

  toggleBanner(banner, isActive) {
    this.landingService.updatePlatformBanner(banner._id, { isActive }).subscribe({
      next: () => {
        this.banners.update(banners => banners.map(b => b._id === banner._id ? { ...b, isActive } : b));
      }
    });
  }

  deleteBanner(banner) {
    if (!confirm('Supprimer cette bannière ?')) return;
    this.landingService.deletePlatformBanner(banner._id).subscribe({
      next: () => {
        this.banners.update(banners => banners.filter(b => b._id !== banner._id));
        this.snackBar.open('Bannière supprimée', 'OK', { duration: 3000 });
      }
    });
  }

  dropBanner(event) {
    const bannersCopy = [...this.banners()];
    moveItemInArray(bannersCopy, event.previousIndex, event.currentIndex);
    this.banners.set(bannersCopy);
    const bannerIds = bannersCopy.map(b => b._id);
    this.landingService.reorderPlatformBanners(bannerIds).subscribe();
  }
}
