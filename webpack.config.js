const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    inject: './src/inject/index.js',
    background: './src/background/index.js',
    popup: './src/popup/index.jsx',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
            { test: /\.jsx?$/, use: 'babel-loader', exclude: /node_modules/ },
      { test: /\.s?css$/,
        use: [
          'style-loader',
                { loader: 'css-loader', options: { modules: true, importLoaders: 1 } },
          'postcss-loader',
        ] },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'popup.html',
      template: 'src/popup/index.html',
      chunks: ['popup'],
    }),
  ],
};
