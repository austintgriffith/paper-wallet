const JSBI = require('jsbi');
const { Tx, helpers, Output, Outpoint } = require('leap-core');
const Web3 = require('web3');
const qr = require('qr-image');
const base64url = require('base64url');

async function getBalance(address, color, rpc) {
    const response = await rpc.send('plasma_unspent', [address]);
    const balance = response.reduce((sum, unspent) => { 
        return (unspent.output.color === color) ? JSBI.add(sum, JSBI.BigInt(unspent.output.value)) : sum}, JSBI.BigInt(0));

    return balance;
}

async function sendFunds(from, to, amount, color, rpc) {
    const utxos = (await rpc.send("plasma_unspent", [from.address]))
    .map(u => ({
      output: u.output,
      outpoint: Outpoint.fromRaw(u.outpoint),
    }));

    if (utxos.length === 0) {
        throw new Error("No tokens left in the source wallet");
    }

    const inputs = helpers.calcInputs(utxos, from.address, amount, color);

    let outputs = helpers.calcOutputs(utxos, inputs, from.address, to, amount, color);

    const tx = Tx.transfer(inputs, outputs).signAll(from.priv);

    // eslint-disable-next-line no-console
    const txHash = await rpc.send("eth_sendRawTransaction", [tx.hex()]);
    console.log('txHash:', txHash);
}

function generateWallet(path = './wallets', batchName = '0') {
    const URL = "https://sundai.io"
    const COMPRESS = true
    const AUTOPRINT = false
    const MINEFOR = false//"feeddeadbeef"
    const DISPLAYPK = false;
    const web3 = new Web3(URL)
    const workDir = process.cwd();

    let result = "";
    if(MINEFOR){
    while(!result.address || result.address.toLowerCase().indexOf("0x"+MINEFOR)!==0){
        result = web3.eth.accounts.create();
        //console.log(result.address)
    }
    } else {
        result = web3.eth.accounts.create();
    }

    let PK = result.privateKey
    if(DISPLAYPK) console.log(PK);
    let pkLink
    if(COMPRESS) {
        function pkToUrl(pk) {
            return base64url(web3.utils.hexToBytes(pk));
        }
        let encoded = pkToUrl(PK);
        pkLink = URL+"/pk#"+encoded;
    } else {
        pkLink = URL+"/pk#"+PK.replace("0x","");
    }
    //console.log(pkLink)
    var private = qr.image(pkLink, { type: 'png' });
    var publicAddress = result.address;
    private.pipe(require('fs').createWriteStream(`${path}/${publicAddress.substring(0,8)}-priv.png`));


    var public = qr.image(URL+"/"+publicAddress, { type: 'svg' });
    public.pipe(require('fs').createWriteStream(`${path}/${publicAddress.substring(0,8)}.png`));
    //console.log("public.svg"+URL+"/"+publicAddress)

    console.log(publicAddress);

    var fs = require('fs');

    fs.appendFile(`${path}/addresses-${batchName}.txt`,publicAddress+"\n", function (err) {
        if (err) throw err;
    });

    return publicAddress;
}

function generateStickers(addresses, walletsDir, fileName = 'generated') {
    if (addresses.length > 15) {
        throw new Error("Max 15 stickers will fit on page");
    }

    let fs = require('fs');
    fs.readFileSync("templatestickers.html", 'utf8', (err,data) => {
        if (err) {
            return console.log(err);
        }

        let result = data.replace(/\*\*PATH\*\*/g, walletsDir);
        for (let i = 0; i < addresses.length; i++) {
            result = result
                .replace(new RegExp(`\\*\\*PUBLIC${i + 1}\\*\\*`, 'g'), addresses[i].substring(0,8)+"......"+addresses[i].substring(addresses[i].length-7))
                .replace(new RegExp(`\\*\\*PRIV${i + 1}\\*\\*`, 'g'), addresses[i].substring(0,8)+"-priv");
        }
        //console.log(result);

        fs.writeFileSync("generated.html", result, 'utf8', function (err) {
            if (err) return console.log(err)
            let html = fs.readFileSync('./generated.html', 'utf8');
            let conversion = require("phantom-html-to-pdf")();
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
                        },
                    },
            }, function(err, pdf) {
            if (err) return console.log(err);
            let output = fs.createWriteStream(`${walletsDir}/${fileName}.pdf`);
            //console.log(pdf.logs);
            //console.log(pdf.numberOfPages);
            // since pdf.stream is a node.js stream you can use it
            // to save the pdf to a file (like in this example) or to
            // respond an http request.
            pdf.stream.pipe(output);
            conversion.kill();
            output.close();
            });
        });
    });
}

module.exports = { getBalance, sendFunds, generateWallet, generateStickers }