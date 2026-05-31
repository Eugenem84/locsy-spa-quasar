import { createYmaps } from 'vue-yandex-maps'

export default async ({ app }) => {
  app.use( createYmaps({
    apikey: '71294a47-415d-480e-af7b-91393788b14c',
    lang: 'ru_RU',
    scriptURLParameters: {
      csp: '202512',
    },
  }))
}
