module.exports = function (api) {
  api.cache(true);
  const importMetaPlugin = require.resolve('./babel-plugin-transform-import-meta');

  return {
    presets: ['babel-preset-expo'],
    plugins: [importMetaPlugin],
    overrides: [
      {
        test: /node_modules[\\/].*\.[jt]sx?$/,
        plugins: [importMetaPlugin],
      },
    ],
  };
};