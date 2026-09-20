// Локализация сообщений бэкенда (Laravel) на русский.
//
// Часть ответов API приходит на английском: например, при неверном входе
// Laravel отдаёт «These credentials do not match our records.», а ошибки
// валидации — «The email field is required.». Чтобы интерфейс оставался
// полностью русскоязычным, прогоняем текст через словарь точных совпадений
// и набор шаблонов Laravel, а сообщения с кириллицей оставляем как есть.

// Точные сообщения (ключ — строка ровно в том виде, в каком её отдаёт бэкенд).
const EXACT_MESSAGES = {
  // Аутентификация / авторизация
  'These credentials do not match our records.': 'Неверный email или пароль.',
  'The provided credentials are incorrect.': 'Неверный email или пароль.',
  'Invalid credentials.': 'Неверный email или пароль.',
  'Unauthenticated.': 'Нужно войти в аккаунт.',
  'This action is unauthorized.': 'Недостаточно прав для этого действия.',
  'Forbidden': 'Доступ запрещён.',
  'User not found.': 'Пользователь не найден.',
  'This password reset token is invalid.': 'Ссылка для сброса пароля недействительна или устарела.',
  'This password reset token is invalid or has expired.':
    'Ссылка для сброса пароля недействительна или устарела.',

  // Подтверждение почты
  'Please verify your email address.': 'Подтвердите адрес электронной почты.',
  'Your email address is not verified.': 'Адрес электронной почты не подтверждён.',
  'A fresh verification link has been sent to your email address.':
    'Мы отправили новую ссылку для подтверждения почты.',
  'We have emailed your password reset link.':
    'Мы отправили ссылку для сброса пароля на вашу почту.',

  // Успешные ответы
  'Your email has been verified.': 'Почта подтверждена.',
  'Email verified successfully.': 'Почта успешно подтверждена.',
  'Your password has been reset.': 'Пароль обновлён.',
  'Password reset successfully.': 'Пароль обновлён.',
  'Logged out successfully.': 'Вы вышли из аккаунта.',
  'Logged in successfully': 'Вы вошли в аккаунт.',
  'User registered successfully': 'Аккаунт создан.',
  'User city updated successfully': 'Город обновлён.',
  'Avatar updated successfully': 'Аватар обновлён.',
  'An unexpected error occurred during login. Please try again later.':
    'Не удалось войти из-за технической ошибки. Попробуйте позже.',

  // Общие ошибки
  'The given data was invalid.': 'Проверьте правильность заполнения полей.',
  'Not Found': 'Данные не найдены.',
  'Location not found': 'Локация не найдена.',
  'Unauthorized': 'Недостаточно прав для этого действия.',
  'Too Many Attempts.': 'Слишком много попыток. Попробуйте позже.',
  'Too many requests.': 'Слишком много запросов. Попробуйте позже.',
  'CSRF token mismatch.': 'Сессия устарела. Обновите страницу и попробуйте снова.',
  'CSRF token not found.': 'Сессия устарела. Обновите страницу и попробуйте снова.',
  'Page Expired': 'Сессия устарела. Обновите страницу и попробуйте снова.',
  'Server Error': 'Ошибка сервера. Попробуйте позже.',
  'Service Unavailable': 'Сервис временно недоступен. Попробуйте позже.',
  'Network Error': 'Нет соединения с сервером. Проверьте интернет-соединение.'
}

// Русские подписи полей. Ключи — как Laravel приводит атрибуты:
// `city_id` → «city id», поэтому сравнение идёт по форме с подчёркиванием.
const ATTRIBUTE_NAMES = {
  name: 'имя',
  email: 'email',
  password: 'пароль',
  password_confirmation: 'подтверждение пароля',
  current_password: 'текущий пароль',
  phone: 'телефон',
  city: 'город',
  city_id: 'город',
  title: 'название',
  description: 'описание',
  latitude: 'широта',
  longitude: 'долгота',
  category_ids: 'категории',
  photos: 'фотографии',
  avatar: 'аватар',
  display_name: 'отображаемое имя',
  work_types: 'виды съёмок',
  instagram: 'Instagram',
  telegram: 'Telegram',
  vk: 'ВКонтакте',
  website: 'сайт',
  token: 'токен',
  role: 'роль'
}

// Требования пароля из правила Password по умолчанию.
const REQUIREMENT_NAMES = {
  letter: 'букву',
  'uppercase letter': 'заглавную букву',
  'lowercase letter': 'строчную букву',
  'mixed case': 'буквы разного регистра',
  number: 'цифру',
  symbol: 'специальный символ'
}

function attributeLabel(rawName) {
  const key = String(rawName).trim().toLowerCase().replace(/\s+/g, '_')
  return ATTRIBUTE_NAMES[key] ?? key.replace(/_/g, ' ')
}

function requirementLabel(rawRequirement) {
  const key = String(rawRequirement).trim().toLowerCase()
  return REQUIREMENT_NAMES[key] ?? `«${key}»`
}

// Шаблоны стандартных сообщений валидации Laravel.
// Порядок важен: более специфичные правила идут раньше общих.
const VALIDATION_PATTERNS = [
  [/^The (.+?) field is required when (.+)\.$/i,
    (m) => `Поле «${attributeLabel(m[1])}» обязательно, когда заполнено «${attributeLabel(m[2])}».`],
  [/^The (.+?) field is required\.$/i,
    (m) => `Поле «${attributeLabel(m[1])}» обязательно для заполнения.`],
  [/^The (.+?) has already been taken\.$/i,
    (m) => `Значение поля «${attributeLabel(m[1])}» уже используется.`],
  [/^The (.+?) field confirmation does not match\.$/i,
    (m) => `Поле «${attributeLabel(m[1])}» не совпадает с подтверждением.`],
  [/^The (.+?) field must match (.+)\.$/i,
    (m) => `Поле «${attributeLabel(m[1])}» должно совпадать с «${attributeLabel(m[2])}».`],
  [/^The (.+?) field must be a valid email address\.$/i,
    (m) => `Поле «${attributeLabel(m[1])}» должно содержать корректный email.`],
  [/^The (.+?) field must be a valid URL\.$/i,
    (m) => `Поле «${attributeLabel(m[1])}» должно содержать корректную ссылку.`],
  [/^The (.+?) field must be a valid date\.$/i,
    (m) => `Поле «${attributeLabel(m[1])}» должно содержать корректную дату.`],
  [/^The (.+?) field must be at least ([\d.,]+) characters\.$/i,
    (m) => `Поле «${attributeLabel(m[1])}» должно содержать не меньше ${m[2]} символов.`],
  [/^The (.+?) field must not be greater than ([\d.,]+) characters\.$/i,
    (m) => `Поле «${attributeLabel(m[1])}» должно содержать не больше ${m[2]} символов.`],
  [/^The (.+?) field must be between ([\d.,]+) and ([\d.,]+) characters\.$/i,
    (m) => `Поле «${attributeLabel(m[1])}» должно содержать от ${m[2]} до ${m[3]} символов.`],
  [/^The (.+?) field must be at least ([\d.,]+)\.$/i,
    (m) => `Значение поля «${attributeLabel(m[1])}» должно быть не меньше ${m[2]}.`],
  [/^The (.+?) field must not be greater than ([\d.,]+)\.$/i,
    (m) => `Значение поля «${attributeLabel(m[1])}» должно быть не больше ${m[2]}.`],
  [/^The (.+?) field must be between ([\d.,]+) and ([\d.,]+)\.$/i,
    (m) => `Значение поля «${attributeLabel(m[1])}» должно быть от ${m[2]} до ${m[3]}.`],
  [/^The (.+?) field must contain at least one (.+)\.$/i,
    (m) => `Поле «${attributeLabel(m[1])}» должно содержать минимум ${requirementLabel(m[2])}.`],
  [/^The (.+?) field must be a string\.$/i,
    (m) => `Поле «${attributeLabel(m[1])}» должно быть строкой.`],
  [/^The (.+?) field must be an integer\.$/i,
    (m) => `Поле «${attributeLabel(m[1])}» должно быть целым числом.`],
  [/^The (.+?) field must be a number\.$/i,
    (m) => `Поле «${attributeLabel(m[1])}» должно быть числом.`],
  [/^The (.+?) field must be true or false\.$/i,
    (m) => `Поле «${attributeLabel(m[1])}» должно быть истиной или ложью.`],
  [/^The (.+?) field must be an array\.$/i,
    (m) => `Поле «${attributeLabel(m[1])}» должно быть списком.`],
  [/^The (.+?) field is incorrect\.$/i,
    (m) => `Поле «${attributeLabel(m[1])}» заполнено неверно.`],
  [/^The (.+?) field must be an image\.$/i,
    (m) => `Файл в поле «${attributeLabel(m[1])}» должен быть изображением.`],
  [/^The (.+?) field must be a file of type: (.+)\.$/i,
    (m) => `Файл в поле «${attributeLabel(m[1])}» должен быть одного из типов: ${m[2]}.`],
  [/^The (.+?) field must be a file\.$/i,
    (m) => `Поле «${attributeLabel(m[1])}» должно содержать файл.`],
  [/^The (.+?) field failed to upload\.$/i,
    (m) => `Не удалось загрузить файл в поле «${attributeLabel(m[1])}».`],
  [/^The (.+?) field must not be greater than ([\d.,]+) kilobytes\.$/i,
    (m) => `Файл в поле «${attributeLabel(m[1])}» не должен быть больше ${m[2]} КБ.`],
  [/^The (.+?) field must have at least ([\d.,]+) items\.$/i,
    (m) => `Поле «${attributeLabel(m[1])}» должно содержать не меньше ${m[2]} элементов.`],
  [/^The (.+?) field must not have more than ([\d.,]+) items\.$/i,
    (m) => `Поле «${attributeLabel(m[1])}» должно содержать не больше ${m[2]} элементов.`],
  [/^The (.+?) field must have between ([\d.,]+) and ([\d.,]+) items\.$/i,
    (m) => `Поле «${attributeLabel(m[1])}» должно содержать от ${m[2]} до ${m[3]} элементов.`],
  [/^The selected (.+?) is invalid\.$/i,
    (m) => `Выбранное значение поля «${attributeLabel(m[1])}» некорректно.`],
  [/^The (.+?) field is not a valid image\.$/i,
    (m) => `Файл в поле «${attributeLabel(m[1])}» не является изображением.`]
]

// Русские формулировки на случай, когда тело ответа пустое.
const STATUS_MESSAGES = {
  401: 'Нужно войти в аккаунт.',
  403: 'Недостаточно прав для этого действия.',
  404: 'Данные не найдены.',
  408: 'Сервер не дождался ответа. Попробуйте снова.',
  419: 'Сессия устарела. Обновите страницу и попробуйте снова.',
  429: 'Слишком много запросов. Попробуйте позже.',
  500: 'Ошибка сервера. Попробуйте позже.',
  502: 'Сервис временно недоступен. Попробуйте позже.',
  503: 'Сервис временно недоступен. Попробуйте позже.',
  504: 'Сервис временно недоступен. Попробуйте позже.'
}

const CYRILLIC_RE = /[а-яё]/i
const cache = new Map()

/**
 * Переводит сообщение бэкенда на русский.
 * @param {*} text текст ответа
 * @returns {string|null} русский текст, исходный русский текст или null,
 *                        если сообщение английское и неизвестное
 */
export function translateMessage(text) {
  if (typeof text !== 'string') return null

  const trimmed = text.trim()
  if (!trimmed) return null
  if (cache.has(trimmed)) return cache.get(trimmed)

  let result = EXACT_MESSAGES[trimmed]

  if (result === undefined) {
    for (const [pattern, build] of VALIDATION_PATTERNS) {
      const match = trimmed.match(pattern)
      if (match) {
        result = build(match)
        break
      }
    }
  }

  // Сообщение уже на русском — оставляем без изменений.
  if (result === undefined && CYRILLIC_RE.test(trimmed)) {
    result = trimmed
  }

  if (result === undefined) result = null

  cache.set(trimmed, result)
  return result
}

/**
 * Переводит объект ошибок валидации Laravel: { field: ['текст', ...] }.
 * Незнакомый английский текст оставляем как есть, чтобы не терять детали.
 * @param {Object} errors объект ошибок из ответа API
 * @returns {Object} объект с переведёнными сообщениями
 */
export function translateErrors(errors) {
  if (!errors || typeof errors !== 'object') return errors

  const result = {}

  for (const [field, messages] of Object.entries(errors)) {
    const list = Array.isArray(messages) ? messages : [messages]
    result[field] = list.map((value) => translateMessage(value) ?? value)
  }

  return result
}

/**
 * Достаёт из ошибки axios готовое русское сообщение для показа пользователю.
 * @param {*} error ошибка запроса (axios)
 * @param {string} fallback текст по умолчанию, если распознать не удалось
 * @returns {string} сообщение для отображения
 */
export function extractApiMessage(error, fallback = 'Что-то пошло не так. Попробуйте ещё раз.') {
  const response = error?.response

  if (!response) {
    return translateMessage(error?.message) ?? fallback
  }

  // 1. Ошибки валидации: { errors: { field: ['текст', ...] } }
  const translatedErrors = translateErrors(response.data?.errors)
  if (translatedErrors) {
    const parts = Object.values(translatedErrors).flat().filter(Boolean)
    if (parts.length) return parts.join(' ')
  }

  // 2. Общее сообщение ответа.
  const message = translateMessage(response.data?.message)
  if (message) return message

  // 3. Подсказка по HTTP-статусу.
  return STATUS_MESSAGES[response.status] ?? fallback
}

