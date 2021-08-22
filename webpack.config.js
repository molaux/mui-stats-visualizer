var path = require('path');
module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'index.js',
    libraryTarget: 'commonjs2'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(__dirname, 'src'),
        exclude: /(node_modules|bower_components|build)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  externals: [
    {
      'react': 'commonjs react',
      'react-dom': 'react-dom',
      "graphql": "graphql",
      "@apollo/client": "@apollo/client",
      "@apollo/client/react/hoc": "@apollo/client/react/hoc",
      "react-router-dom": "react-router-dom",
      "@date-io/date-fns": "@date-io/date-fns",
      'date-fns': 'date-fns',
      'recharts': 'recharts',
      'deepmerge': 'deepmerge',
      'locutus': 'locutus',
      'recharts': 'recharts'
    },
    /@material-ui\/.*/,
    /date-fns\/.*/
  ]
};