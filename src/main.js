import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

// import 'vue-ufp-ui/src/index.scss' // ufp主题样式
// import { retailUI } from '@citicbank/retail-ufp-lib/src'
// Vue.use(retailUI)
// Vue.use(retailPlugin)

Vue.use(ElementUI)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
