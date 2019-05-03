const Web3 = require('web3');
const JSBI = require('jsbi');
require('dotenv').config();
const ethereumjsutil = require("ethereumjs-util");
const ethers = require('ethers');
const fs = require("fs");
const { sendFunds, getBalance, sleep } = require ('./helpers');

const CONFIG = {
  dryRun: false, //Tells you what it would do without actually sending any txs
  provider: 'https://mainnet-node.leapdao.org',
  dispenser: { 
    priv: process.env.SENDING_PK,
    address: "0x"+ethereumjsutil.privateToAddress(process.env.SENDING_PK).toString('hex') 
  },
  tokenColor: 2,
  amountToSend: '11000000000000000000'
};
const folder = 'wallets-conf';
const batch = '0';


//use this to debug CONFIG
//console.log(CONFIG)
//process.exit(1)

const rpc = new ethers.providers.JsonRpcProvider(CONFIG.provider);

async function main() {
  let accounts = fs.readFileSync(`./${folder}/addresses-${batch}.txt`).toString().trim().split("\n");
  const totalToSend = String(JSBI.multiply(JSBI.BigInt(CONFIG.amountToSend), JSBI.BigInt(accounts.length)));
  let balance;
  let txHash;
  let txReceipt;

  balance = await getBalance(CONFIG.dispenser.address, CONFIG.tokenColor, rpc);
  console.log(totalToSend, 'tokens will be sent to', accounts.length, 'addresses');
  console.log('Dispenser address', CONFIG.dispenser.address);
  console.log('Dispenser wallet balance:', String(balance));
  if (CONFIG.dryRun) console.log('Dry run mode is enabled! No tokens will be dispensed!');
  if(JSBI.LT(balance, JSBI.BigInt(totalToSend))) {
    if(!CONFIG.dryRun) {
      //throw new Error('Not enough funds in dispenser!');
    } else {
      console.log('Not enough funds in dispenser!');
    }
  }
  
  for(let i = 0; i < accounts.length; i++) {
    console.log(i, 'Dispensing', CONFIG.amountToSend, 'tokens to', accounts[i]);
    balance = await getBalance(accounts[i], CONFIG.tokenColor, rpc);
    if (String(balance) !== '0') {
        console.log('   Address already funded(', String(balance), '). Skipping.');
        continue;
    }
    if (!CONFIG.dryRun) {
      txHash = await sendFunds(CONFIG.dispenser, accounts[i], CONFIG.amountToSend, CONFIG.tokenColor, rpc);
      for(let i = 0; i <= 5; i++) {
        await sleep(1000);
        txReceipt = await rpc.send("eth_getTransactionReceipt", [txHash]);   
        if(txReceipt) break;
      }   
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