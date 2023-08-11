module.exports = {
  lintOnSave: false,
  chainWebpack: (config) => {
    config.plugin('html').tap((args) => {
      args[0].title = '3H敏捷管理'
      return args
    })
  }
}
