var Web3 = require('web3')
var qr = require('qr-image')
let base64url = require('base64url')
let fs = require("fs")
var web3 = new Web3()

const COMPRESS = true

var publicAddress = process.argv[2]
let PK = process.argv[3]
let URL = process.argv[4]

let pkLink
if(COMPRESS){
  function pkToUrl(pk) {
    return base64url(web3.utils.hexToBytes(pk))
  }
  let encoded = pkToUrl(PK)
  pkLink = URL+"/pk#"+encoded
}else{
  pkLink = URL+"/pk#"+PK.replace("0x","")
}
//console.log(pkLink)
var private = qr.image(pkLink, { type: 'png' });
private.pipe(require('fs').createWriteStream('private.png'));

var public = qr.image(URL+"/"+publicAddress, { type: 'svg' });
public.pipe(require('fs').createWriteStream('public.svg'));

console.log(publicAddress)

fs.readFile("template.html", 'utf8', (err,data) => {
  if (err) {
    return console.log(err);
  }
  var result = data.replace(/\*\*PUBLIC\*\*/g,publicAddress.substring(0,9)+"......"+publicAddress.substring(publicAddress.length-8));
  result = result.replace(/\*\*URL\*\*/g,URL);
  result = result.replace(/"\.\//g, "\"file://"+__dirname+"/");

  console.log(result)

  fs.writeFile("generated.html", result, 'utf8', function (err) {
     if (err) return console.log(err);

     fs.appendFile('addresses.txt',publicAddress+"\n", function (err) {
       if (err) throw err;
     });

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
                top: "0.33in",
                left: "0in",
                right:"0.19in"
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
