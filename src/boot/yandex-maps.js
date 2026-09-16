import { createYmaps } from 'vue-yandex-maps'

// Ключ JavaScript API 3. Это ОТДЕЛЬНЫЙ ключ от Геокодера:
// YANDEX_MAPS_JS_API_KEY — JavaScript API и Geocoder должны быть подключены
// к ключу в кабинете разработчика Яндекса.
const JS_API_KEY =
  process.env.YANDEX_MAPS_JS_API_KEY || '71294a47-415d-480e-af7b-91393788b14c'

export default async ({ app }) => {
  app.use(createYmaps({
    apikey: JS_API_KEY,
    lang: 'ru_RU',
    scriptURLParameters: {
      csp: '202512',
    },
  }))
}
