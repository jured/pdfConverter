

var Converter = function(folder, options, ret) {

  var fs = require('fs'),
      async = require('async'),
      mime = require('mime'),
      mv = require('mv'),
      cp = require('cp'),
      EasyZip = require('easy-zip'),
      jpg2pdf = require('./jpg2pdf.js'),
      PDF = require('./mergePDFfiles.js');

  var get_filenames = function(f) {
    var fn;
    try {
      fn = fs.readdirSync(f);
    } catch (err) {
      console.log('ERROR Coverter:', err);
      //add error handling
    }
    return fn;
  };

  var remove_extension = function(filename) {
    var i = filename.lastIndexOf('.');
    if (i === -1) return filename;
    else return filename.substr(0, i);
  };

  var create_pdf_files = function() {
    /* create pdf files acording to options */

    var dir = folder + '/tmp',
        filenames = get_filenames(dir);

    var pdf, outfilename, pageSize;

    pageSize = options.pageSize;
    // TODO: check in better way than filenames.length
    if (filenames.length > 3 && options.merge === false) { // Convert files to pdf zip them and return

      // Create pdf files
      for(var i = 0; i < filenames.length; i++) {
        //console.log("appending pdf:", filenames[i]);

        outfilename = filenames[i].substring(2,filenames[i].length);
        pdf = new PDF(folder+'/result/'+outfilename, pageSize);
        pdf.setAppendMatrix(options.matrix);
        pdf.appendPages(dir+'/'+filenames[i]);
        pdf.end();
      }

      // Zip folder
      outfilename = 'converted_files.zip';

      var zip = new EasyZip(); // TODO: this throws an error, fix it!
      zip.zipFolder(folder+'/result', function() {
        zip.writeToFileSync(folder+'/result/'+outfilename);
      });

      // Return callback
      /*
      process.nextTick(function() {
        ret(folder + '/result', false);
      });
      //return folder + '/result';
       */
    } else {

      outfilename = options.filename || filenames[0].substring(2,filenames[0].length);

      pdf = new PDF(folder+'/result/'+outfilename, pageSize);
      pdf.setAppendMatrix(options.matrix);

      for(var i = 0; i < filenames.length; i++) {
        //console.log("appending pdf:", filenames[i]);

        pdf.appendPages(dir+'/'+filenames[i]);
      }

      // Test:
      // console.log("appending pdf:", filenames[1]);
      // pdf.appendPages(dir+'/'+filenames[0]);
      // console.log("appending pdf:", filenames[0]);
      // pdf.appendPages(dir+'/'+filenames[0]);

      pdf.end();
      /*
      // Return file
      process.nextTick(function() {
        ret(folder+'/result/'+outfilename, true);
      });
      //return folder+'/result/'+outfilename;
      */
    }

    process.nextTick(function() {
      ret(folder+'/result/'+outfilename);
    });


  };

  var convert_to_pdf_files = function() {

    var filenames = get_filenames(folder);

    /* create tmp and result direcotory to save created pdfs */
    try {
      fs.mkdirSync(folder + '/tmp');
      fs.mkdirSync(folder + '/result');
    } catch(e) {
      if ( e.code != 'EEXIST' ) throw e;
    }

    /* convert files to pdf */
    async.each(filenames,
               function(fname, callback) { // Called on every filename

                 var f = folder+'/' + fname,
                     o = folder+ '/tmp/' + remove_extension(fname) + '.pdf',
                     type = mime.lookup(f);

                 if (type === 'image/jpeg') { // Handle jpeg images
                   jpg2pdf(f, o);
                 } else if (type === 'application/pdf') { // File is already pdf, just move it to tmp
                   try {
                     // mv(f,o, {mkdirp: true}), function(err))
                     cp.sync(f,o);

                   } catch (err) {
                     console.log('converter.js: cp:', err);
                   }
                 } else {
                   // TODO: add other format handling
                 }
                 callback();
               },
               function(err) { //called when everything is finished
                 if (err) console.log('converter.js',err);

                 // 2. Merge pdfs acording to settings
                 create_pdf_files();
               });

  };

  // 1. Converte everything to pdf
  convert_to_pdf_files();

  // 2. Merge pdfs acording to settings
  // ...insite convert_to_pdf_files();

  // 3. Signal that result is ready

};
module.exports = Converter;
/*
 module.exports = function(folder, options, callback) {
 return new Converter(folder, options, callback);
 };
 */
