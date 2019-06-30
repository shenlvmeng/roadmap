const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    resolve: {
        extensions: ['.js', '.ts', '.tsx', '.json']
    },
    mode: process.env.NODE_ENV,
    devtool: 'none',
    target: 'electron-main',
    entry: {
        index: './src/main',
    },
    node: {
        __dirname: false,
        __filename: false
    },
    output: {
        path: path.join(__dirname, '../dist/main/')
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                parallel: true,
                sourceMap: true,
                cache: true
            })
        ]
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                loader: 'ts-loader'
            }
        ]
    }
};
