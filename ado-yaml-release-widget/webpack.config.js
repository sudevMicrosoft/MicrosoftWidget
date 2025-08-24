const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = [
  {
    entry: "./src/widget.ts",
    output: { filename: "widget.js", path: __dirname + "/dist/widget" },
    mode: "production",
    module: { rules: [{ test: /\.ts$/, use: "ts-loader" }, { test:/\.css$/, use:["style-loader","css-loader"] }] },
    resolve: { extensions: [".ts", ".js"] },
    plugins: [new HtmlWebpackPlugin({ template: "./src/widget.html", filename: "index.html" })]
  },
  {
    entry: "./src/config.ts",
    output: { filename: "config.js", path: __dirname + "/dist/config" },
    mode: "production",
    module: { rules: [{ test: /\.ts$/, use: "ts-loader" }, { test:/\.css$/, use:["style-loader","css-loader"] }] },
    resolve: { extensions: [".ts", ".js"] },
    plugins: [new HtmlWebpackPlugin({ template: "./src/config.html", filename: "index.html" })]
  }
];