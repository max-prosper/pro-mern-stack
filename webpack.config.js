const webpack = require('webpack');

module.exports = {
  entry: {
    app: ['./src/app.jsx'],
    vendor: ['react', 'react-dom', 'whatwg-fetch'],
  },
  output: {
    path: __dirname + '/static',
    filename: 'app.bundle.js'
  },
  devServer: {
    port: 8000,
    contentBase: 'static',
    proxy: {
      '/api/*': {
        target: 'http://localhost:3000'
      }
    }
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({name: 'vendor', filename: 'vendor.bundle.js'})
  ],
  devtool: 'source-map',
  module: {
    loaders: [
      {
        test: /\.jsx$/,
        loader: 'babel-loader',
        query: {
          presets: ['react','es2015']
        }
      },
    ]
  }
};
