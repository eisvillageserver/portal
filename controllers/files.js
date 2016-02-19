var db = require('../database.js')
var sql = require('squel').useFlavour('mysql')
var moment = require('moment')

var shortid = require('shortid');

var aws = require('aws-sdk');
aws.config.loadFromPath('./aws.json');

var s3bucket = "eisvillageserver"

var dateformat = 'YYYY-MM-DD HH:mm:ss';

var files = {
  name: 'eisvillageserver.files',
  columns: ['UID', 'Title', 'Description', 'DateUploaded', 'S3URI', 'Category', 'Language', 'Country', 'DownloadCount', 'LastUpdated', 'BoxID']
}

exports.getFilesForBox = function() {

}

exports.deleteFile = function() {

}

exports.uploadFile = function(payload, res) {
  var file = payload.files[0];
  console.log(file);
  console.log(payload.body);

  filetype = file.mimetype.split('/')[1];
  console.log(filetype);
  var uid = shortid.generate()

    var s3 = new aws.S3()
    var key = payload.body.boxID + '/' + payload.body.cat + '/' + uid + '-' + payload.body.title + '.' + filetype;
    console.log(key);
    var s3_params = {
      Bucket: s3bucket,
      Key: key,
      ContentType: file.mimetype,
      ACL: 'public-read',
      Body: file.buffer
    }

    now = moment().format(dateformat);

    s3.putObject(s3_params, function(err, data) {
      if (err) console.log(err)
      else {
        res.message = "successfully uploaded!";
        var q = sql.insert()
             .into('eisvillageserver.files')
             .set('UID', uid)
             .set('Title', payload.body.title)
             .set('Description', payload.body.description)
             .set('DateUploaded', now)
             .set('S3URI', key)
             .set('Category', payload.body.cat)
             .set('Language', payload.body.language)
             .set('Country', payload.body.country)
             .set('DownloadCount', 0)
             .set('LastUpdated', now)
             .set('BoxID', payload.body.boxID);
         db.get().query(q.toString(), q.values, function(error, result) {
         })
      }
    })

}

exports.getFile = function() {

}

exports.createFileTable = function() {
  db.get().query("CREATE TABLE if not exists eisvillageserver.files(UID VARCHAR(255), Title VARCHAR(255), Description LONGTEXT, DateUploaded DATETIME, S3URI VARCHAR(255), Category VARCHAR(255), Language VARCHAR(255), Country VARCHAR(255), DownloadCount INT, LastUpdated DATETIME, BoxID INT)")
}
