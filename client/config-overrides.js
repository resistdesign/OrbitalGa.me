const {removeModuleScopePlugin, override, addWebpackAlias, babelInclude} = require('customize-cra');
const path = require('path');
const webpack = require('webpack');

module.exports = override(
  removeModuleScopePlugin(),
  babelInclude([path.resolve('src'), path.resolve('../common/src'), path.resolve('../server/src')]),
  addWebpackAlias({
    ['@common']: path.resolve(__dirname, '..', 'common', 'src'),
  })
);
