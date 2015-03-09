// DOM Ready =============================================================

$(document).ready(function() {


  window.name = uuid.v1() + '/0';

  // workarount for ie8
  if (!Date.now) {
      Date.now = function() { return new Date().getTime(); };
  }

});

// State variables =======================================================
var start_convert = false,
    uploading_finished = true;

// Functions =============================================================

/* settings buttons handlers */
function filename_hand() {
  var check = $("#merge").prop("checked");
  $("#filename").prop("disabled", !check );

};


/* ************************** */


function convert() {

  var options = create_options('merge','pageSize','margins','optionsm', 'filename');

  // send filename and convert data to browser

  $.ajax({
    url: '/convert/'+window.name.split('/')[0]+'/'+JSON.stringify(options), //+'/'+JSON.stringify(filesorder),
    type: 'GET',
    success: function(result) {
      console.log(result);
      if (result === "false") {
        // create error handling site
        console.log("error converting document");
      } else {
        document.location.assign(result);
      }
    }
    });


   // document.location.assign('/convert/'+window.name.split('/')[0]+'/' +JSON.stringify(options));

}

function startDownload(url) {
  //$("#dframe").prop("src", url);
  //window.location = url

}

function begin_converting() {

  /* disable everything on screen */
  $('body').toggleClass('cover');



  if (uploading_finished) {
    convert();
  } else {
    start_convert = true;
  }

}

var num = 1;
Dropzone.options.myDropzone = {

  autoProcessQueue: true,
  forceFallback: false,
  addRemoveLinks: false, //TODO: at the moment it does not work, delete links on client are wrong
  createImageThumbnails: false,
  url: function(file) {
    var param =  window.name.split('/');
    var num = parseInt(param[1]) + 1;
    window.name = param[0] + '/' + num;
    return '/upload/' + window.name;
  },

  init: function() { //hook into the init() to conigure and register Dropzone


    var self = this;

    // config

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


    /* BIND EVENTS */

    /* called when all files are finished uploading */ //true??
    self.on('queuecomplete', function() {
      uploading_finished = true;
      if (start_convert) {
        convert();
      }

      //window.location.replace(); //todo!
    });


    /*
      $.ajax({
        url: '/convert/' + window.name, //add filename parameter,
        type: 'GET',
        success: function(result) {
          console.log(result);
        }
     */


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
      //$('<a href="uploaded/files/os_zaklad.txt" download="important.txt"></a>').click();

    });


    // On removig file
    self.on('removedfile', function (file) {

      $.ajax({
        url: '/uploaded/files/' + window.name.split('/')[0] + '/' + file.name,
        type: 'DELETE',
        success: function(result) {
          console.log(result);
        }
      });
     });


  }
};
