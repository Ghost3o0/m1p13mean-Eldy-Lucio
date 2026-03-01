import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'welcome' | 'help' | 'faq' | 'default';
  suggestions?: string[];
}

export interface ChatbotResponse {
  success: boolean;
  data: {
    response: string;
    type: 'welcome' | 'help' | 'faq' | 'default';
    question?: string;
    suggestions?: string[];
    questions?: string[];
  };
}

export interface WelcomeResponse {
  success: boolean;
  data: {
    message: string;
    suggestions: string[];
  };
}

export interface FAQResponse {
  success: boolean;
  data: {
    questions: { question: string; answer: string }[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/chatbot`;

  sendMessage(message: string): Observable<ChatbotResponse> {
    return this.http.post<ChatbotResponse>(`${this.apiUrl}/message`, { message });
  }

  getWelcome(): Observable<WelcomeResponse> {
    return this.http.get<WelcomeResponse>(`${this.apiUrl}/welcome`);
  }

  getFAQ(): Observable<FAQResponse> {
    return this.http.get<FAQResponse>(`${this.apiUrl}/faq`);
  }
}
