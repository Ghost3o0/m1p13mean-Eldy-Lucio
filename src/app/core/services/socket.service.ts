// import { Injectable, signal } from '@angular/core';
// import { io, Socket } from 'socket.io-client';
// import { environment } from '@env/environment';
// import { StorageService } from './storage.service';
// import { Observable, Subject } from 'rxjs';

// export interface Notification {
//   _id: string;
//   type: string;
//   title: string;
//   message: string;
//   data?: any;
//   createdAt: string;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class SocketService {
//   private socket: Socket | null = null;
//   private isConnectedSignal = signal<boolean>(false);

//   isConnected = this.isConnectedSignal.asReadonly();

//   // Event subjects
//   private notificationSubject = new Subject<Notification>();
//   private orderUpdateSubject = new Subject<any>();
//   private newOrderSubject = new Subject<any>();

//   // Public observables
//   notifications$ = this.notificationSubject.asObservable();
//   orderUpdates$ = this.orderUpdateSubject.asObservable();
//   newOrders$ = this.newOrderSubject.asObservable();

//   constructor(private storageService: StorageService) {}

//   // Connect to socket server
//   connect(): void {
//     if (this.socket?.connected) return;

//     const token = this.storageService.getToken();
//     if (!token) return;

//     this.socket = io(environment.socketUrl, {
//       auth: { token },
//       transports: ['websocket', 'polling']
//     });

//     this.setupEventListeners();
//   }

//   // Disconnect from socket server
//   disconnect(): void {
//     if (this.socket) {
//       this.socket.disconnect();
//       this.socket = null;
//       this.isConnectedSignal.set(false);
//     }
//   }

//   // Setup event listeners
//   private setupEventListeners(): void {
//     if (!this.socket) return;

//     this.socket.on('connect', () => {
//       console.log('Socket connected');
//       this.isConnectedSignal.set(true);
//     });

//     this.socket.on('disconnect', () => {
//       console.log('Socket disconnected');
//       this.isConnectedSignal.set(false);
//     });

//     this.socket.on('connect_error', (error) => {
//       console.error('Socket connection error:', error);
//       this.isConnectedSignal.set(false);
//     });

//     // Listen for notifications
//     this.socket.on('notification', (notification: Notification) => {
//       this.notificationSubject.next(notification);
//     });

//     // Listen for order status updates
//     this.socket.on('order_status_update', (data: any) => {
//       this.orderUpdateSubject.next(data);
//     });

//     // Listen for new orders (for shop owners)
//     this.socket.on('new_order', (data: any) => {
//       this.newOrderSubject.next(data);
//     });
//   }

//   // Join a specific room
//   joinShop(shopId: string): void {
//     if (this.socket?.connected) {
//       this.socket.emit('join:shop', shopId);
//     }
//   }

//   // Leave a specific room
//   leaveShop(shopId: string): void {
//     if (this.socket?.connected) {
//       this.socket.emit('leave:shop', shopId);
//     }
//   }

//   // Generic event listener
//   on<T>(event: string): Observable<T> {
//     return new Observable<T>(observer => {
//       if (!this.socket) {
//         observer.error('Socket not connected');
//         return;
//       }

//       this.socket.on(event, (data: T) => {
//         observer.next(data);
//       });

//       return () => {
//         this.socket?.off(event);
//       };
//     });
//   }

//   // Emit event
//   emit(event: string, data?: any): void {
//     if (this.socket?.connected) {
//       this.socket.emit(event, data);
//     }
//   }
// }
