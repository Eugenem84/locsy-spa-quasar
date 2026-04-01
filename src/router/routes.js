import LocationPage from "pages/LocationPage.vue";
import PhotographerProfilePage from "pages/PhotographerProfilePage.vue";

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      {
        path: '/location/:id',
        name: 'Location',
        component: LocationPage,
        props: true
      },
      {
        path: '/photographer/:id',
        name: 'PhotographerProfile',
        component: PhotographerProfilePage,
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
        path: '/favorites',
        name: 'Favorites',
        component: () => import('pages/FavoritesPage.vue'),
        meta: { requiresAuth: true }
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
