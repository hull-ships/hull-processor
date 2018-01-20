import webpack from "webpack";
import webpackDevMiddleware from "webpack-dev-middleware";
import webpackConfig from "../webpack.config";

export default function devMode() {
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
