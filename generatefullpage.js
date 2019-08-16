var qr = require('qr-image')
var fs = require('fs')

console.log("GENERATE ",process.argv[2],process.argv[3])

generate(process.argv[2],process.argv[3])


function generate(publicAddress,filename){


  const URL = "https://radwallet.io"
  const AMOUNT = 1
  const THING = "meal"
  const TITLE = "Ethereal"


  //https://xdai.io/0x73b13a4a3c38966af10b6b41c3e3de484e068165;11111;THING:TITLE
  var public = qr.image(URL+"/"+publicAddress+";"+AMOUNT+";"+THING+";"+TITLE, { type: 'svg' });
  public.pipe(require('fs').createWriteStream('public.svg'));

  fs.readFile("fullpagepublickey.html", 'utf8', (err,data) => {
    if (err) {
      return console.log(err);
    }
    var result = data.replace(/\*\*PUBLIC\*\*/g, publicAddress.substring(0,8)+"......"+publicAddress.substring(publicAddress.length-7));

    fs.writeFile("fullpagegenerated.html", result, 'utf8', function (err) {
       if (err) return console.log(err);

       var html = fs.readFileSync('./fullpagegenerated.html', 'utf8');
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
         var output = fs.createWriteStream(filename)
         pdf.stream.pipe(output);
         conversion.kill();
       });
    });
  });

}
