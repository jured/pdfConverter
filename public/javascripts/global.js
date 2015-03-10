$(document).ready(function() {


  window.name = uuid.v1() + '/0';

  // workarount for ie8
  if (!Date.now) {
      Date.now = function() { return new Date().getTime(); };
  }

});


/* State variables */
var start_convert = false,
    uploading_finished = true,
    num = 1; // Tracks how many files were uploaded


function filename_hand() {
  var check = $("#merge").prop("checked");
  $("#filename").prop("disabled", !check );

};


function convert() {

  var options = create_options('merge','pageSize','margins','optionsm', 'filename');

  // send filename and convert data to server
  $.ajax({
    url: '/convert/'+window.name.split('/')[0]+'/'+JSON.stringify(options),
    type: 'GET',
    success: function(result) {

      console.log(result);
      if (result === "false") {
        // Handle convertion error
      } else {
        document.location.assign(result);
        // Handle download error
      }

    }
  });

}


// Called by convert button
function begin_converting() {

  if (uploading_finished) {
    convert();
  } else {
    start_convert = true;
  }

}


Dropzone.options.myDropzone = {

  autoProcessQueue: true,
  forceFallback: false,
  addRemoveLinks: false, //TODO: at the moment it does not work, delete links on client are wrong
  createImageThumbnails: false,
  maxFileSize: 100,
  accept: function(file, done) {
    var acceptedFiletypes = ["image/jpeg", "application/pdf"];
    if ($.inArray(file.type, acceptedFiletypes) != -1) {
      done();
    } else {
      done(file.type + " file type is not supported");
    }
  },
  url: function(file) {
    var param =  window.name.split('/');
    var num = parseInt(param[1]) + 1;
    window.name = param[0] + '/' + num;
    return '/upload/' + window.name;
  },
  init: function() {

    var self = this;

    /*
    //enable delete and set the text
    self.options.dictRemoveFile = "Delete";

    // load already saved files
    // TODO: fix it with id...
    $.get('/upload', function(data) {
      var files = JSON.parse(data).files;
      for (var i = 0; i < files.length; i++) {

        var mockFile = {
          name: files[i].name,
          size: files[i].size,
          type: 'image/jpeg'
        };

        // self.option.addedfile.call(self, mockFile);
        // self.option.thumbnail.call(self, mockFile, files[i].url);
      };

    });
    */


    /* BIND DROPZONE EVENTS */

    /* called when all files are finished uploading */ //true??
    self.on('queuecomplete', function() {
      uploading_finished = true;
      if (start_convert) {
        convert();
      }
    });

    self.on('addedfile', function(file) {
      console.log(file);
      uploading_finished = false;
    });

    // Send file starts
    self.on('sending', function (file) {
      $('.meter').show();
    });

    // File upload progress
    self.on('totalupoladprogress', function(progress) {
      $('.meter').delay(999).slideUp(999);
    });

    self.on('queuecomplete', function() {
      console.log("uploading is complete, get result");
    });

    // On removig file
    /* at the moment disabled/not implemented
    self.on('removedfile', function (file) {

      $.ajax({
        url: '/uploaded/files/' + window.name.split('/')[0] + '/' + file.name,
        type: 'DELETE',
        success: function(result) {
          console.log(result);
        }
      });
     });
     */

  }
};
