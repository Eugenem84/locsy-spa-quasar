import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
import { Notify } from 'quasar'
import { translateMessage } from 'src/utils/api-message.js'

// Create a configured instance of Axios
const api = axios.create({
  // Относительный базовый URL: SPA и API живут на одном домене,
  // внешний nginx/Caddy проксирует /api, /sanctum, /storage, /admin в Laravel.
  // Так сборка не зависит от конкретного домена (dev/prod/локальный стенд).
  baseURL: '/',
  withCredentials: true,
});

// Attach XSRF token from cookie for Sanctum stateful auth.
api.interceptors.request.use(config => {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];

  if (token) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
  }

  return config;
}, error => {
  return Promise.reject(error);
});

// Единая обработка «почта не подтверждена» (бэкенд отдаёт 403 + email_verified=false):
// показываем подсказку и уводим на страницу подтверждения, откуда письмо можно
// выслать повторно. Так не нужно дублировать проверку в каждом действии.
api.interceptors.response.use(
  response => response,
  error => {
    const response = error?.response;

    if (response?.status === 403 && response?.data?.email_verified === false) {
      Notify.create({
        color: 'warning',
        icon: 'mark_email_unread',
        message: translateMessage(response.data.message) || 'Подтвердите почту, чтобы пользоваться аккаунтом.'
      });

      // Роутер в hash-режиме: уводим програмно, без обращения к роутеру из boot
      if (window.location.hash !== '#/verify-email') {
        window.location.hash = '#/verify-email';
      }
    }

    return Promise.reject(error);
  }
);


export default defineBoot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
