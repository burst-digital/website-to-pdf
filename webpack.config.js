const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
        inject: './src/inject/index.js',
        background: './src/background/index.js',
        popup: './src/popup/index.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist')
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'popup.html',
            template: 'src/popup/index.html',
            chunks: ['popup']
        })
    ]
};