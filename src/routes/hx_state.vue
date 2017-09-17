<style>

</style>
<!--todo 若设备未连接，当前状态为未获取-->
<template>
  <div>
    <h1>烘箱设备状态</h1>
    <loading v-show="loading"></loading>
    <div class="content-wrapper" v-show="!loading">
      <div class="operation-wrapper row">
        <!--<div class="col-xs-6">-->
          <!--<button class="btn btn-primary btn-sm" @click="popEdit()">新 增</button>-->
        <!--</div>-->
      </div>
      <table class="table table-hover table-condensed">
        <thead>
        <tr>
          <th>序号</th>
          <th>仪表名称</th>
          <th>任务号</th>
          <th>操作员</th>

          <th>设备通讯状态</th>
          <th>远程/本地</th>
          <th>手动/自动</th>
          <th>温度1</th>
          <th>温度2</th>
          <th>温度3</th>
          <th>温度4</th>
          <th>程序运行段</th>
          <th>启停标示</th>
          <th>仪表通讯状态</th>
          <th>烘箱门状态</th>
          <th>实时运行时间</th>
          <th>总时间</th>
          <th>硫化进度</th>

          <th>操作</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="i in list">
          <th scope="row">{{$index + 1}}</th>
          <td>{{i.ybName}}</td>
          <td>
            <div v-for="t in i.tIds" track-by="$index">
              <strong>{{$index + 1}}.</strong>{{t}}
            </div>
          </td>
          <td>{{getWorkUserName(i.picker)}}</td>

          <td>{{i.connectState}}</td>
          <td>{{i.ycOrbd}}</td>
          <td>{{i.sdOrzd}}</td>
          <td>{{i.wd1}}</td>
          <td>{{i.wd2}}</td>
          <td>{{i.wd3}}</td>
          <td>{{i.wd4}}</td>
          <td>{{i.cxyxd}}</td>
          <td>{{i.qtbs}}</td>
          <td>{{i.ybtxzt}}</td>
          <td>{{i.hxmzt}}</td>
          <td>{{i.ssyxsj}}</td>
          <td>{{i.zsj}}</td>
          <td>{{i.lhjd}}</td>
          <td>
            <input type="button" value="添加" class="btn btn-primary btn-sm glyphicon-edit"  v-if="i.state==0&&i.connectState==1" @click="popEdit(i)">
            <input type="button" value="下载" class="btn btn-primary btn-sm glyphicon-play"  v-if="i.state==0&&i.connectState==1" @click="popWrite(i)">
          </td>
        </tr>
        </tbody>
      </table>
    </div>
    <modal :title="model._id ? '修改设备状态': '新增设备状态'" :show.sync="modalEditShow" effect="fade" cancel-text="取 消"
           ok-text="确 定" :callback="submit" :backdrop="false">
      <div slot="modal-body" class="modal-body form-horizontal">
        <div class="form-error" v-show="error">
          <span class="glyphicon glyphicon-remove-sign"></span> {{error}}
        </div>
        <div class="form-group">
          <label class="col-sm-3 control-label">任务号</label>
          <div class="col-sm-9">
            <div class="btn-group">
              <button class="btn btn-info mb5" style="margin-bottom: 5px;" @click="onAddTId"><span
                      class="glyphicon glyphicon-plus"></span></button>
              <button class="btn btn-danger" @click="onDeleteAll()"
                      type="button">
                <span class="glyphicon glyphicon-remove"></span>
              </button>
            </div>
            <div class="input-group" v-for="tId in model.tIds" track-by="$index">
              <span class="input-group-addon">{{$index + 1}}</span>
              <select v-model="tId" class="form-control">
                <option value="">--请选择--</option>
                <option :value="t" v-for="t in tasks">{{t}}</option>
              </select>
              <span class="input-group-btn">
                <button class="btn btn-danger" @click="onDeleteTId($index)"
                        type="button">
                  <span class="glyphicon glyphicon-trash"></span>
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </modal>
    <modal title="警告" :show.sync="modalDelShow" effect="fade" cancel-text="取 消" ok-text="确 定" :callback="certainDel"
           small>
      <div slot="modal-body" class="modal-body">
        确定删除设备“{{delModel.ybCode}}”？
      </div>
    </modal>
    <!--写入信息-->
    <modal title="" :show.sync="modalWriteShow" effect="fade" cancel-text="取 消"
           ok-text="写 入" :callback="startWork" :backdrop="false">
      <div slot="modal-header" class="modal-header">
        <button type="button" class="close"><span>×</span></button>
        <h4 class="modal-title">
          写入信息
        </h4>
        <div class="modal-loading" v-show="writeLoading"><img src="../assets/img/loading.gif"></div>
      </div>
      <div slot="modal-body" class="modal-body form-horizontal">
        <div class="form-group">
          <label class="col-sm-3 control-label">任务号</label>
          <div class="col-sm-9 padding-top7">{{modelWrite.tIds}}</div>
        </div>
        <div class="form-group">
          <label class="col-sm-3 control-label">产品图号</label>
          <div class="col-sm-9 padding-top7">{{modelWrite.pNum}}</div>
        </div>
        <div class="form-group">
          <label class="col-sm-3 control-label">二段硫化参数</label>
          <div class="col-sm-9">
            <div class="half">
              <p v-for="sj in modelWrite.sj" track-by="$index">
                时间{{$index+1}}: <strong>{{sj}}</strong> min
              </p>
            </div>
            <div class="half">
              <p v-for="wd in modelWrite.wd" track-by="$index">
                温度{{$index+1}}: <strong>{{wd}}</strong> ℃
              </p>
            </div>
          </div>
        </div>
      </div>
    </modal>

  </div>
</template>

<script>
  import {cloneDeep, find, findIndex, uniq} from 'lodash';
  import {modal} from 'vue-strap';

  import {planState} from '../utils/label';
  import notify from '../components/notify';
  import oauth from '../utils/oauth';
  export default{
    components: {
      modal
    },
    ready(){
      Promise.all([
        this.$http.get('/api/workusers/field'),
        this.$http.get('/api/hxstates'),
        this.$http.get('/api/prodprods4lh'),
      ]).then(function (res) {
        this.workUsers = res[0].data;
        this.list = res[1].data;
        this.prodList=res[2].data;
        this.loading = false;
      }.bind(this));
      this.getLiji();
    },
    methods: {
      getLiji(){
        let time=30 * 1000,_this=this;
        this.hxListInterval=setInterval(function(){
          _this.refresh();
        },time)
      },
      getWorkUserName(id){
        return (find(this.workUsers, {_id: id}) || {}).wuName;
      },
      canEdit(item){
        return this.userInfo._id === item.adder;
      },
      onAddTId(){
          if(this.model.tIds.length < 30 ){
              this.model.tIds.push('');
          }else{
              this.error = '最多添加30个任务号';
          }
      },
      onDeleteTId(index){
        this.model.tIds.splice(index, 1);
      },
      onDeleteAll(){
        this.model.tIds = [];
      },
      refresh(){
          let timeStamp=new Date().getTime();
          this.$http.get('/api/hxstates',{time:timeStamp}).then(function(data){
            notify.info('刷新数据成功！');
            this.list = data.data;
          }.bind(this))
      },
      /**
       * 校验提交信息
       * @returns {boolean}
       */
      valid(){
        if (!this.model.ybCode) {
          this.error = '请输入设备ID';
          return false;
        }

        var tIds = this.model.tIds;

        if (!this.model._id && (!tIds.length || !tIds.every(function (item) {
                  return !!item;
                }))) {
          this.error = '请输入任务号';
          return false;
        }

        if (uniq(tIds).length !== tIds.length) {
          this.error = '任务号不允许重复';
          return false;
        }

        this.error = '';
        return true;
      },
      /**
       * 提交信息
       */
      submit(){
        if (!this.valid()) return;

        var id = this.model._id;

        if (id) {
          this.$http
                  .put(`/api/hxstate/${id}`, this.model)
                  .then(function (res) {
                    this.modalEditShow = false;
                    this.refresh();
                    notify.info('修改成功！');
                  })
                  .catch(error);
        } else {
          this.$http
                  .post('/api/hxstate', this.model)
                  .then(function (res) {
                    this.modalEditShow = false;
                    this.list.unshift(res.data);
                    notify.info('新增成功！');
                  })
                  .catch(error);
        }

        function error(res) {
          if (res.status === 409) {
            this.error = '设备ID已存在';
          }
        }
      },
      /**
       * 新增/修改弹出框
       */
      popEdit(item){
        this.$http.get('/api/hxstates/tasks').then(function(data){
          this.tasks = data.data;
          if(item.tIds.length>0){
            this.tasks=this.tasks.concat(item.tIds);
          }
        }.bind(this))
        this.error = '';
        this.model = cloneDeep(item) || {tIds: []};
        this.modalEditShow = true;
      },
      /**
       * 删除确认弹出框
       * @param model
       */
      popDel(model){
        this.modalDelShow = true;
        this.delModel = model;
      },
      /**
       * 删除
       */
      certainDel(){
        this.$http
              .delete(`/api/hxstate/${this.delModel._id}`)
              .then(function () {
                this.list.$remove(this.delModel);
                notify.info('删除成功！');
              })
              .catch(function () {
                notify.error('删除失败！');
              })
              .finally(function () {
                this.modalDelShow = false;
              });
      },
      popWrite(item){
          this.modelWrite = cloneDeep(item);
          this.modelWrite.pNum = find(this.prodList,{tId:item.tIds[0]||''}).mId;
          this.modalWriteShow = true;
      },
        /**
         * 写入
         * @param item
         */
      startWork(){
        let _this=this;
        this.writeLoading=true;

        this.$http
            .put('/api/hxstates/write',this.modelWrite)
            .then(function () {
                _this.writeLoading=false;
                _this.refresh();
                _this.modalWriteShow = false;
              notify.info('写入数据成功！');
            })
            .catch(function () {
                this.writeLoading=false;
              notify.error('写入数据失败！');
            });

      }
    },
    beforeDestroy(){
      clearInterval(this.hxListInterval);
    },
    data(){
      return {
        loading: true,        // 初始化中
        workUsers: [],        // 所有员工
        userInfo: oauth.getUserInfo(),
        modalEditShow: false, // 弹窗显示
        tasks: [],
        model: {},　　　　　　　// 当前新增/修改的model
        list: [],             // 所有数据
        modalDelShow: false,  // 删除弹窗显示
        delModel: '',         // 当前删除的model
        error: '' ,            // 错误信息
        hxListInterval:'',
        modelWrite:{},
        modalWriteShow:false,
          prodList:[],   //生产计划
          writeLoading:false
      }
    }
  }
</script>