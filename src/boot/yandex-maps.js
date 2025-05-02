import { createYmaps } from 'vue-yandex-maps'

export default async ({ app }) => {
  app.use( createYmaps({
    apikey: '2e40d235-9d0b-4f1f-bc61-4a6a4c5cafec',
    lang: 'ru_RU',
  }))
}
