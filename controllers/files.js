var db = require('../database.js')
var sql = require('squel').useFlavour('mysql')
var moment = require('moment')

var dateformat = 'YYYY-MM-DD HH:mm:ss';

var boxes = {
  name: 'eisvillageserver.files',
  columns: ['BoxID', 'Name', 'Description', 'Country', 'Language', 'LastSynced', 'Status', 'DateCreated', 'LastUpdated']
}

/**
 *  Exports contain all the actual queries that our server will be running
 */
exports.createBox = function(payload, callback) {
  now = moment().format(dateformat);

  // Getting the id for our newest box
  db.get().query('SELECT COUNT(*) from eisvillageserver.boxes', function(error, result) {
      var boxid = result[0]["COUNT(*)"]

      // Generating query
      // Insert into database the form (payload) inputs
      var q = sql.insert()
           .into('eisvillageserver.boxes')
           .set('BoxID', boxid)
           .set('Name', payload.body.name)
           .set('Description', payload.body.description)
           .set('Country', payload.body.country)
           .set('Language', payload.body.language)
           .set('DateCreated', now)
           .set('LastUpdated', now)

      // Actually running the query
      db.get().query(q.toString(), q.values, function(error, result) {
        // Running a query to get our return value
        var q = sql.select()
                   .from(boxes.name)
                   .where("BoxID = ?", boxid)

        // Getting our return
        db.get().query(q.toString(), function(err, row) {
          result = JSON.stringify(row);
          console.log(result);
          if (error) return callback(error)
          callback(null, result)
        })
      })
  })

}

exports.numBoxes = function(callback) {
  db.get().query("SELECT COUNT(*) FROM eisvillageserver.boxes", function(error, rows) {
    var countJSON = JSON.stringify(rows);
    callback(countJSON)
  })
}


exports.getAllBoxes = function(callback) {
  var q = sql.select().from(boxes.name)
  db.get().query(q.toString(), function(error, result) {
      if (error) callback(error);
      var rows = JSON.stringify(result);
      callback(null, result);
  })
}

exports.getBox = function(payload, callback) {
  boxID = payload;
  var q = sql.select()
             .from(boxes.name)
             .where("BoxID = ?", boxID);
  db.get().query(q.toString(), function(error, result) {
    if (error) callback(error);
    var row = JSON.stringify(result);
    callback(null, result);
  })

}

exports.createBoxTable = function() {
  db.get().query("CREATE TABLE if not exists eisvillageserver.boxes(BoxID INT, Name VARCHAR(255), Description LONGTEXT, Country VARCHAR(255), Language VARCHAR(255), LastSynced DATETIME, Status VARCHAR(255), DateCreated DATETIME, LastUpdated DATETIME)")
}
