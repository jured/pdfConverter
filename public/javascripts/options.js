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
 * @param: - pageSetup: 2d array with locations of pages [[1,2], [3, -1]] (must be valid)
 *         - pageSize: object {width:_, height:_} size of new page in result pdf
 *         - margin: space between insertedPages and borders
 * @return: array - 'normal' pages are located from 0..n,
 *                - 'special' pages are located in arrays on indexes < 0 (-1...-n)
 *                   - -1: blank page (implemented), -2... (not implemented
 */
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


/**
 * Creates page layout represetntation inside div
 * @param: - divID: id of div that layout representation will be attached to
 *         - matrix: matrix that tells us where inserted pages are on new page
 *         - pageSize: object {width:_, height:_} size of new page in result pdf
 *         - onScreenHeight: max height of displayed page layout on web page (in px)
 *         - pageClicked: event handler attaached to small pages on displayed page layout
 */
var matrixToPage = function(divID, matrix, pageSize, onScreenHeight, pageClicked) {

  var k = onScreenHeight/pageSize.height;

  var holder = $('<div></div>');
  holder.css("position", "center");
  holder.css("margin", "0 auto");
  holder.css("width", pageSize.width * k);
  holder.css("height", onScreenHeight);
  //holder.css("background-color", "green");

  var table = $('<div></div>');
  table.css("position", "relative");
  table.css("text-align", "center");
  table.css("width", pageSize.width * k);
  table.css("height", pageSize.height * k);
  table.attr("class", "mPageTable");
  //table.css("background-color", "red");

  function addmPage(styleclass, m, pSize, color) {

    var p, x, y, width, height;
    p = $('<div></div>');
    x = (m.x * k);
    y = ((pSize.height - m.y - m.height) * k);
    width = (m.width * k);
    height = (m.height * k);

    // Set position
    p.css("position", "absolute");
    p.css("margin", "0 auto");
    p.css("top", y + 'px');
    p.css("left", x + 'px');
    p.css("width", width +'px');
    p.css("height", height + 'px');
    if (color) p.css("background-color", color);

    // Add event listener, id
    p.bind("click", pageClicked || function(e) {console.log("clicked page", i)});
    p.attr("class", styleclass);

    table.append(p);

  }

  // Create small pages
  for (var n in matrix) {
    if (n >= 0) {
      addmPage('normal' + 'mPage', matrix[n], pageSize);
    } else {
      for (var m in matrix[n]) {
        // change blank to lines ...
        addmPage('blank' + 'mPage', matrix[n][m], pageSize);
      }
    }

  }

  holder.append(table);
  $('#'+divID).append(holder);
};
