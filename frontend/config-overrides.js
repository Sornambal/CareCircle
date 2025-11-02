const path = require('path');
const webpack = require('webpack');

module.exports = function override(config, env) {
  // Add fallbacks for Node.js modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    path: require.resolve('path-browserify'),
    fs: false, // Disable fs since it's not needed in browser
    process: require.resolve('process/browser'),
  };

  // Add DefinePlugin to inject environment variables
  config.plugins = (config.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
  ]);

  return config;
};
