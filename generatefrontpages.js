var Web3 = require('web3')
var qr = require('qr-image')
let base64url = require('base64url')
var fs = require('fs')

const URL = "https://xdai.io"
const COMPRESS = true
const AUTOPRINT = false
const MINEFOR = false//"feeddeadbeef"
var web3 = new Web3()


  fs.readFile("templatefront.html", 'utf8', (err,data) => {
    if (err) {
      return console.log(err);
    }
    //var result = data.replace(/\*\*PUBLIC\*\*/g, publicAddress.substring(0,8)+"......"+publicAddress.substring(publicAddress.length-7));

    fs.writeFile("generated.html", data, 'utf8', function (err) {
       if (err) return console.log(err);

       var html = fs.readFileSync('./generated.html', 'utf8');
       var conversion = require("phantom-html-to-pdf")();
       console.log("Generating PDF...")
       conversion({
         html: html,
         allowLocalFilesAccess: true,
         phantomPath: require("phantomjs-prebuilt").path,
         settings: {
              javascriptEnabled : true,
              resourceTimeout: 10000
          },
          paperSize: {
              format: 'A4',
              orientation: 'portrait',
              margin: {
                  top: "0in",
                  left: "0in",
                  right:"0in"
              }
          }
       }, function(err, pdf) {
       var output = fs.createWriteStream('./generated.pdf')
       //console.log(pdf.logs);
       //console.log(pdf.numberOfPages);
         // since pdf.stream is a node.js stream you can use it
         // to save the pdf to a file (like in this example) or to
         // respond an http request.
       pdf.stream.pipe(output);
       conversion.kill();
       });



    });
  });
