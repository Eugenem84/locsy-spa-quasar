import LocationPage from "pages/LocationPage.vue";

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
        path: '/register',
        name: 'Register',
        component: () => import('pages/RegisterPage.vue')
      },
      {
        path: '/login',
        name: 'Login',
        component: () => import('pages/LoginPage.vue')
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
