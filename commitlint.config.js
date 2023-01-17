module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [0, 'always', Number.MAX_SAFE_INTEGER],
    'scope-case': [0],
  },
};
