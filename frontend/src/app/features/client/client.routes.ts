import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const CLIENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'catalog',
    loadComponent: () => import('./catalog/catalog.component').then(m => m.CatalogComponent)
  },
  {
    path: 'product/:id',
    loadComponent: () => import('./product-detail/product-detail.component').then(m => m.ProductDetailComponent)
  },
  {
    path: 'shop/:id',
    loadComponent: () => import('./shop-detail/shop-detail.component').then(m => m.ShopDetailComponent)
  },
  {
    path: 'cart',
    loadComponent: () => import('./cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () => import('./checkout/checkout.component').then(m => m.CheckoutComponent)
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () => import('./orders/orders.component').then(m => m.OrdersComponent)
  },
  {
    path: 'orders/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./order-detail/order-detail.component').then(m => m.OrderDetailComponent)
  },
  {
    path: 'favorites',
    canActivate: [authGuard],
    loadComponent: () => import('./favorites/favorites.component').then(m => m.FavoritesComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'tickets',
    canActivate: [authGuard],
    loadComponent: () => import('./tickets/tickets.component').then(m => m.TicketsComponent)
  },
  {
    path: 'tickets/new',
    canActivate: [authGuard],
    loadComponent: () => import('./tickets/tickets.component').then(m => m.TicketsComponent)
  },
  {
    path: 'become-vendor',
    canActivate: [authGuard],
    loadComponent: () => import('./vendor-request/vendor-request.component').then(m => m.VendorRequestComponent)
  }
];
