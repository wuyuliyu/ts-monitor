var ProdProd = require('../models/prod_prod');

module.exports = {
  save: function (data) {
    return new ProdProd(data).save()
      .then((data) => {
        return this.findById(data._id);
      });
  },
  find: function (params) {
    return ProdProd.find(params)
      .populate('files', '_id name')
      .populate('mould')
      .sort({addDate: -1})
      .exec();
  },
  findTasks: function (params) {
    return ProdProd.find(params)
      //.select({tId: 1})
      .sort({addDate: -1})
      .exec();
  },
  findOne: function (params) {
    return ProdProd.findOne(params)
      .populate('files', '_id name')
      .exec();
  },
  findById: function (id) {
    return ProdProd.findById(id)
      .populate('files', '_id name')
        .populate('mould')
      .exec();
  },
  update: function (id, data) {
    return ProdProd.update({_id: id}, data).then(() => {
      return this.findById(id);
    });
  },
  remove: function (id) {
    return ProdProd.findByIdAndRemove(id);
  },
  updateMany:function(query,data){
    return ProdProd.updateMany(query, data)
        .exec();
  }
};