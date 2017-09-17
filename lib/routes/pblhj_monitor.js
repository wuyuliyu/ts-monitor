var express = require('express');
var router = express.Router();

var lhjStateDataService = require('../services/pblhj_state_data');
var Promise = require('bluebird');
var log = require('../utils/log4js').default();
var moment = require('moment')

/**
 * 查询
 */
router.post('/pblhjmonitor', function (req, res) {
    var id = "59684085be8a3e1d6c7f4c45";
    var start = req.body.start;
    var end = req.body.end;

    lhjStateDataService.find({
            lhjState:id,
            isLine:1,
            "$and":[{"addDate":{"$gt":moment(start).format('YYYY-MM-DD HH:mm')}},{"addDate":{"$lt":moment(end).format('YYYY-MM-DD HH:mm')}}] // 某个时间段
        },{
            path: 'lhjState'
        })
        .then(function (list) {
            return res.json(list);
        })
        .catch(function (err) {
            log.error(err);
            res.status(500).json(err);
        });
});

/**
 * 查询最后一条数据
 */
router.post('/pblhjmonitorLastData', function (req, res) {
    var eqIp = req.body.eqIp;
    lhjStateDataService.findLast({isLine:1},{
            path: 'lhjState',
            match: {eqIp: eqIp}
        })
        .then(function (list) {
            return res.json(list);
        })
        .catch(function (err) {
            log.error(err);
            res.status(500).json(err);
        });
});

/**
 * 查询最后一条数据
 * Todo 其实应该查当前时间的数据
 */
router.post('/pblhjmonitorLastData2', function (req, res) {
    var eqIp = req.body.eqIp;

    lhjStateDataService.findLast({},{
            path: 'lhjState',
            match: {eqIp: eqIp}
        })
        .then(function (list) {
            return res.json(list);
        })
        .catch(function (err) {
            log.error(err);
            res.status(500).json(err);
        });
});


module.exports = router;