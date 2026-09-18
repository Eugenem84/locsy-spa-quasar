const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      {
        path: '/about',
        name: 'About',
        component: () => import('pages/AboutPage.vue')
      },
      {
        path: '/location/:id',
        name: 'Location',
        component: () => import('pages/LocationPage.vue'),
        props: true
      },
      {
        path: '/photographer/:id',
        name: 'PhotographerProfile',
        component: () => import('pages/PhotographerProfilePage.vue'),
        props: true
      },
      {
        path: '/register',
        name: 'Register',
        component: () => import('pages/RegisterPage.vue')
      },
      {
        path: '/login',
        name: 'Login',
        component: () => import('pages/LoginPage.vue')
      },
      {
        path: '/forgot-password',
        name: 'ForgotPassword',
        component: () => import('pages/ForgotPasswordPage.vue')
      },
      {
        path: '/reset-password',
        name: 'ResetPassword',
        component: () => import('pages/ResetPasswordPage.vue')
      },
      {
        path: '/verify-email',
        name: 'VerifyEmail',
        component: () => import('pages/VerifyEmailPage.vue')
      },
      {
        path: '/favorites',
        name: 'Favorites',
        component: () => import('pages/FavoritesPage.vue'),
        meta: { requiresAuth: true, requiresVerified: true }
      }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
