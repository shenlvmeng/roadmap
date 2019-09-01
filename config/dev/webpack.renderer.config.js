const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const base = require('./webpack.base.config');

module.exports = merge({
    devServer: {
        host: '0.0.0.0',
        disableHostCheck: true,
        hot: true
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'src/renderer/index.html',
            chunks: ['index']
        })
    ]
}, base);