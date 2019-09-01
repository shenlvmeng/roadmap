/* eslint-disable */
var path = require('path');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const base = require('./webpack.base.portal.config');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = merge(base, {
    devServer: {
        host: '0.0.0.0',
        disableHostCheck: true,
        hot: true,
        contentBase: path.join(__dirname, '../../test/portal')
    },
    plugins: [
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: "[name].css",
            chunkFilename: "[id].css"
        }),
        new HtmlWebpackPlugin({
            filename: 'output.html',
            template: 'src/portal/index.html',
            chunks: ['portal'],
            inlineSource: '.(js|css)$'
        }),
        new HtmlWebpackInlineSourcePlugin()
    ]
});
