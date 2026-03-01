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
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class AdminLandingComponent implements OnInit {
  landing = signal<any>(null);
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

  socialLinks = [
    { name: 'facebook', icon: 'facebook' },
    { name: 'instagram', icon: 'instagram' },
    { name: 'twitter', icon: 'twitter' },
    { name: 'youtube', icon: 'youtube' },
    { name: 'linkedin', icon: 'linkedin' }
  ];

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

  // helpers used by template bindings
  heroImage() {
    return this.formData.hero.backgroundImage;
  }

  onHeroImageSelected(event: any) {
    this.uploadHeroImage(event);
  }

  saveHero() {
    this.save();
  }

  saveInfo() {
    this.save();
  }

  saveSocial() {
    this.save();
  }

  saveSeo() {
    this.save();
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
