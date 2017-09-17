<style lang="less">
  .content {
    margin-left: 200px;
    padding: 10px;
  }
</style>

<template>
  <div>
    <sidebar :user-info="userInfo"></sidebar>
    <topbar :user-info="userInfo"></topbar>
    <router-view class="content"></router-view>
  </div>
</template>

<script>
  import Sidebar from '../partials/sidebar';
  import Topbar from '../partials/topbar';
  import oauth from '../utils/oauth';

  export default {
    ready(){
      this.userInfo = oauth.getUserInfo();
    },
    components: {
      Sidebar,
      Topbar
    },
    data(){
      return {
        userInfo: oauth.getUserInfo()
      }
    }
  }
</script>