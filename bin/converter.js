/*
 * @params: folder: folder which contains files to bo converted
 *        resultDir: unique directory where result file will be put
 *        options: json object with options
 *        ret: callback(err, resultDir)
 */

var Converter = function(id, uploadDir, resultDir, options, callback) {


  var fs = require('fs'),
      async = require('async'),
      mime = require('mime'),
      mv = require('mv'),
      cp = require('cp'),
      EasyZip = require('easy-zip'),
      jpg2pdf = require('./jpg2pdf.js'),
      PDF = require('./mergePDFfiles.js');

  var folder = uploadDir + '/' + id;


  var get_filenames = function(f) {
    var fn;
    try {
      fn = fs.readdirSync(f);
    } catch (err) {
      console.error('ERROR Coverter:', err);

      // This error is critical, fail convertionb
      /*
      process.nextTick(function() {
        callback('Error reading filenames from folder: ' +f, null);
      });
      */
      return [];

    }
    return fn;
  };


  var remove_extension = function(filename) {
    var i = filename.lastIndexOf('.');
    if (i === -1) return filename;
    else return filename.substr(0, i);
  };


  var create_pdf_files = function() {

    /* merge pdf files acording to options */
    var dir = folder + '/tmp',
        filenames = get_filenames(dir);

    var pdf, outfilename, pageSize;

    pageSize = options.pageSize;
    // TODO: check in better way than filenames.length
    if (false && filenames.length > 3 && options.merge === false) { // Convert files to pdf zip them and return
      // At the moment disabled, there is problem whith ziping files

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

    } else {

      outfilename = options.filename || filenames[0].substring(2,filenames[0].length);

      pdf = new PDF(resultDir + '/' + id + '/' + outfilename, pageSize);
      pdf.setAppendMatrix(options.matrix);

      for(var i = 0; i < filenames.length; i++) {
        //console.log("appending pdf:", filenames[i]);
        pdf.appendPages(dir+'/'+filenames[i]);
      }

      pdf.end();

    }

    process.nextTick(function() {
      callback(null, resultDir + '/' + id + '/' + outfilename);
    });


  };


  var convert_to_pdf_files = function() {

    var filenames = get_filenames(folder);

    /* create tmp and result direcotory to save created pdfs */
    try {
      fs.mkdirSync(folder + '/tmp');
      fs.mkdirSync(resultDir + '/' + id);
    } catch(e) {

      if ( e.code != 'EEXIST' ) {
        throw e;
      } else {
        process.nextTick(function() {
          callback('Error creating tmp and/or reslut folder (id): ' + id, null);
        });
      }

    }

    /* convert files to pdf */
    async.each(filenames,
               function(fname, cb) { // Called on every filename

                 var f = folder+'/' + fname,
                     o = folder+ '/tmp/' + remove_extension(fname) + '.pdf',
                     type = mime.lookup(f);

                 if (type === 'image/jpeg') { // Handle jpeg images
                   jpg2pdf(f, o); // TODO: Implement error checking
                 } else if (type === 'application/pdf') { // File is already pdf, just move it to tmp
                   try {
                     // mv(f,o, {mkdirp: true}), function(err))
                     cp.sync(f,o);

                   } catch (err) {
                     console.log('converter.js: cp:', err);
                     process.nextTick(function() {
                       callback('Error creating tmp and/or reslut folder (id): ' + id, null);
                     });
                   }
                 } else {
                   // TODO: add other format handling

                 }
                 cb();
               },
               function(err) { // Called when everything is finished
                 if (err) {
                   console.error('converter.js',err);
                   process.nextTick(function() {
                     callback('Error moving converted file: ' + f +' | '+o, null);
                   });

                 }

                 // 2. Merge pdfs acording to settings
                 create_pdf_files();
               });

  };


  // 1. Converte everything to pdf
  convert_to_pdf_files();

  // 2. Merge pdfs acording to settings
  // ...inside convert_to_pdf_files();

  // 3. Signal that result is ready
  // ...inside create_pdf_files();

};
module.exports = Converter;
