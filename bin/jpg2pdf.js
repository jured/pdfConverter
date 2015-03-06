///////////////////////////////////////////////////////////////////////////////////
// @Author: Jure Debeljak 22.2.2015                                              //
// @Description: arg1: input .jpg filename, arg2: output .pdf filename or stream //
// it takes input jpg and converts it to pdf, with page size of image.           //
///////////////////////////////////////////////////////////////////////////////////

var hummus = require('hummus');
var stream = require('stream');

var isWritableStream = function(obj)
{
  return obj instanceof stream.Stream &&
    typeof (obj._write === 'function') &&
    typeof (obj._writableState === 'object');

}

var jpg2pdf = function(infile, pdfstream)
{

  //test
  //instream = './test1.jpg';
  //pdfstream = './test1_out.pdf';


  var pdfWriter, formXObject, jpgDimensions, page, cxt;

  if (isWritableStream(pdfstream)) {
    pdfWriter = hummus.createWriter(new hummus.PDFStreamForResponse(pdfstream));
    //console.log("jpg2pdf: output is stream");
  } else {
    pdfWriter = hummus.createWriter(pdfstream);
    //console.log("jpg2pdf: output is file");
  }



  /* create formXObject from our jpg */
  //if we would want custom image size create imageXobject
  formXObject = pdfWriter.createFormXObjectFromJPG(infile);
  jpgDimensions = pdfWriter.getImageDimensions(infile);

  /* create page and context*/
  page = pdfWriter.createPage(0,0,jpgDimensions.width,jpgDimensions.height);
  cxt = pdfWriter.startPageContentContext(page);

  /* add image to page */
  cxt.q()
    .cm(1,0,0,1,0,0) //.cm(1,0,0,1,0,400)
    .doXObject(formXObject)
    .Q();

  pdfWriter.writePage(page);
  pdfWriter.end();

  //console.log('jpg2pdf:', 'output is written', pdfstream);

};
module.exports = jpg2pdf;
