import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { VendorRequestService, VendorRequest, VendorRequestData } from '@shared/services/vendor-request.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';

interface Category {
  _id: string;
  name: string;
}

@Component({
  selector: 'app-vendor-request',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatStepperModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    LoadingComponent
  ],
  template: `
    <div class="vendor-request-page">
      @if (isLoading()) {
        <app-loading message="Chargement..."></app-loading>
      } @else if (existingRequest()) {
        <!-- Existing Request View -->
        <div class="request-status-view">
          <div class="page-header">
            <h1>Ma demande vendeur</h1>
            <div class="status-badge" [class]="'status-' + existingRequest()!.status">
              {{ getStatusLabel(existingRequest()!.status) }}
            </div>
          </div>

          <!-- Status Timeline -->
          <mat-card class="timeline-card">
            <div class="timeline">
              <div class="timeline-item" [class.active]="isStatusReached('pending')" [class.current]="existingRequest()!.status === 'pending'">
                <div class="timeline-dot"><mat-icon>hourglass_empty</mat-icon></div>
                <span>En attente</span>
              </div>
              <div class="timeline-line" [class.active]="isStatusReached('under_review')"></div>
              <div class="timeline-item" [class.active]="isStatusReached('under_review')" [class.current]="existingRequest()!.status === 'under_review'">
                <div class="timeline-dot"><mat-icon>search</mat-icon></div>
                <span>En cours d'examen</span>
              </div>
              <div class="timeline-line" [class.active]="isStatusReached('approved')"></div>
              <div class="timeline-item" [class.active]="existingRequest()!.status === 'approved'" [class.rejected]="existingRequest()!.status === 'rejected'">
                <div class="timeline-dot">
                  <mat-icon>{{ existingRequest()!.status === 'rejected' ? 'close' : 'check' }}</mat-icon>
                </div>
                <span>{{ existingRequest()!.status === 'rejected' ? 'Rejetee' : 'Approuvee' }}</span>
              </div>
            </div>
          </mat-card>

          @if (existingRequest()!.status === 'documents_requested') {
            <mat-card class="alert-card warning">
              <mat-icon>warning</mat-icon>
              <div>
                <strong>Documents supplementaires requis</strong>
                <p>L'administrateur a besoin de documents supplementaires. Consultez les messages ci-dessous.</p>
              </div>
            </mat-card>
          }

          @if (existingRequest()!.status === 'approved') {
            <mat-card class="alert-card success">
              <mat-icon>celebration</mat-icon>
              <div>
                <strong>Felicitations ! Votre demande a ete approuvee</strong>
                <p>Vous pouvez maintenant acceder a votre espace vendeur et commencer a vendre.</p>
                <button mat-raised-button color="primary" routerLink="/shop/dashboard">
                  Acceder a ma boutique
                </button>
              </div>
            </mat-card>
          }

          @if (existingRequest()!.status === 'rejected') {
            <mat-card class="alert-card error">
              <mat-icon>error</mat-icon>
              <div>
                <strong>Votre demande a ete rejetee</strong>
                @if (existingRequest()!.resolution?.note) {
                  <p>{{ existingRequest()!.resolution!.note }}</p>
                }
              </div>
            </mat-card>
          }

          <!-- Request Details -->
          <mat-card class="details-card">
            <mat-card-header>
              <mat-card-title>Details de la demande</mat-card-title>
              <mat-card-subtitle>#{{ existingRequest()!.requestNumber }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="details-grid">
                <div class="detail-section">
                  <h4>Boutique</h4>
                  <p><strong>{{ existingRequest()!.shopInfo.name }}</strong></p>
                  @if (existingRequest()!.shopInfo.description) {
                    <p class="description">{{ existingRequest()!.shopInfo.description }}</p>
                  }
                </div>
                <div class="detail-section">
                  <h4>Contact professionnel</h4>
                  <p><mat-icon>phone</mat-icon> {{ existingRequest()!.professionalContact.phone }}</p>
                  @if (existingRequest()!.professionalContact.email) {
                    <p><mat-icon>email</mat-icon> {{ existingRequest()!.professionalContact.email }}</p>
                  }
                </div>
                <div class="detail-section">
                  <h4>Informations entreprise</h4>
                  <p><strong>{{ getRegistrationTypeLabel(existingRequest()!.businessInfo.registrationType) }}:</strong> {{ existingRequest()!.businessInfo.registrationNumber }}</p>
                </div>
                <div class="detail-section">
                  <h4>Adresse commerciale</h4>
                  <p>{{ existingRequest()!.commercialAddress.street }}</p>
                  <p>{{ existingRequest()!.commercialAddress.zipCode }} {{ existingRequest()!.commercialAddress.city }}</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Messages -->
          <mat-card class="messages-card">
            <mat-card-header>
              <mat-card-title>Echanges avec l'administrateur</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (existingRequest()!.messages.length === 0) {
                <div class="no-messages">
                  <mat-icon>chat_bubble_outline</mat-icon>
                  <p>Aucun message pour le moment</p>
                </div>
              } @else {
                <div class="messages-list">
                  @for (message of existingRequest()!.messages; track message._id) {
                    <div class="message" [class.own]="message.senderRole === 'client'">
                      <div class="message-bubble">
                        <p>{{ message.content }}</p>
                        <span class="message-time">{{ message.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                      </div>
                      <span class="sender">{{ message.senderRole === 'client' ? 'Vous' : 'Admin' }}</span>
                    </div>
                  }
                </div>
              }

              @if (existingRequest()!.status !== 'approved' && existingRequest()!.status !== 'rejected') {
                <form [formGroup]="messageForm" (ngSubmit)="sendMessage()" class="message-form">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Votre message</mat-label>
                    <textarea matInput formControlName="content" rows="3" placeholder="Tapez votre message..."></textarea>
                  </mat-form-field>
                  <button mat-raised-button color="primary" type="submit" [disabled]="messageForm.invalid || isSendingMessage()">
                    @if (isSendingMessage()) {
                      <mat-spinner diameter="20"></mat-spinner>
                    } @else {
                      <mat-icon>send</mat-icon>
                      Envoyer
                    }
                  </button>
                </form>
              }
            </mat-card-content>
          </mat-card>

          @if (existingRequest()!.status === 'pending') {
            <div class="cancel-action">
              <button mat-stroked-button color="warn" (click)="cancelRequest()">
                <mat-icon>cancel</mat-icon>
                Annuler ma demande
              </button>
            </div>
          }
        </div>
      } @else {
        <!-- New Request Form -->
        <div class="new-request-view">
          <div class="page-header">
            <h1>Devenir vendeur</h1>
            <p>Remplissez le formulaire ci-dessous pour soumettre votre demande</p>
          </div>

          <mat-card class="form-card">
            <mat-stepper linear #stepper>
              <!-- Step 1: Shop Info -->
              <mat-step [stepControl]="shopInfoForm">
                <ng-template matStepLabel>Informations boutique</ng-template>
                <form [formGroup]="shopInfoForm">
                  <div class="step-content">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Nom de la boutique</mat-label>
                      <input matInput formControlName="name" placeholder="Ma Super Boutique">
                      <mat-icon matSuffix>storefront</mat-icon>
                      @if (shopInfoForm.get('name')?.hasError('required') && shopInfoForm.get('name')?.touched) {
                        <mat-error>Le nom est requis</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Description</mat-label>
                      <textarea matInput formControlName="description" rows="4" placeholder="Decrivez votre boutique..."></textarea>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Categorie</mat-label>
                      <mat-select formControlName="category">
                        @for (cat of categories(); track cat._id) {
                          <mat-option [value]="cat._id">{{ cat.name }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>
                  <div class="step-actions">
                    <button mat-raised-button color="primary" matStepperNext [disabled]="shopInfoForm.invalid">
                      Suivant
                      <mat-icon>arrow_forward</mat-icon>
                    </button>
                  </div>
                </form>
              </mat-step>

              <!-- Step 2: Contact -->
              <mat-step [stepControl]="contactForm">
                <ng-template matStepLabel>Contact professionnel</ng-template>
                <form [formGroup]="contactForm">
                  <div class="step-content">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Telephone professionnel</mat-label>
                      <input matInput formControlName="phone" placeholder="06 12 34 56 78">
                      <mat-icon matSuffix>phone</mat-icon>
                      @if (contactForm.get('phone')?.hasError('required') && contactForm.get('phone')?.touched) {
                        <mat-error>Le telephone est requis</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Email professionnel (optionnel)</mat-label>
                      <input matInput formControlName="email" type="email" placeholder="pro@example.com">
                      <mat-icon matSuffix>email</mat-icon>
                      @if (contactForm.get('email')?.hasError('email') && contactForm.get('email')?.touched) {
                        <mat-error>Email invalide</mat-error>
                      }
                    </mat-form-field>
                  </div>
                  <div class="step-actions">
                    <button mat-button matStepperPrevious>
                      <mat-icon>arrow_back</mat-icon>
                      Precedent
                    </button>
                    <button mat-raised-button color="primary" matStepperNext [disabled]="contactForm.invalid">
                      Suivant
                      <mat-icon>arrow_forward</mat-icon>
                    </button>
                  </div>
                </form>
              </mat-step>

              <!-- Step 3: Business Info -->
              <mat-step [stepControl]="businessForm">
                <ng-template matStepLabel>Informations entreprise</ng-template>
                <form [formGroup]="businessForm">
                  <div class="step-content">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Type d'immatriculation</mat-label>
                      <mat-select formControlName="registrationType">
                        <mat-option value="siret">SIRET</mat-option>
                        <mat-option value="rc">Registre du Commerce (RC)</mat-option>
                        <mat-option value="other">Autre</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Numero d'immatriculation</mat-label>
                      <input matInput formControlName="registrationNumber" placeholder="123 456 789 00012">
                      <mat-icon matSuffix>badge</mat-icon>
                      @if (businessForm.get('registrationNumber')?.hasError('required') && businessForm.get('registrationNumber')?.touched) {
                        <mat-error>Le numero est requis</mat-error>
                      }
                    </mat-form-field>

                    <h4>Adresse commerciale</h4>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Adresse</mat-label>
                      <input matInput formControlName="street" placeholder="123 Rue du Commerce">
                      @if (businessForm.get('street')?.hasError('required') && businessForm.get('street')?.touched) {
                        <mat-error>L'adresse est requise</mat-error>
                      }
                    </mat-form-field>

                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>Code postal</mat-label>
                        <input matInput formControlName="zipCode" placeholder="75001">
                        @if (businessForm.get('zipCode')?.hasError('required') && businessForm.get('zipCode')?.touched) {
                          <mat-error>Requis</mat-error>
                        }
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Ville</mat-label>
                        <input matInput formControlName="city" placeholder="Paris">
                        @if (businessForm.get('city')?.hasError('required') && businessForm.get('city')?.touched) {
                          <mat-error>Requise</mat-error>
                        }
                      </mat-form-field>
                    </div>
                  </div>
                  <div class="step-actions">
                    <button mat-button matStepperPrevious>
                      <mat-icon>arrow_back</mat-icon>
                      Precedent
                    </button>
                    <button mat-raised-button color="primary" matStepperNext [disabled]="businessForm.invalid">
                      Suivant
                      <mat-icon>arrow_forward</mat-icon>
                    </button>
                  </div>
                </form>
              </mat-step>

              <!-- Step 4: Documents -->
              <mat-step [stepControl]="documentsForm">
                <ng-template matStepLabel>Documents</ng-template>
                <form [formGroup]="documentsForm">
                  <div class="step-content">
                    <p class="step-description">
                      Veuillez telecharger les documents requis pour verifier votre identite et votre entreprise.
                    </p>

                    <div class="upload-section">
                      <label class="upload-label">Piece d'identite *</label>
                      <div class="upload-box" [class.has-file]="idDocumentFile()" (click)="idDocumentInput.click()">
                        <input #idDocumentInput type="file" accept=".pdf,.jpg,.jpeg,.png" (change)="onIdDocumentSelected($event)" hidden>
                        @if (idDocumentFile()) {
                          <mat-icon>check_circle</mat-icon>
                          <span>{{ idDocumentFile()!.name }}</span>
                          <button mat-icon-button (click)="removeIdDocument(); $event.stopPropagation()">
                            <mat-icon>close</mat-icon>
                          </button>
                        } @else {
                          <mat-icon>upload_file</mat-icon>
                          <span>Cliquez pour telecharger</span>
                          <small>PDF, JPG ou PNG (max 5MB)</small>
                        }
                      </div>
                    </div>

                    <div class="upload-section">
                      <label class="upload-label">Document d'entreprise (optionnel)</label>
                      <div class="upload-box" [class.has-file]="businessDocumentFile()" (click)="businessDocumentInput.click()">
                        <input #businessDocumentInput type="file" accept=".pdf,.jpg,.jpeg,.png" (change)="onBusinessDocumentSelected($event)" hidden>
                        @if (businessDocumentFile()) {
                          <mat-icon>check_circle</mat-icon>
                          <span>{{ businessDocumentFile()!.name }}</span>
                          <button mat-icon-button (click)="removeBusinessDocument(); $event.stopPropagation()">
                            <mat-icon>close</mat-icon>
                          </button>
                        } @else {
                          <mat-icon>upload_file</mat-icon>
                          <span>Kbis, extrait RC, etc.</span>
                          <small>PDF, JPG ou PNG (max 5MB)</small>
                        }
                      </div>
                    </div>
                  </div>
                  <div class="step-actions">
                    <button mat-button matStepperPrevious>
                      <mat-icon>arrow_back</mat-icon>
                      Precedent
                    </button>
                    <button mat-raised-button color="primary" matStepperNext [disabled]="!idDocumentFile()">
                      Suivant
                      <mat-icon>arrow_forward</mat-icon>
                    </button>
                  </div>
                </form>
              </mat-step>

              <!-- Step 5: Review -->
              <mat-step>
                <ng-template matStepLabel>Verification</ng-template>
                <div class="step-content">
                  <h3>Recapitulatif de votre demande</h3>

                  <div class="review-sections">
                    <div class="review-section">
                      <h4><mat-icon>storefront</mat-icon> Boutique</h4>
                      <p><strong>{{ shopInfoForm.get('name')?.value }}</strong></p>
                      <p>{{ shopInfoForm.get('description')?.value || 'Pas de description' }}</p>
                    </div>

                    <div class="review-section">
                      <h4><mat-icon>phone</mat-icon> Contact</h4>
                      <p>{{ contactForm.get('phone')?.value }}</p>
                      <p>{{ contactForm.get('email')?.value || 'Pas d\'email' }}</p>
                    </div>

                    <div class="review-section">
                      <h4><mat-icon>business</mat-icon> Entreprise</h4>
                      <p>{{ getRegistrationTypeLabel(businessForm.get('registrationType')?.value) }}: {{ businessForm.get('registrationNumber')?.value }}</p>
                      <p>{{ businessForm.get('street')?.value }}</p>
                      <p>{{ businessForm.get('zipCode')?.value }} {{ businessForm.get('city')?.value }}</p>
                    </div>

                    <div class="review-section">
                      <h4><mat-icon>description</mat-icon> Documents</h4>
                      <p>Piece d'identite: {{ idDocumentFile()?.name }}</p>
                      @if (businessDocumentFile()) {
                        <p>Document entreprise: {{ businessDocumentFile()?.name }}</p>
                      }
                    </div>
                  </div>

                  <div class="terms-check">
                    <label class="checkbox-label">
                      <input type="checkbox" [(ngModel)]="acceptTerms" [ngModelOptions]="{standalone: true}">
                      <span class="checkmark"></span>
                      <span>J'accepte les conditions generales et certifie que les informations fournies sont exactes</span>
                    </label>
                  </div>
                </div>
                <div class="step-actions">
                  <button mat-button matStepperPrevious>
                    <mat-icon>arrow_back</mat-icon>
                    Precedent
                  </button>
                  <button mat-raised-button color="primary" [disabled]="!acceptTerms || isSubmitting()" (click)="submitRequest()">
                    @if (isSubmitting()) {
                      <mat-spinner diameter="20"></mat-spinner>
                      <span>Envoi en cours...</span>
                    } @else {
                      <mat-icon>send</mat-icon>
                      Soumettre ma demande
                    }
                  </button>
                </div>
              </mat-step>
            </mat-stepper>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .vendor-request-page {
      max-width: 900px;
      margin: 0 auto;
      padding: 24px;
    }

    .page-header {
      margin-bottom: 24px;

      h1 {
        font-size: 2rem;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 8px;
      }

      p {
        color: var(--text-secondary);
        margin: 0;
      }
    }

    .request-status-view .page-header {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .status-badge {
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;

      &.status-pending {
        background: var(--warning-light);
        color: var(--warning);
      }

      &.status-under_review {
        background: var(--primary-50);
        color: var(--primary);
      }

      &.status-documents_requested {
        background: var(--secondary-light);
        color: var(--secondary);
      }

      &.status-approved {
        background: var(--success-light);
        color: var(--success);
      }

      &.status-rejected {
        background: var(--error-light);
        color: var(--error);
      }
    }

    /* Timeline */
    .timeline-card {
      padding: 24px;
      margin-bottom: 24px;
    }

    .timeline {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .timeline-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      opacity: 0.4;

      &.active {
        opacity: 1;
      }

      &.current .timeline-dot {
        background: linear-gradient(135deg, #667eea, #764ba2);
        animation: pulse 2s infinite;
      }

      &.rejected .timeline-dot {
        background: var(--error);
      }

      span {
        font-size: 0.85rem;
        color: var(--text-secondary);
        white-space: nowrap;
      }
    }

    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4); }
      50% { box-shadow: 0 0 0 10px rgba(102, 126, 234, 0); }
    }

    .timeline-dot {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--gray-300);
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        color: white;
      }
    }

    .timeline-item.active .timeline-dot {
      background: var(--primary);
    }

    .timeline-line {
      width: 60px;
      height: 3px;
      background: var(--gray-300);
      margin: 0 8px 24px;

      &.active {
        background: var(--primary);
      }
    }

    /* Alert Cards */
    .alert-card {
      display: flex;
      gap: 16px;
      padding: 20px;
      margin-bottom: 24px;
      border-radius: 12px;

      &.warning {
        background: var(--warning-light);
        border-left: 4px solid var(--warning);

        mat-icon { color: var(--warning); }
      }

      &.success {
        background: var(--success-light);
        border-left: 4px solid var(--success);

        mat-icon { color: var(--success); }
      }

      &.error {
        background: var(--error-light);
        border-left: 4px solid var(--error);

        mat-icon { color: var(--error); }
      }

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      strong {
        display: block;
        margin-bottom: 4px;
      }

      p {
        margin: 0 0 12px;
        color: var(--text-secondary);
      }
    }

    /* Details Card */
    .details-card {
      margin-bottom: 24px;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      margin-top: 16px;

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }

    .detail-section {
      h4 {
        font-size: 0.85rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        margin: 0 0 8px;
      }

      p {
        margin: 4px 0;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        gap: 8px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: var(--primary);
        }
      }

      .description {
        color: var(--text-secondary);
        font-size: 0.9rem;
      }
    }

    /* Messages */
    .messages-card {
      margin-bottom: 24px;
    }

    .no-messages {
      text-align: center;
      padding: 40px;
      color: var(--text-secondary);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        opacity: 0.5;
      }

      p {
        margin: 8px 0 0;
      }
    }

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
      max-height: 400px;
      overflow-y: auto;
      padding: 16px 0;
    }

    .message {
      display: flex;
      flex-direction: column;
      align-items: flex-start;

      &.own {
        align-items: flex-end;

        .message-bubble {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;

          .message-time {
            color: rgba(255, 255, 255, 0.7);
          }
        }
      }
    }

    .message-bubble {
      max-width: 80%;
      padding: 12px 16px;
      background: var(--bg-secondary);
      border-radius: 12px;

      p {
        margin: 0 0 4px;
        line-height: 1.5;
      }

      .message-time {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
    }

    .sender {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    .message-form {
      display: flex;
      gap: 12px;
      align-items: flex-end;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);

      mat-form-field {
        flex: 1;
      }
    }

    .cancel-action {
      text-align: center;
      padding: 24px 0;
    }

    /* Form Styles */
    .form-card {
      padding: 24px;
    }

    .step-content {
      padding: 24px 0;

      h3 {
        margin: 0 0 24px;
        color: var(--text-primary);
      }

      h4 {
        margin: 24px 0 16px;
        color: var(--text-primary);
        font-size: 1rem;
      }
    }

    .step-description {
      color: var(--text-secondary);
      margin-bottom: 24px;
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

    .step-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 16px;
    }

    /* Upload */
    .upload-section {
      margin-bottom: 24px;
    }

    .upload-label {
      display: block;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    .upload-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      border: 2px dashed var(--border-color);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;

      &:hover {
        border-color: var(--primary);
        background: var(--primary-50);
      }

      &.has-file {
        border-style: solid;
        border-color: var(--success);
        background: var(--success-light);
        flex-direction: row;
        gap: 12px;

        mat-icon {
          color: var(--success);
        }
      }

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: var(--text-secondary);
        margin-bottom: 8px;
      }

      span {
        color: var(--text-secondary);
      }

      small {
        color: var(--text-secondary);
        font-size: 0.8rem;
        margin-top: 4px;
      }
    }

    /* Review */
    .review-sections {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      margin-bottom: 24px;

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }

    .review-section {
      padding: 16px;
      background: var(--bg-secondary);
      border-radius: 12px;

      h4 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 12px;
        color: var(--primary);
        font-size: 0.9rem;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      p {
        margin: 4px 0;
        color: var(--text-primary);

        &:first-of-type {
          font-weight: 500;
        }
      }
    }

    .terms-check {
      padding: 16px;
      background: var(--warning-light);
      border-radius: 12px;
      margin-top: 24px;
    }

    .checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      cursor: pointer;

      input {
        display: none;

        &:checked + .checkmark {
          background: var(--primary);
          border-color: var(--primary);

          &::after {
            display: block;
          }
        }
      }

      .checkmark {
        width: 20px;
        height: 20px;
        border: 2px solid var(--border-color);
        border-radius: 4px;
        position: relative;
        flex-shrink: 0;
        margin-top: 2px;

        &::after {
          content: '';
          position: absolute;
          display: none;
          left: 6px;
          top: 2px;
          width: 5px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
      }

      span:last-child {
        font-size: 0.9rem;
        color: var(--text-secondary);
        line-height: 1.5;
      }
    }

    @media (max-width: 768px) {
      .vendor-request-page {
        padding: 16px;
      }

      .page-header h1 {
        font-size: 1.5rem;
      }

      .timeline {
        flex-direction: column;
      }

      .timeline-line {
        width: 3px;
        height: 30px;
        margin: 8px 0;
      }

      .form-row {
        flex-direction: column;
        gap: 0;
      }
    }
  `]
})
export class VendorRequestComponent implements OnInit {
  isLoading = signal(true);
  isSubmitting = signal(false);
  isSendingMessage = signal(false);
  existingRequest = signal<VendorRequest | null>(null);
  categories = signal<Category[]>([]);

  // Form groups
  shopInfoForm: FormGroup;
  contactForm: FormGroup;
  businessForm: FormGroup;
  documentsForm: FormGroup;
  messageForm: FormGroup;

  // File uploads
  idDocumentFile = signal<File | null>(null);
  businessDocumentFile = signal<File | null>(null);

  acceptTerms = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private vendorRequestService: VendorRequestService,
    private router: Router
  ) {
    this.shopInfoForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      category: ['']
    });

    this.contactForm = this.fb.group({
      phone: ['', Validators.required],
      email: ['', Validators.email]
    });

    this.businessForm = this.fb.group({
      registrationType: ['siret'],
      registrationNumber: ['', Validators.required],
      street: ['', Validators.required],
      city: ['', Validators.required],
      zipCode: ['', Validators.required]
    });

    this.documentsForm = this.fb.group({});

    this.messageForm = this.fb.group({
      content: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    // Load categories
    this.http.get<any>(`${environment.apiUrl}/products/categories`).subscribe({
      next: (response) => {
        if (response.success) {
          this.categories.set(response.data.categories);
        }
      }
    });

    // Check for existing request
    this.vendorRequestService.getMyRequest().subscribe({
      next: (response) => {
        if (response.success) {
          this.existingRequest.set(response.data.vendorRequest);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onIdDocumentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.idDocumentFile.set(input.files[0]);
    }
  }

  removeIdDocument(): void {
    this.idDocumentFile.set(null);
  }

  onBusinessDocumentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.businessDocumentFile.set(input.files[0]);
    }
  }

  removeBusinessDocument(): void {
    this.businessDocumentFile.set(null);
  }

  submitRequest(): void {
    if (!this.acceptTerms || !this.idDocumentFile()) return;

    this.isSubmitting.set(true);

    const data: VendorRequestData = {
      shopInfo: {
        name: this.shopInfoForm.get('name')?.value,
        description: this.shopInfoForm.get('description')?.value,
        category: this.shopInfoForm.get('category')?.value
      },
      professionalContact: {
        phone: this.contactForm.get('phone')?.value,
        email: this.contactForm.get('email')?.value
      },
      businessInfo: {
        registrationNumber: this.businessForm.get('registrationNumber')?.value,
        registrationType: this.businessForm.get('registrationType')?.value
      },
      commercialAddress: {
        street: this.businessForm.get('street')?.value,
        city: this.businessForm.get('city')?.value,
        zipCode: this.businessForm.get('zipCode')?.value
      }
    };

    const formData = this.vendorRequestService.createFormData(
      data,
      this.idDocumentFile()!,
      this.businessDocumentFile() || undefined
    );

    this.vendorRequestService.submitRequest(formData).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        if (response.success) {
          this.existingRequest.set(response.data.vendorRequest);
        }
      },
      error: () => {
        this.isSubmitting.set(false);
      }
    });
  }

  sendMessage(): void {
    if (this.messageForm.invalid || !this.existingRequest()) return;

    this.isSendingMessage.set(true);

    this.vendorRequestService.sendMessage(
      this.existingRequest()!._id,
      this.messageForm.get('content')?.value
    ).subscribe({
      next: (response) => {
        this.isSendingMessage.set(false);
        if (response.success) {
          this.messageForm.reset();
          this.existingRequest.set(response.data.vendorRequest);
        }
      },
      error: () => {
        this.isSendingMessage.set(false);
      }
    });
  }

  cancelRequest(): void {
    if (!this.existingRequest()) return;

    if (confirm('Etes-vous sur de vouloir annuler votre demande ?')) {
      this.vendorRequestService.cancelRequest(this.existingRequest()!._id).subscribe({
        next: (response) => {
          if (response.success) {
            this.existingRequest.set(null);
          }
        }
      });
    }
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      under_review: 'En cours d\'examen',
      documents_requested: 'Documents requis',
      approved: 'Approuvee',
      rejected: 'Rejetee'
    };
    return labels[status] || status;
  }

  getRegistrationTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      siret: 'SIRET',
      rc: 'Registre du Commerce',
      other: 'Autre'
    };
    return labels[type] || type;
  }

  isStatusReached(status: string): boolean {
    const order = ['pending', 'under_review', 'approved'];
    const currentIndex = order.indexOf(this.existingRequest()?.status || '');
    const statusIndex = order.indexOf(status);

    if (this.existingRequest()?.status === 'documents_requested') {
      return statusIndex <= 1;
    }

    return statusIndex <= currentIndex;
  }
}
