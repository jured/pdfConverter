/**
 * pass in fields from where value of settings will be read
 * and create options object,
 * called before conversion and sent to server
 */
var create_options = function(mergeID, sizeID, marginID, setupID, fnameID) {
  var merge = document.getElementById(mergeID).checked,
      pageSize = document.getElementById(sizeID).value,
      margin = document.getElementById(marginID).value,
      setupm = document.getElementById(setupID).value,
      filename = document.getElementById(fnameID).value;


  /* prepare parameters */

  switch(pageSize) {
  case 'a4':
    pageSize = {width:597, height:842};
    break;
  default:
    // todo: implement other sizes
  }

  // 1px = 1/72 inch
  margin = margin * 0.393700787 * 72;

  setupm = JSON.parse(setupm);
  console.log(setupm);

  /* create options object */
  var options = {
    merge:merge,
    filename:filename,
    pageSize:pageSize,
    margin:margin,
    matrix:createMatrix(setupm, pageSize, margin)
  };

  return options;

};

/**
 * create matirx that mergePDFfiles.js will understand and use to
 * position pages on page
 */
var createMatrix = function(pageSetup, pageSize, margin) {

     // INPUT:
     // 2d matrix, -1:no page, 0...n:page sequence, -2..-n: other modes
     // x,y pos in 2d matrix, position on page
     // example:
     // [
     //  [1,-1]
     //  [2,-1]
     //  [3,-1]
     // ]

     // OUTPUT:
     // margins, pageSize
     // matrix = [
     // [x:_, y:_, width:_, height:_],
     // [x:_, y:_, width:_, height:_],
     // ....
     // ];

  var cols = pageSetup[0].length,
      rows = pageSetup.length,
      pos, x, y;

  var w = (pageSize.width - (cols+1)*margin) / cols,
      h = (pageSize.height - (rows+1)*margin) / rows,
      mPageSize = {width:w, height:h};

  var matrix = [];

  for (var c = 0; c < cols; c++) {
    for (var r = 0; r < rows; r++) {

      pos = pageSetup[r][c];

      // Calcualtes page positions (base is bottom left corner)
      if (pos >= 0) {
        x = margin + c * margin + c * mPageSize.width;
        y = margin + (rows-1-r) * margin + (rows-1-r) * mPageSize.height;
      }

      // Add handling if pos is -2 .... (for special pages)

      matrix[pos] = {x:x, y:y, width:mPageSize.width, height:mPageSize.height};
    }

  }

  return matrix;
};
