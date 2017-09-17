<style lang="less">
  .plan-detail h1 {
    padding-top: 0;
  }
</style>

<template>
  <div class="plan-detail">
    <ol class="breadcrumb">
      <li><a v-link="{path: '/allplan'}">所有计划</a></li>
      <li class="active">计划详情</li>
    </ol>
    <loading v-show="loading"></loading>
    <div class="content-wrapper" v-show="!loading">
      <div class="operation-wrapper mould-detail">
        <h1>计划信息</h1>
        <table class="table table-condensed">
          <tbody>
          <tr>
            <th>计划名称</th>
            <td>{{plan.ppName}}</td>
            <th>任务单号</th>
            <td>{{plan.tId}}</td>
            <th>产品图号</th>
            <td>{{plan.mId}}</td>
          </tr>
          <tr>
            <th>材料牌号</th>
            <td>{{plan.cId}}</td>
            <th>任务性质</th>
            <td>{{plan.special}}</td>
            <th>计算材料数量</th>
            <td>{{plan.cNum}}</td>
          </tr>
          <tr>
            <th>模具名称</th>
            <td>{{plan.mould.mName}}</td>
            <th>模具编号</th>
            <td>{{plan.mould.mId}}</td>
            <th>有效模腔数 </th>
            <td>{{plan.mould.ccNum}}</td>
          </tr>
          <tr>
            <th>开始时间</th>
            <td>{{plan.staTime | moment}}</td>
            <th>交付时间</th>
            <td>{{plan.endTime | moment}}</td>
            <th>计划进度</th>
            <td>{{{planState(plan)}}}</td>
          </tr>
          <tr>
            <th>入检批次号</th>
            <td>{{plan.rId}}</td>
            <th>计划员</th>
            <td>{{getWorkUserName(plan.planer)}}</td>
            <th>技术员</th>
            <td>{{getWorkUserName(plan.skiller)}}</td>

          </tr>
          <tr>
            <th>校对员</th>
            <td>{{getWorkUserName(plan.checker)}}</td>
            <th>调度员</th>
            <td>{{getWorkUserName(plan.dispatcher)}}</td>
            <th>班长</th>
            <td>{{getWorkUserName(plan.grouper)}}</td>
          </tr>
          <tr>
            <th>领料员</th>
            <td>{{getWorkUserName(plan.picker)}}</td>
            <th>发料员</th>
            <td>{{getWorkUserName(plan.issuer)}}</td>
            <th>校验员</th>
            <td>{{getWorkUserName(plan.tester)}}</td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="content-wrapper" v-show="!loading && plan.state >= 6">
      <div class="operation-wrapper">
        <h1>工艺列表</h1>
      </div>
      <table class="table table-hover table-condensed">
        <thead>
        <tr>
          <th>序号</th>
          <th>产品名称</th>
          <th>任务单号</th>
          <th>产品图号</th>
          <th>工序</th>
          <th>工时</th>
          <th>技术员</th>
          <th>互检员</th>
          <th>检验员</th>
          <th>自检数值</th>
          <th>互检数值</th>
          <th>专检数值</th>
          <th>合格</th>
          <th>不合格</th>
          <th>检验备注</th>
          <th>交检日期</th>
          <th>状态</th>
          <th>硫化状态</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="i in list">
          <th scope="row">{{$index + 1}}</th>
          <td>{{i.ppId.ppName}}</td>
          <td>{{i.ppId.tId}}</td>
          <td>{{i.ppId.mId}}</td>
          <td>
            <strong>{{i.index + 1}}.{{i.wp}}</strong>
            <div v-for="w in i.wpc">{{w.key}}:{{w.value}}</div>
          </td>
          <td>{{i.time}}</td>
          <td>{{getWorkUserName(i.worker)}}</td>
          <td>{{getWorkUserName(i.checker)}}</td>
          <td>{{getWorkUserName(i.tester)}}</td>
          <td>
            <div v-for="s in i.sValue">
              {{s}}
            </div>
          </td>
          <td>
            <div v-for="c in i.cValue">
              {{c}}
            </div>
          </td>
          <td>
            <div v-for="t in i.tValue">
              {{t}}
            </div>
          </td>
          <td>{{i.qNum}}</td>
          <td>{{i.cNum}}</td>
          <td>{{i.comment}}</td>
          <td>{{i.date | moment}}</td>
          <td>{{{proceState(i)}}}</td>
          <td>{{{proceProdState(i)}}}</td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
  import {find} from 'lodash';
  import {modal} from 'vue-strap';

  import {proceState, planState, proceProdState} from '../utils/label';

  export default{
    components: {
      modal
    },
    methods: {
      proceState: proceState,
      planState: planState,
      proceProdState:proceProdState,
      getWorkUserName(id){
        return (find(this.workUsers, {_id: id}) || {}).wuName;
      }
    },
    created(){
      var id = this.$route.params.id;
      Promise.all([
        this.$http.get(`/api/workusers/field`),
        this.$http.get(`/api/allplan/${id}`),
      ])
      .then(function (res) {
        this.workUsers = res[0].data;
        this.plan = res[1].data.plan;
        this.list = res[1].data.wps;
        this.loading = false;
      }.bind(this));
    },
    data(){
      return {
        loading: true,        // 初始化中
        plan: {},             // 数据
        list: [],             // 工艺列表
        workUsers: [] ,        // 所有员工
        mould:[]//模具
      }
    }
  }
</script>