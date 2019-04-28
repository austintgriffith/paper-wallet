const qr = require('qr-image');
const csv = require('csv-parser');
const fs = require('fs');

const URL = "https://sundai.io"
const priceList = 'pricelist-ws.csv';
const folder = 'pricelist';
const workDir = process.cwd();

async function run() {
    const prices = [];

    fs.createReadStream(`${workDir}/${folder}/${priceList}`)  
    .pipe(csv())
    .on('data', (row) => {
        prices.push(row);
    })
    .on('end', async () => {
        console.log(prices);
        let priceLink;
        let address;
        let price;
        let item;
        let event;
        let priceQR;
        for(let i = 0; i < prices.length; i++) {
            event = prices[i].event;
            address = prices[i].address;
            price = prices[i].price;
            item = prices[i].item;
            priceLink = `${URL}/${address};${price};${item}`;
            priceQR = qr.image(priceLink, { type: 'png' });
            priceQR.pipe(require('fs').createWriteStream(`${folder}/${event}_${address.substring(0,8)}_${item}.png`));
        }        
    });  
}

run();



