var Web3 = require('web3')
var qr = require('qr-image')
let base64url = require('base64url')

const URL = "https://burnerwallet.io"
const COMPRESS = true
const AUTOPRINT = false
const MINEFOR = false//"feeddeadbeef"
var web3 = new Web3()

let result = ""
if(MINEFOR){
  while(!result.address || result.address.toLowerCase().indexOf("0x"+MINEFOR)!==0){
    result = web3.eth.accounts.create();
    //console.log(result.address)
  }
}else{
  result = web3.eth.accounts.create();
}



let PK = result.privateKey
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

var private = qr.image(pkLink, { type: 'svg' });
private.pipe(require('fs').createWriteStream('private.svg'));


var publicAddress = result.address

var public = qr.image(URL+"/"+publicAddress, { type: 'svg' });
public.pipe(require('fs').createWriteStream('public.svg'));
//console.log("public.svg"+URL+"/"+publicAddress)

console.log(publicAddress)
var fs = require('fs')
fs.readFile("template.html", 'utf8', (err,data) => {
  if (err) {
    return console.log(err);
  }
  var result = data.replace(/\*\*PUBLIC\*\*/g, publicAddress);

  fs.writeFile("generated.html", result, 'utf8', function (err) {
     if (err) return console.log(err);

     fs.appendFile('addresses.txt',publicAddress+"\n", function (err) {
       if (err) throw err;
     });

      /*var html = fs.readFileSync('./generated.html', 'utf8');
      var conversion = require("phantom-html-to-pdf")();
      console.log(html)
      conversion({
        html: html,
        phantomPath: require("phantomjs-prebuilt").path,
        settings: {
             javascriptEnabled : true,
             resourceTimeout: 10000
         },
      }, function(err, pdf) {
      var output = fs.createWriteStream('./generated.pdf')
      console.log(pdf.logs);
      console.log(pdf.numberOfPages);
        // since pdf.stream is a node.js stream you can use it
        // to save the pdf to a file (like in this example) or to
        // respond an http request.
      pdf.stream.pipe(output);
    });*/
  });
});
