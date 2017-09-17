var Promise = require('bluebird');
var _ = require('lodash');
var log = require('../utils/log4js').default();
//温度
var WsdDataService = require('../services/wsd_data');
var WsdStateService = require('../services/wsd_state');
var WsdlastDataService = require('../services/wsd_lastdata');
//烘箱
var HxDataStateService = require('../services/hx_state_data');
var HxDatalastStateService=require('../services/hx_state_lastdata');
var HxStateService = require('../services/hx_state');
//硫化机
var LhjStateDataService = require('../services/pblhj_state_data');
var LhjStateService = require('../services/pblhj_state');
var LhjlastStateDataService = require('../services/pblhj_state_lastdata');
var ProdProceService = require('../services/prod_proce'); //工序
var monitorUtil = require('../utils/monitorUtil')
var server = require('../routes/server');
//定时器 1分钟
var IntervalTime1 = 2 * 1000;
var IntervalTime2 = 5 * 1000;
var fg=0;
var lhstatus =0;//硫化
var wsdtatus =0;//温度

var back = {
    init: function () {
       back.wsd();
       back.hx();
        back.lhj();
    },//测试
    getrd: function (e, t) {
        var rd = server.getModbusdata();
        var data = new Array();

        for (var i = e; i <= t; i++) {
            if (rd[i]) {
                data.push(rd[i]);
            } else {
                data.push(0);
            }
        }
        // }
        return data;

    },
    getrdtest: function (e, t) {
        var data = new Array();
        for (var i = e; i <= t; i++) {
            data.push(0);
        }
        return data;
    },
    wsd: function () {
        WsdStateService.find().then(function (models) {
            for (let i = 0; i < models.length; i++) {
                back.wsdCallBack(models[i])
                back.wsdlastCallBack(models[i])
            }
        });
    }, /*温湿度*/
    wsdCallBack: function (wsd) {

        wsdObjId = wsd._id;
        let wsdInterval = '';
        inter();
        function inter() {
            clearTimeout(wsdInterval);
            let data = back.getrd(100, 118)
            let status = back.getrd(99, 99);
            /*温湿度通讯状态*/
            if(wsdtatus!=back.getrd(99, 99)[0]) {
                wsdstatushyy=true;
            }else {
            wsdstatushyy=false;
            }
            wsdtatus=back.getrd(99, 99)[0];

            if(wsdstatushyy){
                WsdStateService.findById(wsdObjId)
                    .then(function (data) {

                            WsdStateService.update(wsdObjId, {connectState: 1})

                    })
            }else{
                WsdStateService.findById(wsdObjId)
                    .then(function (data) {

                            WsdStateService.update(wsdObjId, {connectState: 0})

                    })
            }

            if (data.length > 0) {

                //存储数据
                let wsdStateData = monitorUtil.handleWsdData(data, wsd.eqIp)
                WsdDataService.save(wsdStateData)
                    .then(function () {
                        WsdStateService.findById(wsdObjId)
                            .then(function (data) {

                            })
                        wsdInterval = setTimeout(inter, IntervalTime1)
                    })
                    .catch(function (err) {
                        log.error(err);
                    });
            } else {
                wsdInterval = setTimeout(inter, IntervalTime1)
                console.log("无数据");

            }
        }
    },
    wsdlastCallBack: function (wsd) {

    wsdObjId = wsd._id;
    let wsdInterval = '';
    inter();

    function inter() {
        clearTimeout(wsdInterval);
        let data = back.getrd(100, 118)
        let status = back.getrd(99, 99);

        if (data.length > 0) {
            //存储数据
            let wsdStateData = monitorUtil.handleWsdData(data, wsd.eqIp)
            WsdDataService.removeState(wsd.eqIp).then(function () {
                WsdDataService.save(wsdStateData)
                    .then(function () {
                        wsdInterval = setTimeout(inter, IntervalTime1)
                    })
                    .catch(function (err) {
                        log.error(err);
                    });
            });
        } else {
            wsdInterval = setTimeout(inter, IntervalTime1)
            console.log("无数据");

        }
    }
},
    hx: function () {
        HxStateService.find().then(function (models) {
            for (let i = 0; i < models.length; i++) {
                back.hxCallBack(models[i], i)
                back.hxlastCallBack(models[i], i)

            }
        });
    },//仪器
    hxCallBack: function (models, i) {
        let hx1 = '';
        inter();

        function inter() {


            clearTimeout(hx1);
            //先查询再更改hxState通讯状态改为1
            //存储数据
            let hxData = models;
            let hxObjId = hxData._id;
            let data = [];
            if (hxData.ybName == "仪表1号") {
                data = back.getrd(200, 217);
                // data = back.getrdtest(201, 217);
                console.log("烘箱仪器1数据" + data)
                //烘箱通讯状态判断

                if(fg!=back.getrd(199, 199)[0]) {
                   hyy=true;
               }else {
                 hyy=false;

               }
               fg=back.getrd(199, 199)[0];

                //当rd[199]随机数于上一次不同就状态表就启动,反而停止
            } else if (hxData.ybName == "仪表2号") {
                data = back.getrd(220, 237)
                // data = back.getrdtest(201, 237);
                console.log("烘箱仪器2数据" + data)

            } else if (hxData.ybName == "仪表3号") {
                data = back.getrd(240, 257);
                // data = back.getrdtest(201, 257);
                console.log("烘箱仪器3数据" + data);

            }

            let hxStateData = monitorUtil.handleHxData(data);
            let isOpen = (data[7] == 1);//若烘箱状态为启动中
            hxStateData.isLine = isOpen ? 1 : 0;
            hxStateData.hxState = hxObjId;


        //   console.log(hxData.ybName+"的状态是"+fg+"是否保存"+hyy)

            if(hyy){
                HxStateService.find().then(function (models) {
                    for (let i = 0; i < models.length; i++) {
                        //hxCallBack(models[i])
                        //存储数据
                        let hxObjId = models[i]._id;
                        HxStateService.findById(hxObjId)
                            .then(function (data) {
                                //console.log('run')

                                    HxStateService.update(hxObjId, {connectState: 1})
                            })
                    }
                });
            }else{
                HxStateService.find().then(function (models) {
                    for (let i = 0; i < models.length; i++) {
                        //hxCallBack(models[i])
                        //存储数据
                        let hxObjId = models[i]._id;
                        HxStateService.findById(hxObjId)
                            .then(function (data) {


                                    HxStateService.update(hxObjId, {connectState: 0})

                            })
                    }
                });
            }
            if (isOpen&&hyy) {
                HxDataStateService.save(hxStateData)
                    .then(function () {
                        let tIds = hxData.tIds;
                        if (hxData.connectState != 1) {
                            HxStateService.update(hxObjId, {connectState: 1})
                        }
                        if (data[12] == 100 || data[12] == 0) {
                            // 先查询，后改变仪表状态为0空闲中，清空任务号和温度时间
                            if (hxData.state != 0) {
                                HxStateService.update(hxObjId, {state: 0, tIds: [], wd: [], sj: []});
                                //更新工序状态
                                Promise.all(_.map(tIds, item => {
                                    //console.log('item'+item)
                                    return ProdProceService.find({tId: item, sType: 's2'})
                                }))
                                    .then(ProdProcedata => {
                                        for (let i = 0; i < ProdProcedata.length; i++) {
                                            // console.log('ProdProddata' + ProdProcedata[i])
                                            let ProdProcedataStr = ProdProcedata[i][0] //这里真是奇怪
                                            if (ProdProcedataStr.prodState == 2) {
                                                ProdProcedataStr.prodState = 3
                                                ProdProceService.update(ProdProcedataStr._id, ProdProcedataStr)
                                                console.log('更新计划状态')
                                            }
                                        }
                                    })
                                    .catch(function (e) {
                                        log.error(e);
                                    });
                            }
                            // 先查询相应任务号的硫化工序状态是否为3，若不为3则修改为3
                            //遍历任务号
                            //wp数据结构不满足现有需求
                            //ProdProdService.updateMany({tId:{$in:tIds},wp:{$elemMatch: {state:{$ne:3},sType:'s2'}}},{$set: { "wp.$.state": 3 }})
                            //    .then(function(data){
                            //
                            //    })
                        }

                        hx1 = setTimeout(inter, IntervalTime1)
                    })
                    .catch(function (err) {
                        log.error(err);
                        hx1 = setTimeout(inter, IntervalTime1)
                    });
            }else{
                hx1 = setTimeout(inter, IntervalTime2)
            }

        }
    },
    hxlastCallBack: function (models, i) {
        let hx1 = '';
        inter();

        function inter() {


            clearTimeout(hx1);
            //先查询再更改hxState通讯状态改为1
            //存储数据
            let hxData = models;
            let hxObjId = hxData._id;
            let data = [];
            if (hxData.ybName == "仪表1号") {
                data = back.getrd(200, 217);
                // data = back.getrdtest(201, 217);
                // console.log("烘箱仪器1数据" + data)

            } else if (hxData.ybName == "仪表2号") {
                data = back.getrd(220, 237)
                // data = back.getrdtest(201, 237);
                // console.log("烘箱仪器2数据" + data)

            } else if (hxData.ybName == "仪表3号") {
                data = back.getrd(240, 257);
                // data = back.getrdtest(201, 257);
                // console.log("烘箱仪器3数据" + data);

            }

            let hxStateData = monitorUtil.handleHxData(data);
            let isOpen = (data[7] == 1);//若烘箱状态为启动中
            hxStateData.isLine = isOpen ? 1 : 0;
            hxStateData.hxState = hxObjId;
            HxDatalastStateService.removeState(hxObjId).then(function () {
                HxDatalastStateService.save(hxStateData)
                    .then(function () {


                        hx1 = setTimeout(inter, IntervalTime1)
                    })
                    .catch(function (err) {
                        log.error(err);
                        hx1 = setTimeout(inter, IntervalTime1)
                    });
            })
        }
    },
    lhj: function () {
        LhjStateService.find().then(function (models) {
            for (let i = 0; i < models.length; i++) {
                back.lhjCallBack(models[i], i)
                back.lhjlastCallBack(models[i], i)
            }
        });
    },//硫化机
    lhjCallBack: function (lhj) {
        let lhjObjId = lhj._id;
        let lhj1 = '';
        inter();
        function inter() {
            clearTimeout(lhj1);
            let lhjSaveData1 = back.getrd(2200, 2323)
            let lhjSaveData2= back.getrd(2324, 2336)
            // let lhjSaveData1 = back.getrdtest(2200, 2323)
            // let lhjSaveData2= back.getrdtest(2324, 2336)
            //存储数据
            let lhjStateData1 = monitorUtil.handleLhjData1(lhjSaveData1);
            let lhjStateData2 = monitorUtil.handleLhjData2(lhjSaveData2);
            let lhjStateData = _.merge(lhjStateData1, lhjStateData2);
            lhjStateData.isLine = lhjSaveData2 ? 1 : 0;//若硫化机状态为启动中
            lhjStateData.lhjState = lhjObjId;
            console.log("硫化机数据"+lhjSaveData1+","+lhjSaveData2)

          //硫化机通讯状态判断

            if(lhstatus!=back.getrd(2199, 2199)[0]) {
                lhstatushyy=true;
            }else {
              lhstatushyy=false;
            }
            lhstatus=back.getrd(2199, 2199)[0];

            if(lhstatushyy){
                LhjStateService.findById(lhjObjId)
                    .then(function (data) {

                            LhjStateService.update(lhjObjId, {connectState: 1})

                    })
            }else{
                LhjStateService.findById(lhjObjId)
                    .then(function (data) {
                            LhjStateService.update(lhjObjId, {connectState: 0})
                    })
            }
            console.log("硫化标志是"+lhjStateData2.lhbz);
            console.log("硫化数据是"+lhjStateData2);
            if(lhjStateData2.lhbz==1) {
                LhjStateDataService.save(lhjStateData)
                    .then(function () {
                        console.log("硫化机数据写入成功" + lhjSaveData1 + "," + lhjSaveData2)
                        //先查询再更改hxState通讯状态改为1
                        LhjStateService.findById(lhjObjId)
                            .then(function (newLhjObj) {
                                let tIds = newLhjObj.tIds;
                                // if (newLhjObj.connectState != 1) {
                                //     LhjStateService.update(lhjObjId, {connectState: 1})
                                // }
                                //当任务号完成硫化，删除任务号；当四个任务号全部完成，state为0
                                if (lhjSaveData2[8] == 1) {
                                    let tId = monitorUtil.ascii2Str(_.slice(lhjSaveData1, 0, 8));
                                    if (tIds.indexOf(tId) != -1) {
                                        LhjStateService.update(lhjObjId, {tIds: _.without(tIds, tId)}) //更新LhjState状态
                                        ProdProceService.find({tId: tId, sType: 's1'})  //更新工序状态
                                            .then(function (ProdProceData) {
                                                if (ProdProceData.prodState == 2) {
                                                    ProdProceData.prodState = 3
                                                    ProdProceService.update(ProdProceData._id, ProdProceData)
                                                }
                                            })
                                    }
                                }
                                if (lhjSaveData2[9] == 1) {
                                    let tId = monitorUtil.ascii2Str(_.slice(lhjSaveData1, 8, 16));
                                    if (tIds.indexOf(tId) != -1) {
                                        LhjStateService.update(lhjObjId, {tIds: _.without(tIds, tId)})
                                        ProdProceService.find({tId: tId, sType: 's1'})  //更新工序状态
                                            .then(function (ProdProceData) {
                                                if (ProdProceData.prodState == 2) {
                                                    ProdProceData.prodState = 3
                                                    ProdProceService.update(ProdProceData._id, ProdProceData)
                                                }
                                            })
                                    }
                                }
                                if (lhjSaveData2[10] == 1) {
                                    let tId = monitorUtil.ascii2Str(_.slice(lhjSaveData1, 16, 24));
                                    if (tIds.indexOf(tId) != -1) {
                                        LhjStateService.update(lhjObjId, {tIds: _.without(tIds, tId)})
                                        ProdProceService.find({tId: tId, sType: 's1'})  //更新工序状态
                                            .then(function (ProdProceData) {
                                                if (ProdProceData.prodState == 2) {
                                                    ProdProceData.prodState = 3
                                                    ProdProceService.update(ProdProceData._id, ProdProceData)
                                                }
                                            })
                                    }
                                }
                                if (lhjSaveData2[11] == 1) {
                                    let tId = monitorUtil.ascii2Str(_.slice(lhjSaveData1, 24, 32));
                                    if (tIds.indexOf(tId) != -1) {
                                        LhjStateService.update(lhjObjId, {tIds: _.without(tIds, tId)})
                                        ProdProceService.find({tId: tId, sType: 's1'})  //更新工序状态
                                            .then(function (ProdProceData) {
                                                if (ProdProceData.prodState == 2) {
                                                    ProdProceData.prodState = 3
                                                    ProdProceService.update(ProdProceData._id, ProdProceData)
                                                }
                                            })
                                    }
                                }
                                if (lhjSaveData2[8] == 1 && lhjSaveData2[9] == 1 && lhjSaveData2[10] == 1 && lhjSaveData2[11] == 1) {
                                    if (newLhjObj.state != 0) {
                                        LhjStateService.update(lhjObjId, {state: 0})
                                    }
                                }
                            })
                        lhj1 = setTimeout(inter, IntervalTime2)
                    })
                    .catch(function (err) {
                        log.error(err);
                        lhj1 = setTimeout(inter, IntervalTime2)
                    });
            }else{
                lhj1 = setTimeout(inter, IntervalTime2)
            }
        }
    },
    lhjlastCallBack: function (lhj) {
        let lhjObjId = lhj._id;
        let lhj1 = '';
        inter();
        function inter() {
            clearTimeout(lhj1);
            let lhjSaveData1 = back.getrd(2200, 2323)
            let lhjSaveData2= back.getrd(2324, 2336)
            // let lhjSaveData1 = back.getrdtest(2200, 2323)
            // let lhjSaveData2= back.getrdtest(2324, 2336)
            //存储数据
            let lhjStateData1 = monitorUtil.handleLhjData1(lhjSaveData1);
            let lhjStateData2 = monitorUtil.handleLhjData2(lhjSaveData2);
            let lhjStateData = _.merge(lhjStateData1, lhjStateData2);
            lhjStateData.isLine = lhjSaveData2 ? 1 : 0;//若硫化机状态为启动中
            lhjStateData.lhjState = lhjObjId;
            console.log("硫化机数据"+lhjSaveData1+","+lhjSaveData2)
            LhjlastStateDataService.removeState().then(function () {
                LhjlastStateDataService.save(lhjStateData)
                    .then(function () {
                        lhj1 = setTimeout(inter, IntervalTime2)
                    })
                    .catch(function (err) {
                        log.error(err);
                        lhj1 = setTimeout(inter, IntervalTime2)
                    });
            });
        }
    }
}
// back.init();
