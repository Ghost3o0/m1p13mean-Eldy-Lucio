import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface VendorRequestData {
  shopInfo: {
    name: string;
    description?: string;
    category?: string;
  };
  professionalContact: {
    phone: string;
    email?: string;
  };
  businessInfo: {
    registrationNumber: string;
    registrationType: 'siret' | 'rc' | 'other';
  };
  commercialAddress: {
    street: string;
    city: string;
    zipCode: string;
    country?: string;
  };
}

export interface VendorRequest {
  _id: string;
  requestNumber: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  shopInfo: {
    name: string;
    description?: string;
    category?: {
      _id: string;
      name: string;
    };
  };
  professionalContact: {
    phone: string;
    email?: string;
  };
  businessInfo: {
    registrationNumber: string;
    registrationType: string;
  };
  commercialAddress: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  documents: {
    idDocument?: {
      filename: string;
      path: string;
    };
    businessDocument?: {
      filename: string;
      path: string;
    };
    additionalDocuments: {
      filename: string;
      path: string;
      label?: string;
    }[];
  };
  messages: {
    _id: string;
    senderId: {
      _id: string;
      firstName: string;
      lastName: string;
    };
    senderRole: 'client' | 'admin';
    content: string;
    attachments: { filename: string; path: string }[];
    isRead: boolean;
    createdAt: string;
  }[];
  status: 'pending' | 'under_review' | 'documents_requested' | 'approved' | 'rejected';
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  resolution?: {
    resolvedBy: {
      _id: string;
      firstName: string;
      lastName: string;
    };
    resolvedAt: string;
    note: string;
  };
  shopId?: {
    _id: string;
    name: string;
    slug: string;
  };
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class VendorRequestService {
  private readonly apiUrl = `${environment.apiUrl}/vendor-requests`;

  constructor(private http: HttpClient) {}

  // Submit a new vendor request
  submitRequest(data: FormData): Observable<{
    success: boolean;
    message: string;
    data: { vendorRequest: VendorRequest };
  }> {
    return this.http.post<any>(this.apiUrl, data);
  }

  // Get current user's vendor request
  getMyRequest(): Observable<{
    success: boolean;
    data: { vendorRequest: VendorRequest };
  }> {
    return this.http.get<any>(`${this.apiUrl}/my`);
  }

  // Get vendor request by ID
  getRequest(id: string): Observable<{
    success: boolean;
    data: { vendorRequest: VendorRequest };
  }> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Send a message
  sendMessage(id: string, content: string, attachments?: File[]): Observable<{
    success: boolean;
    message: string;
    data: { vendorRequest: VendorRequest };
  }> {
    const formData = new FormData();
    formData.append('content', content);

    if (attachments) {
      attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }

    return this.http.post<any>(`${this.apiUrl}/${id}/message`, formData);
  }

  // Upload additional documents
  uploadDocuments(id: string, files: File[], label?: string): Observable<{
    success: boolean;
    message: string;
    data: { vendorRequest: VendorRequest };
  }> {
    const formData = new FormData();

    files.forEach(file => {
      formData.append('documents', file);
    });

    if (label) {
      formData.append('label', label);
    }

    return this.http.post<any>(`${this.apiUrl}/${id}/documents`, formData);
  }

  // Cancel/withdraw request
  cancelRequest(id: string): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // Helper to create FormData from request data
  createFormData(data: VendorRequestData, idDocument?: File, businessDocument?: File): FormData {
    const formData = new FormData();

    // Shop info
    formData.append('shopInfo[name]', data.shopInfo.name);
    if (data.shopInfo.description) {
      formData.append('shopInfo[description]', data.shopInfo.description);
    }
    if (data.shopInfo.category) {
      formData.append('shopInfo[category]', data.shopInfo.category);
    }

    // Professional contact
    formData.append('professionalContact[phone]', data.professionalContact.phone);
    if (data.professionalContact.email) {
      formData.append('professionalContact[email]', data.professionalContact.email);
    }

    // Business info
    formData.append('businessInfo[registrationNumber]', data.businessInfo.registrationNumber);
    formData.append('businessInfo[registrationType]', data.businessInfo.registrationType);

    // Commercial address
    formData.append('commercialAddress[street]', data.commercialAddress.street);
    formData.append('commercialAddress[city]', data.commercialAddress.city);
    formData.append('commercialAddress[zipCode]', data.commercialAddress.zipCode);
    if (data.commercialAddress.country) {
      formData.append('commercialAddress[country]', data.commercialAddress.country);
    }

    // Documents
    if (idDocument) {
      formData.append('idDocument', idDocument);
    }
    if (businessDocument) {
      formData.append('businessDocument', businessDocument);
    }

    return formData;
  }
}
