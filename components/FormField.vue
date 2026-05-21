<template>
  <label class="field" :for="id">
    <span class="field-label">{{ label }}</span>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :placeholder="placeholder"
      :required="required"
      @input="onInput"
    >
    <span v-if="hint" class="field-hint">{{ hint }}</span>
  </label>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  id: string;
  label: string;
  modelValue: string;
  type?: string;
  autocomplete?: string;
  inputmode?: "search" | "text" | "email" | "tel" | "url" | "none" | "numeric" | "decimal";
  placeholder?: string;
  hint?: string;
  required?: boolean;
}>(), {
  type: "text",
  autocomplete: "off",
  inputmode: undefined,
  placeholder: "",
  hint: "",
  required: false
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

function onInput(event: Event) {
  emit("update:modelValue", (event.target as HTMLInputElement).value);
}
</script>
