var exec = require('child_process').execSync;
console.log(exec("pdfinfo 1-Photo-0033.pdf", {encoding:'utf-8'}));
