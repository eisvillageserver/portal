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

exports.getFilesForBox = function(payload, callback) {
  var q = sql.select()
             .from(files.name)
             .where("BoxID = ?", payload);
  db.get().query(q.toString(), function(error, result) {
    if ( error ) callback(error);
    var rows = JSON.stringify(result);
    callback(null, result);
  })
}

exports.deleteFile = function(payload, callback) {
  var uid = payload;

  var get_s3_uri_q = sql.select()
                        .from(files.name)
                        .where("UID = ?", payload);

  var delete_q = sql.delete()
                    .from(files.name)
                    .where("UID = ?", payload);

  db.get().query(get_s3_uri_q.toString(), function(error, result) {
    if (error) callback(error)
    else {
      console.log(s3bucket)
      var s3 = new aws.S3()
      var key = result[0].S3URI;
      var s3params = {
        Bucket: s3bucket,
        Key: key
      }
      s3.deleteObject(s3params, function(error, data) {
        if (error) callback(error);
        else {
          console.log(delete_q.toString())
          db.get().query(delete_q.toString(), function(error, result) {
            if (error) callback(error, null);
            else {
              console.log(result);
              var rows = JSON.stringify(result);
              callback(null, result);
            }
          })
        }
      })
    }
  })
  // db.get().query(q.toString(), function(error, result) {
  //   if (error) callback(error);
  //   callback(null, result);
  // })
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

exports.updateFile = function(payload, callback) {
  var title = payload.body.title;
  var description = payload.body.description;
  var category = payload.body.category;
  var uid = payload.body.uid;

  var original = sql.select().from(files.name)
                             .where("UID = ?", uid)

  db.get().query(original.toString(), function(error, row) {
    var q = sql.update().table(files.name).where("UID = ?", uid)

    if ( title == null || typeof title == undefined ) {
      console.log("Title is undefined")
      title = row[0].Title;
    } else {
      q.set("Title", title)
    }
    if ( description == null || typeof description == undefined ) {
      console.log("Description is undefined");
      description = row[0].Description;
    } else {
      q.set("Description", description)
    }
    if ( category == null || typeof category == undefined ) {
      console.log("Category is undefined");
      category = row[0].Category;
    } else {
      q.set("Category", category)
    }

    now = moment().format(dateformat);
    q.set("LastUpdated", now);

    console.log(q.toString());

    var fileExtension = row[0].S3URI.split('.').pop();
    var newKey = row[0].BoxID + '/' + category + '/' + uid + '-' + title + '.' + fileExtension;
    var oldKey = row[0].S3URI;

    console.log('newkey ' + newKey)
    console.log('oldkey ' + oldKey)
    var s3 = new aws.S3();

    if ( !(newKey === oldKey) ) {
      q.set("S3URI", newKey)
      var s3params = {
        CopySource: s3bucket + '/' + oldKey,
        Key: newKey,
        Bucket: s3bucket
      }

      var deleteParams = {
        Bucket: s3bucket,
        Key: oldKey
      }

      s3.copyObject(s3params, function(error, data) {
        if (error) {
          console.log(error);
          console.log("COPY ERROR")
          callback(error)
        }
        console.log("Successfully Copied")
        s3.deleteObject(deleteParams, function(error, data) {
          if (error)  {
            console.log(error)
            console.log("DELETE ERROR")
            callback(error);
          }
          else {

            console.log("Successfuly Deleted")
            db.get().query(q.toString(), function(error, result) {
              if (error) callback(error);
              var rows = JSON.stringify(result);
              callback(null, rows);
            })
          }
        })
      })
    } else {
      db.get().query(q.toString(), function(error, result) {
        if (error) callback(error);
        var rows = JSON.stringify(result);
        callback(null, rows);
      })
    }
  })
}

exports.createFileTable = function() {
  db.get().query("CREATE TABLE if not exists eisvillageserver.files(UID VARCHAR(255), Title VARCHAR(255), Description LONGTEXT, DateUploaded DATETIME, S3URI VARCHAR(255), Category VARCHAR(255), Language VARCHAR(255), Country VARCHAR(255), DownloadCount INT, LastUpdated DATETIME, BoxID INT)")
}
