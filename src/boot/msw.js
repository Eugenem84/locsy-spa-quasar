import { defineBoot } from '#q-app/wrappers'

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli-vite/boot-files
export default defineBoot(async (/* { app, router, ... } */) => {
  if (process.env.DEV) {
    const { worker } = await import('src/mocks/browser.js')
    await worker.start({
      onUnhandledRequest: 'bypass'
    })
    console.log('%c🧪 MSW активирован', 'color: limegreen; font-weight: bold;')  }
})
