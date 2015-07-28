var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  defaults: {
    username: '',
    password: ''
  },
  initialize: function(){
    // model.set('username', username, );
    this.on('creating', function(model, attrs, options){
      model.set({'username': 'Alex', 'password': '12345'});
      console.log(model);
    });
    
  }
});

module.exports = User;