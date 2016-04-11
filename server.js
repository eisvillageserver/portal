/**
 * APP DEPENDENCIES
 */
var express = require("express");
var bodyParser = require("body-parser");
var mysql = require('mysql');
var hbs  = require('express-handlebars');
var sql = require('sql');
var moment = require('moment');
var multer = require('multer');
var upload = multer();
var http = require('http');

var auth = require("http-auth");

var basic = auth.basic({
  authRealm: "Portal",
  authFile: __dirname + ".htpasswd"
}, function(username, password, callback) {
	callback('Authenticated')
});

/**
 *
 */
var db = require('./database')
var boxes = require('./controllers/boxes')
var files = require('./controllers/files')


var app = express();

app.use(auth.connect(basic));


var router = express.Router();
var path = __dirname + '/views/';



db.connect(function(error) {
  if (error) {
    console.log('Unable to connect to RDS')
    process.exit(1)
  }
  else {
    console.log('Connected to RDS')
    boxes.createBoxTable()
    files.createFileTable()
  }
})


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.engine('handlebars', hbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use('/static', express.static('public'));

router.use(function (req,res,next) {
  console.log("/" + req.method);
  next();
});

// API
app.get("/count", function(req, res) {
  boxes.numBoxes(function(resp) {
    res.send(resp)
  })
});

app.post('/boxes', function(req, res) {
  boxes.createBox(req, function(error, resp){
    if (error) throw error
    res.send(resp)
  });
})

app.get("/boxlist", function(req, res) {
  boxes.getAllBoxes(function(error, resp){
    if (error) throw error
    res.send(resp)
  })
})

app.get("/boxlist/:id", function(req, res) {
  var id = req.params.id;
  boxes.getBox(id, function(error, id) {
    if (error) throw error;
    res.send(id)
  })
})

app.get("/s3", function(req, res) {
  var key = req.query.key;
  files.getS3URI(key, function(error, url) {
    if (error) throw error;
    res.send(url);
  })
})

// app.post("/files", function(req, res) {
//     files.uploadFile(req, function(err, url) {
//       if (err) console.log(err);
//       res.json({url:url})
//     })
// })

router.route('/files').post(upload.any(), files.uploadFile) // TODO: MAKE THIS LOOK LIKE THE OTHERS

app.get("/files/:id", function(req, res) {
  var id = req.params.id;
  files.getFilesForBox(id, function(error, id) {
    if (error) throw error;
    res.send(id);
  })
})

app.delete("/files/:uid", function(req, res) {
  var id = req.params.uid;

  files.deleteFile(id, function(error, resp) {
    if (error) throw error;
    res.send(resp);
  })
})

app.put("/files", function(req, res) {
  files.updateFile(req, function(error, resp) {
      if (error) throw error;
      res.send(resp);
  })
})

// PAGES
app.get("/",function(req,res) {
  res.render("index");
});

app.get("/create", function(req, res) {
  res.render("create");
})

app.get("/boxes", function(res, res) {
  res.render("boxes");
})

app.get("/boxes/:id", function(res, res) {
  res.render("box")
})

app.use("/",router);

app.use("*",function(req,res){
  res.sendFile(path + "404.html");
});


// Setup route.
app.get('/', function(req, res){
  res.send("Hello from express - " + req.user + "!");
});

app.listen(3000,function(){
  console.log("Live at Port 3000");
});
