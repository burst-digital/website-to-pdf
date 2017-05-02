module.exports = {
  plugins: {
    'postcss-import': {},
    'postcss-cssnext': {
      browsers: ['last 2 Chrome versions'],
      features: {
        customProperties: true,
      },
    },
  },
};