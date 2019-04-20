const { generateWallet, generateStickers } = require('./helpers');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const asyncStickers = util.promisify(generateStickers);
var merge = require('easy-pdf-merge');
var fs = require('fs');

const HOWMANY = 35;
const PATH = 'wallets';
const BATCH = '0';
const workDir = process.cwd();

async function generate() {
    let accounts = [];
    let sources = [];
    const pages = Math.ceil(HOWMANY / 15);

    for (let i = 0; i < HOWMANY; i++) {
        accounts.push(generateWallet());
    }
    let pageAccounts;
    let name;
    console.log('--------------');
    console.log(accounts);
    for (let i = 0; i < pages; i++) {
        pageAccounts = accounts.slice(i * 15, (i + 1) * 15);
        console.log('--------------');
        console.log(pageAccounts);
        name = `Batch-${BATCH}_${pageAccounts[0].substring(0,8)}`;
        await asyncStickers(pageAccounts, workDir + '/' + PATH, name);
        console.log("Generated: " + name);
        //await exec('mv ' + workDir + '/generated.pdf '+ workDir + '/' + PATH + '/' + name + '.pdf');
        sources[i] = (""+PATH+"/"+name+".pdf");
    }

    while(!fs.existsSync(sources[pages-1])) {
        //console.log('.');
    }

    merge(sources,PATH + "/wallets-" + BATCH + ".pdf",function(err){
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

generate();
