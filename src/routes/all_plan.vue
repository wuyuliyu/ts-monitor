<style lang="less">

</style>

<template>
  <div class="prodplan">
    <h1>所有计划</h1>
    <loading v-show="loading"></loading>
    <div class="content-wrapper" v-show="!loading">
      <table class="table table-hover table-condensed">
        <thead>
        <tr>
          <th>序号</th>
          <th>产品名称</th>
          <th>任务单号</th>
          <th>产品图号</th>
          <th>任务性质</th>
          <th>开始时间</th>
          <th>交付时间</th>
          <th>计划员</th>
          <th>技术员</th>
          <th>调度员</th>
          <th>计划进度</th>
          <th>备注</th>
          <th>操作</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="i in list | filterBy q in 'ppId' 'ppName'">
          <th scope="row">{{$index + 1}}</th>
          <td>{{i.ppName}}</td>
          <td>{{i.tId}}</td>
          <td>{{i.mId}}</td>
          <td>{{i.special}}</td>
          <td>{{i.staTime | moment}}</td>
          <td>{{i.endTime | moment}}</td>
          <td>{{getWorkUserName(i.planer)}}</td>
          <td>{{getWorkUserName(i.skiller)}}</td>
          <td>{{getWorkUserName(i.dispatcher)}}</td>
          <td>{{{planState(i)}}}</td>
          <td>{{i.planComment}}</td>
          <td>
            <a v-link="{path:'/allplan/'+ i._id}"><span class="glyphicon glyphicon glyphicon-info-sign"></span></a>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
  import {clone, find} from 'lodash';
  import {modal} from 'vue-strap';

  import {planState} from '../utils/label';
  import notify from '../components/notify';

  export default{
    components: {
      modal
    },
    created(){
      Promise.all([
        this.$http.get('/api/workusers/field'),
        this.$http.get('/api/allplans')
      ]).then(function (res) {
        this.workUsers = res[0].data;
        this.list = res[1].data;
        this.loading = false;
      }.bind(this));
    },
    methods: {
      planState: planState,
      getWorkUserName(id){
        return (find(this.workUsers, {_id: id}) || {}).wuName;
      }
    },
    data(){
      return {
        loading: true,        // 初始化中
        workUsers: [],        // 所有员工
        list: []              // 所有数据
      }
    }
  }
</script>