$(document).ready(function() {

  // Init
  window.name = uuid.v1() + '/0';

  // workarount for ie8
  if (!Date.now) {
    Date.now = function() { return new Date().getTime(); };
  }




});

var options;

/* Button id's */
var pageWidth = "pageWidth",
    pageHeight = "pageHeight",
    customRadio = "custom",
    margins = "margins",
    pageLayout = "pageLayout",
    numOfPages = "numOfPages",
    rows = "rows",
    columns = "columns";



/* State variables */
var start_convert = false,
    uploading_finished = true,
    num = 1, // Tracks how many files were uploaded
    defaultFilename;


function pageRepresentation_hand() {
  console.log("pageRrepresentation_hand() called");
  options.redrawPageRepresentation();

};


function customPageSizeHandler(e) {
  $('#'+customRadio).prop('checked', true);

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

  // Set max margin, as smaller page dimension/2
  $(margins).attr('max', Number((h.val() > w.val()) ? w.val()/2:h.val()/2));

};


function getPageSetup(id, pagesN) {
  // find id of selected radio button
  // var id = $('input[name="'+pageLayout+'"]:checked').attr('id');
  // var pagesN = Number($('#'+numOfPages).val());

  // var cols = Number($('#'+columns).val()),
  //     rows = Number($('#'+rows).val());

  var pageRep = [];

  var n = 0;
  if (id === 'Layout1') {
    for(var i = 0; i < pagesN; i++)
      pageRep[i] = [i];
  }
  else if (id === 'Layout2') {
    for(var i = 0; i < pagesN; i++)
      pageRep[i] = [i, -1, -1];
  }
  else if (id === 'Layout3') {
    for(var i = 0; i < pagesN; i++)
      pageRep[i] = [-1, -1, i];
  }
  else if (id === 'Layout4') {
    pageRep[0] = [];
    pageRep[1] = [];
    pageRep[2] = [];

    for(var i = 0; i < pagesN; i++) {
      pageRep[0][i] = i;
      pageRep[1][i] = -1;
      pageRep[2][i] = -1;
    }
  }
  else if (id === 'Layout5') {
    pageRep[0] = [];
    pageRep[1] = [];
    pageRep[2] = [];

    for(var i = 0; i < pagesN; i++) {
      pageRep[0][i] = -1;
      pageRep[1][i] = -1;
      pageRep[2][i] = i;
    }
  }
  else {
    for (var i = 0; i < pagesN; i+=2) { //
      pageRep[i] = [i, i+1];
    }
  }

  return pageRep;
};


var createMatrix = function(pageSetup, pageSize, margin) {

  var cols = pageSetup[0].length,
      rows = pageSetup.length,
      pos, x, y;

  var w = (pageSize.width - (cols+1)*margin) / cols,
      h = (pageSize.height - (rows+1)*margin) / rows,
      mPageSize = {width:w, height:h};

  var matrix = [], mPage;

  for (var c = 0; c < cols; c++) {
    for (var r = 0; r < rows; r++) {

      pos = pageSetup[r][c];

      // Calcualtes page positions (base is bottom left corner)
      x = margin + c * margin + c * mPageSize.width;
      y = margin + (rows-1-r) * margin + (rows-1-r) * mPageSize.height;

      mPage = {x:x, y:y, width:mPageSize.width, height:mPageSize.height};

      if (pos < 0) {
        // Handle special pages (-1, -2, ...)
        if (matrix[pos] === undefined) matrix[pos] = [];
        matrix[pos].push(mPage);

      } else {
        // Write dimensions/position for normal pages
        matrix[pos] = mPage;
      }
    }
  }

  return matrix;
};


function createOptions() {

  var mmTopx = function(mm) {
    return 0.0393700787 * mm * 72;
  };


  var id = $('input[name="'+pageLayout+'"]:checked').attr('id'),
      pagesN = Number($('#'+numOfPages).val()),
      width = Number($('#'+pageWidth).val()),
      height = Number($('#'+pageHeight).val()),
      margin_mm = Number($('#'+margins).val());

  // convert mm to px
  var pageSize = {width: mmTopx(width), height: mmTopx(height)},
      margin = mmTopx(margin_mm);


  var pageSetup = getPageSetup(id, pagesN);
  var matrix = createMatrix(pageSetup, pageSize, margin);

  var options = {
    merge:true,
    filename: defaultFilename + '.pdf'  || '',
    pageSize:pageSize,
    margin:margin,
    matrix:matrix
  };

  return options;

};


function convert() {

  var options = createOptions();

  // send filename and convert data to server
  $.ajax({
    url: '/convert/'+window.name.split('/')[0]+'/'+JSON.stringify(options),
    type: 'GET',
    success: function(result) {

      console.log('convert request result:',result);
      if (result === "false") {
        // Handle convertion error
        document.location.assign('/convertingerror');
      } else {
        document.location.assign(result);
      }

    }
  });

};


// Called by convert button
function begin_converting() {

  if (uploading_finished) {
    convert();
  } else {
    start_convert = true;
  }

  return false;

}


Dropzone.options.myDropzone = {

  autoProcessQueue: true,
  forceFallback: false,
  addRemoveLinks: false, //TODO: at the moment it does not work, delete links on client are wrong
  createImageThumbnails: false,
  maxFiles: 30,
  maxFileSize: 19,
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
