$(document).ready(function() {


  window.name = uuid.v1() + '/0';

  // workarount for ie8
  if (!Date.now) {
      Date.now = function() { return new Date().getTime(); };
  }

});

/* Button id's */
var pageResHolder = "#page",
    pageWidth = "#pageWidth",
    pageHeight = "#pageHeight",
    customRadio = "#custom";


/* State variables */
var start_convert = false,
    uploading_finished = true,
    num = 1, // Tracks how many files were uploaded
    defaultFilename;


function pageRepresentation_hand() {
  console.log("pageRrepresentation_hand() called");

  // Save existing repPage


  // Delete existing repPage
  $(pageResHolder).empty();

  // Create new table repPage
  var array = [[0,3,5],
               [1,4,6],
               [2,-1,7]];
  var pageSize = {width:300, height:400};

  var matrix = createMatrix(array, pageSize, 20);
  matrixToPage("page", matrix, pageSize, 300, function(e) {console.log(e);});

};

function customPageSizeHandler(e) {
  $(customRadio).prop('checked', true);

};

function pageSizeHandler(e) {

  /*
  function mmTopx(width, height) {
    return {
      width: 0.0393700787 * width * 1/72,
      height: 0.0393700787 * height * 1/72 //check if it is right
    };
  };


  screenSizes = {
    A3:{width: ,height:}

    }
   */
  var pageSizes = {
    A3: {width:297, height:420},
    A4: {width:210, height:297},
    A5: {width:148, height:210}
  };

  var w = $(pageWidth),
      h = $(pageHeight);

  if (e.value === 'Custom') {

  } else  {
    w.val(pageSizes[e.value].width);
    h.val(pageSizes[e.value].height);
  }

}


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
  maxFiles: 30,
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
      uploading_finished = false;
      if(!defaultFilename) defaultFilename = file.name;
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
