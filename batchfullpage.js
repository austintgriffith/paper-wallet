const util = require('util');
const exec = util.promisify(require('child_process').exec);
var merge = require('easy-pdf-merge');
var fs = require('fs')


async function generate() {
  var sources = []
  let addressesFromFile = fs.readFileSync("addresses.txt")
  let addresses = addressesFromFile.toString().split("\n")
  for(let a in addresses){
    if(addresses[a]){
      let filename = 'fullpagegenerated_'+addresses[a]+'.pdf'
      console.log("Generating for ",addresses[a])
      const { stdout, stderr } = await exec('node generatefullpage.js '+addresses[a]+' '+filename);
      if (stderr) {
        console.error(`error: ${stderr}`);
      }
      sources[a] = './'+filename
    }
  }

  merge(sources,"fullpagerequests.pdf",function(err){
    if(err)
    return console.log(err);
    console.log('Success');
    var i = sources.length;
    sources.forEach(function(filepath){
      console.log("Cleaning up "+filepath)
      fs.unlinkSync(filepath);
    });
  });

}
generate()
