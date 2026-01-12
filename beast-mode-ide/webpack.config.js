/**
 * Webpack Configuration for BEAST MODE IDE
 * Bundles Monaco Editor locally for offline support
 */

const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: {
    renderer: './renderer/app.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
    publicPath: './',
  },
  target: 'electron-renderer',
  node: {
    __dirname: false,
    __filename: false,
  },
  resolve: {
    extensions: ['.js', '.json'],
    alias: {
      'monaco-editor': path.resolve(__dirname, 'node_modules/monaco-editor'),
    },
  },
  externals: {
    // Don't bundle these - Electron provides them
    'electron': 'commonjs electron',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.ttf$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    // Monaco Editor webpack plugin (if available)
    ...(typeof require !== 'undefined' && require('monaco-editor-webpack-plugin') 
      ? [new (require('monaco-editor-webpack-plugin'))({
          languages: ['typescript', 'javascript', 'json', 'html', 'css'],
        })]
      : []
    ),
  ],
};
