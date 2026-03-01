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
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],})
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


