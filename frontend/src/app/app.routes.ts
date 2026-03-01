import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { shopGuard } from './core/guards/shop.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  // Client routes with ClientLayout
  {
    path: '',
    loadComponent: () => import('./features/client/layout/client-layout.component').then(m => m.ClientLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/client/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'catalog',
        loadComponent: () => import('./features/client/catalog/catalog.component').then(m => m.CatalogComponent)
      },
      {
        path: 'product/:id',
        loadComponent: () => import('./features/client/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
      },
      {
        path: 'cart',
        loadComponent: () => import('./features/client/cart/cart.component').then(m => m.CartComponent)
      },
      {
        path: 'checkout',
        canActivate: [authGuard],
        loadComponent: () => import('./features/client/checkout/checkout.component').then(m => m.CheckoutComponent)
      },
      {
        path: 'orders',
        canActivate: [authGuard],
        loadComponent: () => import('./features/client/orders/orders.component').then(m => m.OrdersComponent)
      },
      {
        path: 'orders/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./features/client/order-detail/order-detail.component').then(m => m.OrderDetailComponent)
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () => import('./features/client/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'favorites',
        canActivate: [authGuard],
        loadComponent: () => import('./features/client/favorites/favorites.component').then(m => m.FavoritesComponent)
      },
      {
        path: 'become-vendor',
        canActivate: [authGuard],
        loadComponent: () => import('./features/client/vendor-request/vendor-request.component').then(m => m.VendorRequestComponent)
      },
      {
        path: 'reservations',
        canActivate: [authGuard],
        loadComponent: () => import('./features/client/reservations/reservations.component').then(m => m.ClientReservationsComponent)
      },
      {
        path: 'shop/:id',
        loadComponent: () => import('./features/client/shop-page/shop-page.component').then(m => m.ShopPageComponent)
      }
    ]
  },

  // Auth routes (no layout - standalone pages)
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },

  // Admin routes with AdminLayout
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'shops',
        loadComponent: () => import('./features/admin/shops/shops.component').then(m => m.AdminShopsComponent)
      },
      {
        path: 'shops/:id',
        loadComponent: () => import('./features/admin/shops/shop-detail/shop-detail.component').then(m => m.AdminShopDetailComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/admin/categories/categories.component').then(m => m.AdminCategoriesComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/users/users.component').then(m => m.AdminUsersComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/admin/orders/orders.component').then(m => m.AdminOrdersComponent)
      },
      {
        path: 'tickets',
        loadComponent: () => import('./features/admin/tickets/tickets.component').then(m => m.AdminTicketsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/admin/settings/settings.component').then(m => m.AdminSettingsComponent)
      },
      {
        path: 'vendor-requests',
        loadComponent: () => import('./features/admin/vendor-requests/vendor-requests.component').then(m => m.AdminVendorRequestsComponent)
      },
      {
        path: 'boxes',
        loadComponent: () => import('./features/admin/boxes/boxes.component').then(m => m.AdminBoxesComponent)
      },
      {
        path: 'rent-payments',
        loadComponent: () => import('./features/admin/rent-payments/rent-payments.component').then(m => m.AdminRentPaymentsComponent)
      },
      {
        path: 'shop-requests',
        loadComponent: () => import('./features/admin/shop-requests/shop-requests.component').then(m => m.AdminShopRequestsComponent)
      },
      {
        path: 'landing',
        loadComponent: () => import('./features/admin/landing/landing.component').then(m => m.AdminLandingComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // Shop manager routes with ShopLayout
  {
    path: 'shop-manager',
    loadComponent: () => import('./features/shop-manager/layout/shop-layout.component').then(m => m.ShopLayoutComponent),
    canActivate: [authGuard, shopGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/shop-manager/dashboard/dashboard.component').then(m => m.ShopDashboardComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./features/shop-manager/products/products.component').then(m => m.ShopProductsComponent)
      },
      {
        path: 'products/new',
        loadComponent: () => import('./features/shop-manager/products/product-form/product-form.component').then(m => m.ProductFormComponent)
      },
      {
        path: 'products/:id',
        loadComponent: () => import('./features/shop-manager/products/product-form/product-form.component').then(m => m.ProductFormComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/shop-manager/orders/orders.component').then(m => m.ShopOrdersComponent)
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./features/shop-manager/orders/order-detail/order-detail.component').then(m => m.ShopOrderDetailComponent)
      },
      {
        path: 'promotions',
        loadComponent: () => import('./features/shop-manager/promotions/promotions.component').then(m => m.ShopPromotionsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/shop-manager/settings/settings.component').then(m => m.ShopSettingsComponent)
      },
      {
        path: 'box-info',
        loadComponent: () => import('./features/shop-manager/box-info/box-info.component').then(m => m.ShopBoxInfoComponent)
      },
      {
        path: 'rent-payments',
        loadComponent: () => import('./features/shop-manager/rent-payments/rent-payments.component').then(m => m.ShopRentPaymentsComponent)
      },
      {
        path: 'requests',
        loadComponent: () => import('./features/shop-manager/requests/requests.component').then(m => m.ShopRequestsComponent)
      },
      {
        path: 'sellers',
        loadComponent: () => import('./features/shop-manager/sellers/sellers.component').then(m => m.ShopSellersComponent)
      },
      {
        path: 'landing',
        loadComponent: () => import('./features/shop-manager/landing/landing.component').then(m => m.ShopLandingComponent)
      },
      {
        path: 'coupons',
        loadComponent: () => import('./features/shop-manager/coupons/coupons.component').then(m => m.ShopCouponsComponent)
      },
      {
        path: 'stock',
        loadComponent: () => import('./features/shop-manager/stock/stock-management.component').then(m => m.StockManagementComponent)
      },
      {
        path: 'pos',
        loadComponent: () => import('./features/shop-manager/pos/pos.component').then(m => m.PosComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // Wildcard route
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
