const { generateWallet, generateStickers } = require('./helpers');
const util = require('util');
const asyncStickers = util.promisify(generateStickers);
var merge = require('easy-pdf-merge');
var fs = require('fs');

const HOWMANY = 100;
const PATH = 'wallets';
const BATCH = 'extra';
const workDir = process.cwd();
const perPage = 12;

async function generate() {
    let accounts = [];
    let sources = [];
    const pages = Math.ceil(HOWMANY / perPage);

    for (let i = 0; i < HOWMANY; i++) {
        accounts.push(generateWallet(`./${PATH}`,BATCH));
    }
    let pageAccounts;
    let name;
    console.log('--------------');
    console.log(accounts);
    for (let i = 0; i < pages; i++) {
        pageAccounts = accounts.slice(i * perPage, (i + 1) * perPage);
        console.log('--------------');
        console.log(pageAccounts);
        name = `Batch-${BATCH}_${pageAccounts[0].substring(0,8)}`;
        await asyncStickers(pageAccounts, workDir + '/' + PATH, name, perPage);
        console.log("Generated: " + name);
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
