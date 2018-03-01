const webpack = require("webpack");
const webpackDevMiddleware = require("webpack-dev-middleware");
const webpackConfig = require("../../../webpack.config");

function devModeMiddleware() {
  const compiler = webpack(webpackConfig);
  return webpackDevMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
    contentBase: "src",
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

module.exports = devModeMiddleware;
