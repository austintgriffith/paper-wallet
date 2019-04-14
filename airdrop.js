const Web3 = require('web3');
const JSBI = require('jsbi');
require('dotenv').config();
const ethereumjsutil = require("ethereumjs-util");
const ethers = require('ethers');
const fs = require("fs");
const { sendFunds, getBalance } = require ('./helpers');

const CONFIG = {
  dryRun: true, //Tells you what it would do without actually sending any txs
  provider: 'https://testnet-node.leapdao.org',
  dispenser: { 
    priv: process.env.SENDING_PK,
    address: "0x"+ethereumjsutil.privateToAddress(process.env.SENDING_PK).toString('hex') 
  },
  tokenColor: 1,
  amountToSend: '1000000000000000000',
};



//use this to debug CONFIG
//console.log(CONFIG)
//process.exit(1)

const rpc = new ethers.providers.JsonRpcProvider(CONFIG.provider);

async function main() {
  let accounts = fs.readFileSync("./addresses.txt").toString().trim().split("\n");
  const totalToSend = String(JSBI.multiply(JSBI.BigInt(CONFIG.amountToSend), JSBI.BigInt(accounts.length)));
  let balance;

  balance = await getBalance(CONFIG.dispenser.address, CONFIG.tokenColor, rpc);
  console.log(totalToSend, 'tokens will be sent to', accounts.length, 'addresses');
  console.log('Dispenser address', CONFIG.dispenser.address);
  console.log('Dispenser wallet balance:', String(balance));
  if (CONFIG.dryRun) console.log('Dry run mode is enabled! No tokens will be dispensed!');
  if(JSBI.LT(balance, JSBI.BigInt(totalToSend))) {
    if(!CONFIG.dryRun) {
      throw new Error('Not enough funds in dispenser!');
    } else {
      console.log('Not enough funds in dispenser!');
    }
  }
  
  for(let i = 0; i < accounts.length; i++) {
    console.log('Dispensng', CONFIG.amountToSend, 'tokens to', accounts[i]);
    balance = await getBalance(accounts[i], CONFIG.tokenColor, rpc);
    if (String(balance) !== '0') {
        console.log('   Address already funded(', String(balance), '). Skipping.');
        continue;
    }
    if (!CONFIG.dryRun) {
      await sendFunds(CONFIG.dispenser, accounts[i], CONFIG.amountToSend, CONFIG.tokenColor, rpc);
      balance = await getBalance(accounts[i], CONFIG.tokenColor, rpc);
      if (String(balance) === CONFIG.amountToSend) {
          console.log('   Done');
      } else {
          console.log('   Failed! Expected balance:', CONFIG.amountToSend, 'actual: ', String(balance));
      }
    } else {
      console.log(' Dry run mode enabled! Will not send tokens. Account balance:', String(balance));
    }
  }
}

main();