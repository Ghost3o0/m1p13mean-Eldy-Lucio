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
  template: `
    <div class="chat-widget">
      <!-- Chat Toggle Button -->
      <button
        class="chat-toggle-btn"
        (click)="toggleChat()"
        [class.chat-open]="isOpen()">
        <mat-icon>{{ isOpen() ? 'close' : 'chat' }}</mat-icon>
      </button>

      <!-- Chat Window -->
      @if (isOpen()) {
        <div class="chat-window" [@.disabled]="true">
          <!-- Header -->
          <div class="chat-header">
            <div class="header-info">
              <mat-icon>support_agent</mat-icon>
              <div class="header-text">
                <span class="header-title">Assistant Bazar'Be</span>
                <span class="header-status">En ligne</span>
              </div>
            </div>
            <button mat-icon-button (click)="toggleChat()">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <!-- Messages -->
          <div class="chat-messages" #messagesContainer>
            @for (message of messages(); track $index) {
              <div class="message" [class.user-message]="message.isUser" [class.bot-message]="!message.isUser">
                @if (!message.isUser) {
                  <div class="message-avatar">
                    <mat-icon>smart_toy</mat-icon>
                  </div>
                }
                <div class="message-content">
                  <div class="message-text" [innerHTML]="formatMessage(message.text)"></div>
                  <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                </div>
              </div>
            }

            @if (isLoading()) {
              <div class="message bot-message">
                <div class="message-avatar">
                  <mat-icon>smart_toy</mat-icon>
                </div>
                <div class="message-content">
                  <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Suggestions -->
          @if (suggestions().length > 0 && !isLoading()) {
            <div class="suggestions">
              @for (suggestion of suggestions(); track suggestion) {
                <button class="suggestion-btn" (click)="sendSuggestion(suggestion)">
                  {{ suggestion }}
                </button>
              }
            </div>
          }

          <!-- Input -->
          <div class="chat-input">
            <input
              type="text"
              [(ngModel)]="userInput"
              (keyup.enter)="sendMessage()"
              placeholder="Tapez votre message..."
              [disabled]="isLoading()">
            <button
              mat-icon-button
              color="primary"
              (click)="sendMessage()"
              [disabled]="!userInput.trim() || isLoading()">
              <mat-icon>send</mat-icon>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .chat-widget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
    }

    .chat-toggle-btn {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        color: white;
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      &:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 25px rgba(102, 126, 234, 0.5);
      }

      &.chat-open {
        background: #f44336;
      }
    }

    .chat-window {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 380px;
      height: 500px;
      background: var(--surface-card);
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .chat-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: white;

      .header-info {
        display: flex;
        align-items: center;
        gap: 12px;

        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
        }

        .header-text {
          display: flex;
          flex-direction: column;

          .header-title {
            font-weight: 600;
            font-size: 16px;
          }

          .header-status {
            font-size: 12px;
            opacity: 0.9;
          }
        }
      }

      button {
        color: white;
      }
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: var(--surface-ground);
    }

    .message {
      display: flex;
      gap: 8px;
      max-width: 85%;

      &.user-message {
        align-self: flex-end;
        flex-direction: row-reverse;

        .message-content {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 16px 16px 4px 16px;

          .message-time {
            color: rgba(255, 255, 255, 0.8);
          }
        }
      }

      &.bot-message {
        align-self: flex-start;

        .message-content {
          background: var(--surface-card);
          border-radius: 16px 16px 16px 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
      }
    }

    .message-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        color: white;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .message-content {
      padding: 12px 16px;

      .message-text {
        font-size: 14px;
        line-height: 1.5;
        white-space: pre-line;
      }

      .message-time {
        font-size: 10px;
        opacity: 0.7;
        margin-top: 4px;
        display: block;
      }
    }

    .typing-indicator {
      display: flex;
      gap: 4px;
      padding: 4px 0;

      span {
        width: 8px;
        height: 8px;
        background: #667eea;
        border-radius: 50%;
        animation: typing 1.4s infinite ease-in-out;

        &:nth-child(1) { animation-delay: 0s; }
        &:nth-child(2) { animation-delay: 0.2s; }
        &:nth-child(3) { animation-delay: 0.4s; }
      }
    }

    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.5;
      }
      30% {
        transform: translateY(-8px);
        opacity: 1;
      }
    }

    .suggestions {
      padding: 8px 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      background: var(--surface-ground);
      border-top: 1px solid var(--surface-border);
    }

    .suggestion-btn {
      background: var(--surface-card);
      border: 1px solid var(--primary-color);
      color: var(--primary-color);
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: var(--primary-color);
        color: white;
      }
    }

    .chat-input {
      padding: 12px 16px;
      display: flex;
      gap: 8px;
      background: var(--surface-card);
      border-top: 1px solid var(--surface-border);

      input {
        flex: 1;
        border: 1px solid var(--surface-border);
        border-radius: 24px;
        padding: 10px 16px;
        font-size: 14px;
        outline: none;
        background: var(--surface-ground);
        color: var(--text-color);

        &:focus {
          border-color: var(--primary-color);
        }

        &::placeholder {
          color: var(--text-color-secondary);
        }
      }

      button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

        mat-icon {
          color: white;
        }

        &:disabled {
          opacity: 0.5;
        }
      }
    }

    @media (max-width: 480px) {
      .chat-widget {
        bottom: 10px;
        right: 10px;
      }

      .chat-window {
        width: calc(100vw - 20px);
        height: calc(100vh - 100px);
        bottom: 70px;
        right: 0;
        border-radius: 12px;
      }

      .chat-toggle-btn {
        width: 50px;
        height: 50px;

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }
    }
  `]
})
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
