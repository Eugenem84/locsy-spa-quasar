import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'

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


export default defineBoot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
