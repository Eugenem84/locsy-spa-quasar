<template>
  <router-link
    to="/"
    class="brand row items-center no-wrap"
    :class="[`brand--${size}`, { 'brand--hide-word': hideWordmarkOnMobile }]"
    :aria-label="ariaLabel"
  >
    <img src="/logo/logo-mark.png" alt="" aria-hidden="true" class="brand__mark" />
    <span v-if="wordmark" class="brand__word" :class="`brand__word--${variant}`">
      <span class="brand__get">get</span><span class="brand__locsy">locsy</span>
    </span>
  </router-link>
</template>

<script setup>
defineProps({
  // Размер локапа: sm — компактный (футер, письма), md — шапка, lg — крупные блоки
  size: { type: String, default: 'md' },
  // Текстовый вордмарк «getlocsy» рядом с эмблемой
  wordmark: { type: Boolean, default: true },
  // light — для тёмной шапки (белый текст), dark — для светлого фона
  variant: { type: String, default: 'light' },
  // Скрывать вордмарк на узких экранах (там шапку делят селект города и кнопки)
  hideWordmarkOnMobile: { type: Boolean, default: true }
})

const ariaLabel = 'Getlocsy — на главную'
</script>

<style scoped>
/* Высота локапа и размеры вордмарка живут в одной переменной: медиазапросы
   могут уменьшить локап, не меняя разметку */
.brand {
  --brand-height: 44px;
  flex: 0 0 auto;
  text-decoration: none;
  line-height: 1;
}

.brand--sm {
  --brand-height: 34px;
}

.brand--lg {
  --brand-height: 64px;
}

/* Вокруг эмблемы в PNG есть прозрачные поля: задаём только высоту,
   ширина берётся по пропорции, поэтому знак прижат к левому краю шапки */
.brand__mark {
  display: block;
  width: auto;
  height: var(--brand-height);
}

.brand__word {
  margin-left: 6px;
  font-size: calc(var(--brand-height) * 0.55);
  font-weight: 700;
  letter-spacing: -0.02em;
  text-transform: lowercase;
  white-space: nowrap;
}

/* «get» — служебная приставка, поэтому легче и тише, «locsy» — основной бренд */
.brand__get {
  font-weight: 300;
  opacity: 0.8;
}

.brand__word--light {
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(4, 20, 38, 0.28);
}

.brand__word--dark {
  color: #052747;
}

/* На планшетах шапка уже плотная (навигация + селект города) — локап уменьшаем */
@media (max-width: 767px) {
  .brand--md {
    --brand-height: 38px;
  }
}

@media (max-width: 599px) {
  .brand--hide-word .brand__word {
    display: none;
  }
}
</style>
