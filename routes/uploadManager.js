
// TODO: move these oprions to confing file
var uploader_options = {
  tmpDir: __dirname + '/../public/uploaded/tmp',
  uploadDir: __dirname + '/../public/uploaded/files',
  uploadUrl: '/uploaded/files/',
  storage: {
    type: 'local'
  }
};

var options = {
  uploadDir: __dirname + '/../public/uploaded/files',
  resultDir: __dirname + '/../public/results'
};


var uploader = require('blueimp-file-upload-expressjs')(uploader_options),
    fs = require('fs'),
    mv = require('mv'),
    path = require('path'),
    EasyZip = require('easy-zip'),
    mime = require('mime'),
    rimraf = require('rimraf'),
    converter = require('../bin/converter');

module.exports = function(router) {

  var fixFileNamePath = function(fpath, dname, newname) {
    var bname = path.basename(fpath);
    return fpath.replace(bname, dname+'/'+newname);

  };


  router.get('/upload', function(req, res) {
    uploader.get(req, res, function(obj) {
      res.send(JSON.stringify(obj));
    });
  });


  // Handls uploading of files
  router.post('/upload/:id/:num', function(req, res) {

    /* create uploader */
    var id = req.param("id"),
        num = req.param("num");

    try {
      fs.mkdirSync(options.uploadDir + '/' + id);
    } catch(e) {

      if ( e.code != 'EEXIST' ) {
        console.error('Error creating uploadDir', e);
      }
    }


    uploader.post(req, res, function(obj) {

      /* data was trasfered, move it to right folder */
      var fname = obj.files[0].name,
          nname = num +'-'+obj.files[0].name;
      //console.log(id, options.uploadDir+'/'+id+'/'+nname);
      mv (options.uploadDir+'/'+fname, options.uploadDir+'/'+id+'/'+nname, function(err) {
        if (err) {
          console.log('moving uploaded file:',err);
          res.send('false');
        }
        else {
          res.send('true');
        }
      });


      /* modify delete url */ //This is not supported/neded at the moment
      /*
      //with new location and with new name
      //TODO fix delete links, delete links do not work...
      obj.files[0].url = fixFileNamePath(obj.files[0].url, id, nname);
      obj.files[0].deleteUrl = fixFileNamePath(obj.files[0].deleteUrl, id, nname);
      res.send(JSON.stringify(obj));
      console.log(obj);
      */

    });
  });


  // Delte uploaded file, not supported
  /*
  router.delete('/uploaded/files/:id/:name', function(req, res) {

    //do not use uploader to delete file, beacuse file location changed

    var id = req.param("id");
    var fname = req.param("name");
    fs.unlink(options.uploadDir + '/' + id + '/' + fname, function(err) {
      var obj = {};
      if (err) obj.sucess = false;
      else obj.sucess = true;
      res.send(JSON.stringify(obj));
    });


    uploader.delete(req, res, function(obj) {
      console.log(obj);
      res.send(JSON.stringify(obj));
    });


  });
  */

  // Handles request for convertion
  router.get('/convert/:id/:options', function(req, res) {

    var id = req.param("id"),
        pagesetup = JSON.parse(req.param("options"));

    /* convert files to pdf */
    converter(id, options.uploadDir, options.resultDir, pagesetup, function(err, result){

      // Respond with link to file or false if conversion was not succesful

      if (err) {
        res.send("false");
      } else {
        res.send('/download/'+id);
      }

      // clean up working files
      rimraf(options.uploadDir + '/' + id, function (err) {
        console.error(err);
      });

    });




  });


  // Handles request for file download
  router.get('/download/:id', function(req, res) {

    var id = req.param("id");

    // Get filename
    var fn;
    fn = fs.readdir(options.resultDir + '/' + id, function(err, files) {

      if (err) {
        res.render('downloaderror', { title: 'Error downloading' });
      } else {
        var file = options.resultDir + '/' + id + '/' + files[0];
        res.contentType(mime.lookup(file));
        fs.readFile(file, function(err, data) {
          res.send(data);
        });
      }

    });

  });

  return router;


};
