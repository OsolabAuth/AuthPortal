<template>
  <main class="auth-shell">
    <section class="auth-panel">
      <header class="auth-header">
        <p class="eyebrow">{{ eyebrow }}</p>
        <h1>{{ title }}</h1>
        <p v-if="description" class="lead">{{ description }}</p>
      </header>

      <slot />
    </section>
  </main>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  eyebrow?: string;
  title: string;
  description?: string;
}>(), {
  eyebrow: "AuthFoundation",
  description: ""
});
</script>
