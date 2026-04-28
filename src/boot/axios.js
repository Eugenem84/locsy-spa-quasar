import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'

// Create a configured instance of Axios
const api = axios.create({
  baseURL: process.env.DEV ? 'http://localhost/' : 'https://locsy.prod.medovf2h.beget.tech/',
  withCredentials: true, // This is still crucial
});

// Add a request interceptor to manually set the X-XSRF-TOKEN header
api.interceptors.request.use(config => {
  // Try to get the cookie. The value is URI-encoded and needs to be decoded.
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
