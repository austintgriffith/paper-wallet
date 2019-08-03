const util = require('util');
const exec = util.promisify(require('child_process').exec);
var merge = require('easy-pdf-merge');
var fs = require('fs')
let sources = []

const URL = "https://daog.io"

async function generate(accounts){
  let account
  for(let a in accounts){
    account = accounts[a]
    const { stdout, stderr } = await exec('node create.js '+account.address+" "+account.pk+" "+URL);
    if (stderr) {
      console.error(`error: ${stderr}`);
    }
    let name = account.address
    console.log("Generated: "+name);
    await exec('mv generated.pdf '+name+'.pdf');
    sources[a] = (""+name+".pdf")
  }
  merge(sources,"wallets.pdf",function(err){
          if(err)
          return console.log(err);
          console.log('Success');
          var i = sources.length;
          sources.forEach(function(filepath){
            console.log("Cleaning up "+filepath)
            try{
              if(fs.existsSync(filepath)){
                fs.unlinkSync(filepath);
              }
            }catch(e){console.log(e)}
          });
  });
}

let accounts = JSON.parse(fs.readFileSync("./accounts.json").toString())
generate(accounts);
