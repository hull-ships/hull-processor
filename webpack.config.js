var path = require('path');
var webpack = require('webpack');
var plugins = [];

if (process.env.NODE_ENV === 'production') {
  plugins = [
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false,
        screw_ie8: false
      }
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    })
  ];
}

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
  plugins: plugins,
  resolve: { extensions: ['', '.js', '.jsx'] },
  module: {
    loaders: [
      { test: /\.(css|scss)$/, loaders: ['style?singleton=true', 'css?modules&importLoaders=1'] },
      { test: /\.svg$/, loader: 'svg-inline' },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel",
        query: {
          presets: ['es2015', 'stage-0']
        }
      },
      {
        test: /.jsx?$/,
        loader: 'babel',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react', 'stage-0']
        }
      }
    ]
  }
};
