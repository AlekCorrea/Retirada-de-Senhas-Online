module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2024: true,
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: 'espree',
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: false,
    },
  },
  extends: ['plugin:vue/vue3-essential'],
  plugins: ['vue'],
  rules: {
    'vue/no-unused-vars': 'warn',
    'vue/html-self-closing': 'off',
  },
};
