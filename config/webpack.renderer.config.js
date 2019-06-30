const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const base = require('./dev/webpack.base.config');

base.output.publicPath = '../assets/';
module.exports = merge({
    plugins: [
        new HtmlWebpackPlugin({
            filename: '../pages/index.html',
            template: 'src/renderer/templates/index.html',
            chunks: ['index']
        }),
        new CopyWebpackPlugin([
            {
                from: './src/renderer/assets/*',
                to: '../',
                flatten: true
            },
            {
                from: './src/package.json',
                to: '../',
                flatten: true
            }
        ])
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
}, base);
