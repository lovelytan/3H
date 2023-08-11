<template>
  <div id="app">
    <el-container>
      <el-aside width="200px">
        <div id="nav">
          <el-menu default-active="1-1" class="el-menu-vertical-demo">

            <el-submenu index="1">
              <template slot="title">
                <i class="el-icon-menu"></i>
                <span>敏捷管理</span>
              </template>
              <el-menu-item index="1-1">
                <router-link to="/about">敏捷饱和度</router-link>
              </el-menu-item>
            </el-submenu>

          </el-menu>

<!--          <router-link to="/">Home</router-link>-->
        </div>
      </el-aside>
      <el-main>
        <router-view/>
      </el-main>
    </el-container>
  </div>
</template>

<style lang="less">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  a {
    color: #303133;
    text-decoration: none;
    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
<script setup>
</script>
