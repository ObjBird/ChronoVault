const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.[contenthash].js',
        publicPath: '/'
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react']
                    }
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif|mp3|mp4|wav)$/i,
                type: 'asset/resource'
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource'
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html',
            favicon: './public/favicon.ico'
        }),
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
                'REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL || 'https://api.chronovault.example.com'),
                'REACT_APP_CONTRACT_ADDRESS': JSON.stringify(process.env.REACT_APP_CONTRACT_ADDRESS || '0x1234567890123456789012345678901234567890'),
                'REACT_APP_CHAIN_ID': JSON.stringify(process.env.REACT_APP_CHAIN_ID || '0x15b3'),
                'REACT_APP_RPC_URL': JSON.stringify(process.env.REACT_APP_RPC_URL || 'https://rpc.monad.xyz'),
                'REACT_APP_EXPLORER_URL': JSON.stringify(process.env.REACT_APP_EXPLORER_URL || 'https://explorer.monad.xyz'),
                'REACT_APP_VERSION': JSON.stringify(process.env.REACT_APP_VERSION || '1.0.0'),
                'REACT_APP_DEBUG': JSON.stringify(process.env.REACT_APP_DEBUG || 'false')
            }
        })
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        compress: true,
        port: 3000,
        historyApiFallback: true,
        hot: true,
        open: true
    },
    resolve: {
        extensions: ['.js', '.jsx']
    }
}; 