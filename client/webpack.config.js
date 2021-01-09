const path = require("path");

module.exports = {
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "public"),
    filename: "bundle.js"
  },
  mode: "development",
  // source maps help map errors to original react code
  devtool: "source-map",
  // configuration for webpack-dev-server
  devServer: {
    port: 3001,
    contentBase: path.join(__dirname, "public"),
    hot: true,
    // historyApiFallback: { index: "/index.html" }
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-react", ["@babel/preset-env", { targets: { node: "12" } }]]
          }
        }
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          // creates `style` nodes from JS strings
          "style-loader",
          // translates CSS into CommonJS
          "css-loader",
          // compiles SASS to CSS
          "sass-loader"
        ]
      }
    ]
  }
};
