import webpack from 'webpack';
import webpackConfig from '../webpack.config';

export default function devMode() {
  const compiler = webpack(webpackConfig);
  return require('webpack-dev-middleware')(compiler, {
    publicPath: webpackConfig.output.publicPath,
    contentBase: 'src',
    stats: {
      colors: true,
      hash: false,
      timings: true,
      chunks: false,
      chunkModules: false,
      modules: false
    }
  });
}
