/* eslint-disable */
const webpack = require('webpack');
const path = require('path');

module.exports = {
    target: 'electron-renderer',
    entry: {
        index: './src/renderer/index',
    },
    // 产出路径
    output: {
        path: path.join(__dirname, '../../dist/assets/'),
        globalObject: 'this'
    },
    module: {
        rules: [
            {
                test: /\.(css|less)$/,
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader'
                    },
                    {
                        loader: 'less-loader'
                    }
                ]
            },
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true
                    }
                }]
            }
        ]
    },
    resolve: {
        modules: ["node_modules"],
        extensions: ['.js', '.ts', '.tsx', '.json']
    }
};
