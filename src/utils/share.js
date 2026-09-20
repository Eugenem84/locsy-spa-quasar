// Система «Поделиться»: единая точка для share-кнопок на страницах.
//
// На мобильных браузерах доступно системное меню «Поделиться» (Web Share API,
// navigator.share): оно умеет отправлять ссылку в мессенджеры, почту, соцсети.
// Если API недоступно (десктопные браузеры, страница по http без https) —
// просто копируем ссылку в буфер обмена. Для пользователя это то же самое
// действие «поделиться ссылкой», поэтому странице достаточно вызвать shareLink()
// и показать уведомление по возвращённому результату.

/**
 * Копирует текст в буфер обмена.
 *
 * Сначала пробуем современный Clipboard API. Он требует «безопасного контекста»
 * (https или localhost), поэтому при его отсутствии используем резервный способ
 * через скрытый textarea и document.execCommand('copy').
 * @param {string} text текст для копирования
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  // Резервный путь для небезопасных контекстов (http, старые браузеры).
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '-1000px'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)

  try {
    textarea.select()
    const copied = document.execCommand('copy')
    if (!copied) throw new Error('Не удалось скопировать ссылку')
  } finally {
    document.body.removeChild(textarea)
  }
}

/**
 * Результат шаринга — по нему страница выбирает текст уведомления:
 * `'shared'` — пользователь отправил ссылку через системное меню,
 * `'copied'` — ссылка скопирована в буфер обмена,
 * `'cancelled'` — пользователь закрыл системное меню, показывать нечего.
 * @typedef {'shared' | 'copied' | 'cancelled'} ShareResult
 */

/**
 * Делится ссылкой: открывает системное меню «Поделиться», если оно есть,
 * иначе копирует ссылку в буфер обмена.
 *
 * Отмена пользователем (AbortError) не считается ошибкой — возвращаем
 * `'cancelled'`, чтобы страница не показывала уведомление.
 * @param {Object} [options]
 * @param {string} [options.title] заголовок для системного меню
 * @param {string} [options.text] сопроводительный текст
 * @param {string} [options.url] ссылка; по умолчанию — текущий адрес страницы
 * @returns {Promise<ShareResult>}
 */
export async function shareLink({ title, text, url } = {}) {
  // В hash-режиме роутера window.location.href уже содержит полный адрес
  // страницы вместе с #/..., поэтому по умолчанию делимся именно им.
  const shareUrl = url || window.location.href

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url: shareUrl })
      return 'shared'
    } catch (error) {
      // Пользователь закрыл меню «Поделиться» — это не ошибка.
      if (error?.name === 'AbortError') return 'cancelled'
      // В остальных случаях падаем на копирование ссылки в буфер.
    }
  }

  await copyToClipboard(shareUrl)
  return 'copied'
}
