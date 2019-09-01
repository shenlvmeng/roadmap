/* eslint-disable */
const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
    target: 'web',
    entry: {
        portal: './src/portal/index.ts'
    },
    output: {
        path: path.join(__dirname, '../../portal/'),
    },
    module: {
        rules: [
            {
                test: /\.(css|less)$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
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
