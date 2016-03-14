var path = require('path');
var webpack = require('webpack');

module.exports = {
  devtool  : '#source-map',
  entry: {
    admin: path.join(__dirname, 'src/index.jsx'),
  },
  output: {
    path: path.join(__dirname, '/dist/'),
    filename: '[name].js',
    publicPath: '/'
  },
  plugins: [
    // new webpack.optimize.UglifyJsPlugin({
    //   compressor: {
    //     warnings: false,
    //     screw_ie8: false
    //   }
    // }),
    // new webpack.DefinePlugin({
    //   'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    // })
  ],
  resolve: { extensions: ['', '.js', '.jsx'] },
  module: {
    loaders: [
      {test: /\.(css|scss)$/, loaders: ['style?singleton=true', 'css?modules&importLoaders=1'] },
      { test: /\.svg$/, loader: 'svg-inline' },
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader"},
      {
        test: /.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react', 'stage-0']
        }
      }
    ]
  }
};
