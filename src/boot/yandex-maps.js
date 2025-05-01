import { boot } from 'quasar/wrappers'
//import YandexMaps from 'vue-yandex-maps'
import { createYmaps} from 'vue-yandex-maps'

export default boot(async ({ app }) => {
  const yandexMap = createYmaps({
    apikey: '2e40d235-9d0b-4f1f-bc61-4a6a4c5cafec',
    lang: 'ru_RU',
    version: '2.1',
    //initialization: 'mounted'
  })

  app.use(yandexMap)
})
