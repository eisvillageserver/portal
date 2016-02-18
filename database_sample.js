var mysql = require('mysql')
var async = require('async')

var state = {
  pool: null
}

exports.connect = function(done) {
  state.pool = mysql.createPool({
    host: 'sqlhost',
    user: 'sqluser',
    password: 'sqlpassword',
    port: '3306',
    database: 'eisvillageserver'
  })
  done()
}

exports.get = function() {
  return state.pool;
}
