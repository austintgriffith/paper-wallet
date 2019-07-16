
const util = require('util');
const exec = util.promisify(require('child_process').exec);
var merge = require('easy-pdf-merge');
var fs = require('fs')

const HOWMANY = 3



async function generate() {

  let sources = []

  for(let count=1;count<=HOWMANY;count++){
    const { stdout, stderr } = await exec('node index.js');
    if (stderr) {
      console.error(`error: ${stderr}`);
    }
    let name = stdout.substring(2,10)
    console.log("Generated: "+name);
    await exec('mv generated.pdf '+name+'.pdf');
    sources[count-1] = (""+name+".pdf")
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
generate()
