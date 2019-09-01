const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const base = require('./dev/webpack.base.portal.config');

module.exports = merge(base, {
    plugins: [
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: "index.css"
        }),
        new HtmlWebpackPlugin({
            filename: 'output.html',
            template: 'src/portal/index.html',
            chunks: ['portal'],
            inlineSource: '.(js|css)$'
        }),
        new HtmlWebpackInlineSourcePlugin()
    ],
    mode: 'production',
    target: 'electron-renderer',
    optimization: {
        minimizer: [
            new TerserPlugin({
                parallel: true,
                sourceMap: true,
                cache: true
            })
        ]
    }
});
