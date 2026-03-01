import { Component, OnInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatBadgeModule } from '@angular/material/badge';
import { ChatbotService, ChatMessage } from '../../services/chatbot.service';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatBadgeModule
  ],
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.scss'],})
export class ChatWidgetComponent implements OnInit {
  private chatbotService = inject(ChatbotService);

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  isOpen = signal(false);
  isLoading = signal(false);
  messages = signal<ChatMessage[]>([]);
  suggestions = signal<string[]>([]);
  userInput = '';

  ngOnInit(): void {
    this.loadWelcomeMessage();
  }

  toggleChat(): void {
    this.isOpen.update(v => !v);
    if (this.isOpen() && this.messages().length === 0) {
      this.loadWelcomeMessage();
    }
  }

  loadWelcomeMessage(): void {
    this.chatbotService.getWelcome().subscribe({
      next: (response) => {
        this.messages.set([{
          text: response.data.message,
          isUser: false,
          timestamp: new Date(),
          type: 'welcome'
        }]);
        this.suggestions.set(response.data.suggestions);
      },
      error: () => {
        this.messages.set([{
          text: 'Bonjour ! Comment puis-je vous aider ?',
          isUser: false,
          timestamp: new Date(),
          type: 'welcome'
        }]);
      }
    });
  }

  sendMessage(): void {
    const message = this.userInput.trim();
    if (!message) return;

    this.addUserMessage(message);
    this.userInput = '';
    this.suggestions.set([]);
    this.isLoading.set(true);

    this.chatbotService.sendMessage(message).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.addBotMessage(response.data.response, response.data.type);

        if (response.data.suggestions) {
          this.suggestions.set(response.data.suggestions);
        } else if (response.data.questions) {
          this.suggestions.set(response.data.questions.slice(0, 3));
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.addBotMessage('Désolé, une erreur est survenue. Veuillez réessayer.', 'default');
      }
    });
  }

  sendSuggestion(suggestion: string): void {
    this.userInput = suggestion;
    this.sendMessage();
  }

  private addUserMessage(text: string): void {
    this.messages.update(msgs => [...msgs, {
      text,
      isUser: true,
      timestamp: new Date()
    }]);
    this.scrollToBottom();
  }

  private addBotMessage(text: string, type: 'welcome' | 'help' | 'faq' | 'default'): void {
    this.messages.update(msgs => [...msgs, {
      text,
      isUser: false,
      timestamp: new Date(),
      type
    }]);
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        const container = this.messagesContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  formatMessage(text: string): string {
    return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}


