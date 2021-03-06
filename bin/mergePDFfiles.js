///////////////////////////////////////////////////////////////////////////////////
// @Author: Jure Debeljak 23.2.2015   @v0.0.2                                    //
///////////////////////////////////////////////////////////////////////////////////
/* Usage: create new object, give construcotr location(outfile, with name) where to save,
 * optional dimensions of output pdf page (default is a4)
 * also call method .setAppendMatrix(matrix) to specify
 * how to add pages on a page (default is one page per page, no margins)
 */

/* changelog:
 * v0.0.2: -4.3.2015
 *         -added half of picture scaling handling
 *         -added callback
 *         -fixed " " when calling pdfinfo
 *         -fixed error when writing to page when ending pdf
 */

/* TODO: - check for wrong inputs, errors.
 *       - if inserted page is smaller than is place on new page,
 *         put it in the center
 *         note: it works if inserted page is to big, what if it is too small - add
 *
 */

/* BUGS: - duplicated images
 *             note: i thik it is fixed, still neds some testing
 *       - some pdfs are not read - they are encryped
 *             solution: first print them to pdf with open office - will fix at later timer
 *             note: it would be nicer if i do this before calling mergePDFs
 *       - duplicated file writed
 */

/* v0.0.0 : 2015. 2. 23.
 *
 *
 */

/**
 * @param: location:
 *         dimensions: string('a4') or {height:_, width:_} in px
 *         callback:
 */


var PDF = function(location, dimensions, callback)
{

    var hummus = require('hummus'),
    stream = require('stream'),
    exec = require('child_process').execSync;
    //exec = require('exec-sync');

    //preset page sizes
    var a4 = {'width' : 595, 'heigh': 842};


    var pdfWriter, matrix, matrix_i, pageSize, page, cxt, pageWritten;

    //pageSize = [width :  , height :]
    //matrix_i holds the index of current place in matrix


    /*
      matrix = [
      [x:_, y:_, width:_, height:_],
      [x:_, y:_, width:_, height:_],
      ....
      ];

    */
    this.setAppendMatrix = function(mat) {
	matrix = mat;
	matrix_i = 0;
    };


    var init = function() {

	//console.log(location);
	/* set output location */
	if (isWritableStream(location)) {
	    pdfWriter = hummus.createWriter(
		new hummus.LocationForResponse(location));
	} else {
	    pdfWriter = hummus.createWriter(location);
	}

	/* set new pdf pages dimensions */
	if (dimensions === 'a4')
	    pageSize = a4;
	else {
	    pageSize = {width:dimensions.width, height:dimensions.height};
	}


	/* set default matrix */
	//setAppendMatrix({x:0, y:0, width:pageSize.width, height:pageSize.heigh});
	matrix = [];
	matrix[0] = {x:0, y:0, width:pageSize.width, height:pageSize.heigh};
	matrix_i = 0;
    };



    var isWritableStream = function(obj) {

	return obj instanceof stream.Stream &&
	    typeof (obj._write === 'function') &&
	    typeof (obj._writableState === 'object');

    };


    /*
    //places passed xobject on page
    var appendXObject = function(id) { //not used anymore

    //TODO: add scaling

    //create page, later this is only if needed
    var page = pdfWriter.createPage(0,0,pageSize.width, pageSize.height);

    //add xobject on page
    pdfWriter.startPageContentContext(page).q()
    .w(20)
    .cm(150,0,0,150,100,100) //resize and move around image here
    .doXObject(page.getResourcesDictionary().addFormXObjectMapping(id))
    .Q();

    //add page to pdf
    pdfWriter.writePage(page);


    };

    this.appendPages_old = function(pages) { //not used anymore
    var formIDs = pdfWriter.createFormXObjectsFromPDF(pages);

    for (var i = 0; i < formIDs.length; i++) {
    appendXObject(formIDs[i]);
    }

    };
    */


    this.appendPages = function(file, callb) {

	console.log("PDF: working on:" , file);

	//this will insert inpage on right positon on page,
	//it needs matrix.

	var insertPage = function() {
	    /* this function inserts index-th page on its right place
	     * on new page, it also takes care of creating new pages
	     * and placing inserted page.
	     */

	    /* prepare new page if needed */

	    //matrix defines how page is "set up"
	    //if one page is "full" create new page
	    if (matrix_i === 0) {
		matrix_i = 0;
		page = pdfWriter.createPage(0,0,pageSize.width, pageSize.height);
		cxt = pdfWriter.startPageContentContext(page);
		pageWritten = false;
	    }



	    /* add xobject on page */

	    //pdfWriter.pausePageContentContext(cxt); // not sure if needed

	    //TODO - work in progres:
	    //if inpage is smaller than its place on new page,
	    //position it in the middle of its place, otherwise it will be scaled

	    //add which page to look from index...

	    // get inpage.pdf dimensions
	    var mPageSize;

	    /*
	      exec(command, function (err, stdout, stderr) {

              if (err) console.error('mergePDFfiles.js:', err);
              if (stderr) console.error('mergePDFfiles.js:', stderr);
              if (stdout) {

              var buf = stdout.match(/[0-9.]+ ?x ?[0-9.]+/g)[0].replace(/\s+/g, '').split('x');

              mPageSize = {};
              mPageSize.height = parseFloat(buf[1]);
              mPageSize.width = parseFloat(buf[0]);;

              if (typeof mPageSize.height !== 'number' || typeof mPageSize.width !== 'number') {
              mPageSize = undefined;
              console.log("here");
              }
              }

	      });
	    */


	    /* get inserted pdf page dimensions */
	    /* old uses exec-sync, for some reason it does not work in node0.12
	       var command = " pdfinfo -f "+index+" -l "+index+" \"" +file+"\"";
	       console.log("PDF: exec() args:", index, file, command);
	       var stdout;
	       try {
               //stdout = exec(command); //add error handling
	       } catch (err) {
               console.log('PDF exec error:', err);
	       }
	    */
	    var stdout;
	    try {
		stdout = exec("pdfinfo -f "+index+" -l "+index+" \"" +file+"\"", {encoding:'utf-8'});
		//console.log(stdout);
	    } catch (err) {
		console.log('PDF exec error:', err);
	    }

	    if(stdout) {
		var buf = stdout.match(/[0-9.]+ ?x ?[0-9.]+/g)[0].replace(/\s+/g, '').split('x');

		mPageSize = {};
		mPageSize.height = parseFloat(buf[1]);
		mPageSize.width = parseFloat(buf[0]);;

		if (typeof mPageSize.height !== 'number' || typeof mPageSize.width !== 'number') {
		    mPageSize = undefined;
		}

	    }

	    /* prepare trasformation object, it places inpage on page; */
	    /*  and get position of inserted page*/
	    var x = matrix[matrix_i].x,
            y = matrix[matrix_i].y,
            transformation = {
		width : matrix[matrix_i].width,
		height : matrix[matrix_i].height,
		proportional : true,
		fit : "overflow"
            };

	    /* check if x and y pos need to be adjusted beacuse of scaling */
	    //TODO: fix if both are smaller
	    if (mPageSize) {
		var dx = transformation.width - mPageSize.width,
		dy = transformation.height - mPageSize.height;
		if (dx > 0 && dy > 0) { // inserted page w in h is smaller
		    x += dx/2;
		    y += dy/2;
		} else if (dx > 0) { //dx is smaller, dy is bigger - it is scalled
		    //calculate scalled width
		    dx = transformation.width - transformation.height/mPageSize.height * mPageSize.width;
		    x += dx/2;
		} else if (dy > 0) { //dy is smaller, dc is bigger - it is scalled
		    //calculate scalled width
		    dy = transformation.height - transformation.width/mPageSize.width * mPageSize.height;
		    y += dy/2;
		}

		//what happens if both are smaller
		//TODO: add logic !!!


		//console.log(dx,dy);
	    }

	    //console.log("PDF matrix_i:", x, y, transformation);

	    // if there is segmentation fault it is probably there
	    cxt.drawImage(x,y, file, {"index" : index, "transformation" : transformation});

	    //console.log("inserted page at:", x, y, "inserted page num:", index);

	    matrix_i++;


	    /* check if we filled page and write it */
	    if (matrix_i === matrix.length) {

		if (page) {
		    pdfWriter.writePage(page);
		    pageWritten = true;
		}

		matrix_i = 0;
	    }

	    // Optional callback

	};

	var pdfReader, pagesCount, index;

	pdfReader = hummus.createReader(file);

	if(pdfReader.isEncrypted()) {
	    console.error("This pdf file is protected! it cannot be added to pdf", file);
	    return;
	}


	/* add every page to our new pdf */

	pagesCount = pdfReader.getPagesCount();
	for (index = 0; index < pagesCount; index++) {
	    insertPage();
	}

	if(typeof callb === 'function') callb();


    };



    //finish building pdf
    this.end = function() {

	//check if last page needs to be written
	if (pageWritten === false) {
	    pdfWriter.writePage(page);
	}


	//finish creation of pdf

	try {
	    pdfWriter.end();
	} catch (err) {
	    console.log("PDF.end()", err);
	}


	// if callback exsist singal with callback that pdf is written
	if(typeof callback === 'function') callback(location);

    };


    //construcotr of this object
    init();


};

module.exports = PDF;
