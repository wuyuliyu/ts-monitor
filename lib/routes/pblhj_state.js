var express = require('express');
var router = express.Router();
var _ = require('lodash');

var prodProdService = require('../services/prod_prod');
var ProdProceService = require('../services/prod_proce'); //工序
var pblhjStateService = require('../services/pblhj_state');
var pblhjStateDataService = require('../services/pblhj_state_data');
var pblhjStatelastDataService = require('../services/pblhj_state_lastdata');
var monitorUtil = require('../utils/monitorUtil');
var Modbus = require('../utils/ModBus.js')
var server = require('../routes/server');
var log = require('../utils/log4js').default();
let IntervalTime2 = 5 * 1000;
/**
 * 查询
 */
router.get('/pblhjstates', function (req, res) {
    pblhjStateService.find()
        .then(function (list) {
            Promise.all(list.map(item => {
                return pblhjStatelastDataService.findLastData({lhjState: item._id})
            })).then(data => {
                let newList = [];
                for (let i = 0; i < list.length; i++) {
                    if (data[i][0]) {
                        delete data[i][0]._id;
                    }
                    newList.push(_.merge(list[i],data[i][0] ? data[i][0] : {} ));
                }
                res.json(newList);
            });
        })
        .catch(function (err) {
            log.error(err);
            res.status(500).json(err);
        });
});

/**
 * 查询完整状态一段硫化的任务号
 */
router.get('/pblhjstates/tasks', function (req, res) {
    ProdProceService.find()
        .then(function (list) {
            let newList = [];


            _.forEach(_.groupBy(_.sortBy(list, 'index'), 'tId'), function (item, index) {
                let s2Index = -1,s1Index = 0;
                _.forEach(item, function (childItem, childIndex) {
                    if (childItem.sType == 's2' && childItem.prodState == 3) {
                        s2Index = childIndex;
                    }
                    if (childItem.sType == 's1' && childItem.prodState == 0) {
                        s1Index = childIndex;
                    }
                })
                if (s2Index<s1Index) {
                    newList.push(index);
                }
            });
            if(req.params.tId){
                let hasSelect=_.find(list,{tId:req.params.tId,sType:"s1"}).wpc
                _.filter(newList,function (item) {
                    return monitorUtil.deepCompare(item,hasSelect);
                })
            }
            res.json(newList);
        });
});


/**
 * 新增
 */
router.post('/pblhjstate', function (req, res) {
    var body = req.body;
    var userId = req.user._id;

    var tId = body.tIds.filter(function (item) {
        return !!item;
    })[0];

    pblhjStateService.find({eqId: body.eqId})
        .then(function (list) {
            if (list.length) {
                res.status(409).end();
            } else {
                prodProdService.findOne({tId: tId})
                    .then(function (prod) {
                        if (prod) {
                            var wp = _.find(prod.wp.toObject(), {sType: 's1'});

                            if (wp) {
                                return {
                                    pqyl: wp.child[0].value,
                                    pqcs: wp.child[1].value,
                                    swsj: wp.child[2].value,
                                    lhsj: wp.child[3].value,
                                    lhyl: wp.child[4].value,
                                    lhylcz: wp.child[5].value,
                                    lhwd: wp.child[6].value,
                                    lhwdzdz: wp.child[7].value,
                                    lhwdzxz: wp.child[8].value
                                };
                            } else {
                                return {};
                            }


                        } else {
                            return {};
                        }
                    })
                    .then(function (data) {
                        return pblhjStateService.save(_.extend(body, data, {adder: userId}));

                    })
                    .then(function (data) {
                        res.json(data);
                    })
                    .catch(function (err) {
                        log.error(err);
                        res.status(500).json(err);
                    });
            }
        });

});

/**
 * 修改
 */
router.put('/pblhjstate/:id', function (req, res) {
    var body = req.body;
    delete  body._id;

    var id = req.body.lhjState;
    var userId = req.user._id;

    var tIds = body.tIds.filter(function (item) {
        return !!item;
    });

    var tId = tIds.length ? tIds[0] : 0;

        pblhjStateService.findById(id)
        .then(function (list) {
            if (list && list.state == 0 && list.connectState == 1) {
                prodProdService.findOne({tId: tId})
                    .then(function (prod) {
                        var wp;
                        if (prod) {
                            wp = _.find(prod.wp.toObject(), {sType: 's1'});
                        }

                        if (wp) {
                            return {
                                pqyl: wp.child[0].value,
                                pqcs: wp.child[1].value,
                                swsj: wp.child[2].value,
                                lhsj: wp.child[3].value,
                                lhyl: wp.child[4].value,
                                lhylcz: wp.child[5].value,
                                lhwd: wp.child[6].value,
                                lhwdzdz: wp.child[7].value,
                                lhwdzxz: wp.child[8].value
                            };
                        } else {
                            return {
                                pqyl: null,
                                pqcs: null,
                                swsj: null,
                                lhsj: null,
                                lhyl: null,
                                lhylcz: null,
                                lhwd: null,
                                lhwdzdz: null,
                                lhwdzxz: null
                            };
                        }
                    })
                    .then(function (data) {
                        return pblhjStateService.update(id, _.extend(body, data, {
                            adder: userId
                        }));
                    })
                    .then(function (data) {
                        let oldIds = list.tIds,
                            commonIds = [],
                            exceptTIds = [],
                            newTIds = [];
                        commonIds = _.intersection(tIds, oldIds);
                        exceptTIds = _.difference(oldIds, commonIds);
                        newTIds = _.difference(tIds, commonIds);
                        //更新工序状态
                        //1.解绑
                        if (exceptTIds.length > 0) {
                            Promise.all(_.map(exceptTIds, item=> {
                                    return ProdProceService.find({tId: item, sType: 's1'})
                                }))
                                .then(ProdProceData => {
                                    for (let i = 0; i < ProdProceData.length; i++) {
                                        let ProdProceDataStr = ProdProceData[i][0]
                                        if (ProdProceDataStr.prodState == 1) {
                                            ProdProceDataStr.prodState = 0
                                            ProdProceService.update(ProdProceDataStr._id, ProdProceDataStr)
                                        }
                                    }
                                })
                                .catch(function (e) {
                                    log.error(e);
                                    res.status(500).json(e);
                                });
                        }

                        //2.新绑定
                        if (newTIds.length > 0) {
                            Promise.all(_.map(newTIds, item=> {
                                    return ProdProceService.find({tId: item, sType: 's1'})
                                }))
                                .then(ProdProceData => {
                                    for (let i = 0; i < ProdProceData.length; i++) {
                                        let ProdProceDataStr = ProdProceData[i][0]
                                        if(ProdProceDataStr) {
                                            if (ProdProceDataStr.prodState == 0) {
                                                ProdProceDataStr.prodState = 1
                                                ProdProceService.update(ProdProceDataStr._id, ProdProceDataStr)
                                            }
                                        }
                                    }
                                    res.json({code: 200, msg: '修改成功'});

                                })
                                .catch(function (e) {
                                    log.error(e);
                                    res.status(500).json(e);
                                });
                        } else {
                            res.json({code: 200, msg: '修改成功'});
                        }
                    })
                    .catch(function (err) {
                        log.error(err);
                        res.status(500).json(err);
                    });
            } else {
                var resData = {code: 201, msg: '当前状态不允许绑定'};
                res.json(resData);
            }

        });
});

/**
 * 删除
 */
router.delete('/pblhjstate/:id', function (req, res) {
    let id = req.params.id;
    pblhjStateService.remove(id)
        .then(function () {
            res.end();
        })
        .catch(function (err) {
            log.error(err);
            res.status(500).json(err);
        });
});

router.put('/pblhjstates/write', function (req, res) {
    let body = req.body;
    let id = body._id;
    delete  body._id;
    let tIds = body.tIds;
    //处理任务号

    //查询一段硫化的数据
    pblhjStateService.findById(req.body.lhjState)
        .then(function (data) {
            let lhjData = [];//要写入到mod的数据数据
            lhjData[0] = data.pqyl;
            lhjData[1] = data.pqcs;
            lhjData[2] = data.swsj;
            lhjData[3] = data.lhyl;
            lhjData[4] = data.lhylcz;
            lhjData[5] = data.lhsj;
            lhjData[6] = data.lhwd;
            lhjData[7] = data.lhwdzdz;
            lhjData[8] = data.lhwdzxz;
            let tIdDatas=monitorUtil.handleLhjWriteData(data);
            // lhjData.concat(tIdDatas);
            // lhjData[114] = req.user.wuId;//操作员工号

            //写入数据
            // let option = {
            //     ip: data.eqIp,
            //     id: data.eqId,
            //     port: data.eqPort
            // }
            // let lhjMd = new Modbus(option);
            // lhjMd.connect();
            let lhj1 = '';
            inter();
            inter2();

            function inter() {
                clearTimeout(lhj1);
                console.log("写入硫化机地址2000:"+lhjData)
                server.setwd(2000, lhjData);
                console.log("写入硫化机任务号地址2015:"+tIdDatas)
                server.setwd(2015, tIdDatas);
                pblhjStateService.update(id, {state: 1, picker: req.user._id});

                lhj1 = setTimeout(inter, IntervalTime2);

            }

            function inter2 () {
                //更新工序状态
                Promise.all(_.map(tIds, item=> {
                    return ProdProceService.find({tId: item, sType: 's1'})
                }))
                    .then(ProdProceData => {
                        for (let i = 0; i < ProdProceData.length; i++) {

                            let ProdProceDataStr = ProdProceData[i][0];
                            if(ProdProceDataStr) {
                                if (ProdProceDataStr.prodState == 1) {
                                    ProdProceDataStr.prodState = 2;
                                    ProdProceService.update(ProdProceDataStr._id, ProdProceDataStr)
                                }
                            }
                        }
                        console.log("写入成功")
                        res.json({code: 200, msg: '写入成功'});
                    })
                    .catch(function (e) {
                        log.error(e);
                        res.status(500).json(e);

                    });
            }
        })
        .catch(function (err) {
            log.error(err);
            res.status(500).json(err);
        });

});

/*str_temp=str   '把输入的字符串转换成ASCII码值再两两合并成一个16位二进制数

 str_temp2=!mid(str_temp,1,1)     '取字符串最左边第一个字符
 temp0=!Ascii2I(str_temp2)        '把该字符转换成ASCII码值

 str_temp2=!mid(str_temp,2,1)     '取字符串最左边第二个字符
 temp1=!Ascii2I(str_temp2)        '把该字符转换成ASCII码值

 第一二位=temp0*256+temp1         '把字符串最左边第一二个字符转换的ASCII码值合并成一个16位二进制数


 str_temp2=!mid(str_temp,3,1)     '取字符串最左边第三个字符
 temp0=!Ascii2I(str_temp2)        '把该字符转换成ASCII码值

 str_temp2=!mid(str_temp,4,1)     '取字符串最左边第四个字符
 temp1=!Ascii2I(str_temp2)        '把该字符转换成ASCII码值

 第三四位=temp0*256+temp1         '把字符串最左边第三四个字符转换的ASCII码值合并成一个16位二进制数


 str_temp2=!mid(str_temp,5,1)     '取字符串最左边第五个字符
 temp0=!Ascii2I(str_temp2)        '把该字符转换成ASCII码值

 str_temp2=!mid(str_temp,6,1)     '取字符串最左边第六个字符
 temp1=!Ascii2I(str_temp2)        '把该字符转换成ASCII码值

 第五六位=temp0*256+temp1         '把字符串最左边第五六个字符转换的ASCII码值合并成一个16位二进制数

 str_temp2=!mid(str_temp,7,1)     '取字符串最左边第七个字符
 temp0=!Ascii2I(str_temp2)        '把该字符转换成ASCII码值

 str_temp2=!mid(str_temp,8,1)     '取字符串最左边第八个字符
 temp1=!Ascii2I(str_temp2)        '把该字符转换成ASCII码值

 第七八位=temp0*256+temp1        '把字符串最左边第七八个字符转换的ASCII码值合并成一个16位二进制数*/

//一个寄存器怎样区分两个数值

module.exports = router;