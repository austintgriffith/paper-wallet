//***** WARNING *****//
// This code is pure garbage, and you will be sending potentially lots of cash with it.
// Use at your own risk and start with small verifying txs.
//TODO: Make this all better and incorporate clevis

const Web3 = require('web3');
const { BN, fromWei, toWei } = Web3.utils;
require('dotenv').config();
const ethereumjsutil = require("ethereumjs-util")
const fs = require("fs")

const CONFIG = {
  justChecking: false, //True if you only want to check balances of all accounts
  dryRun: false, //Tells you what it would do without actually sending any txs
  testRun: false, //Sends small dust amounts instead of the real airdrop amount
  provider: "http://0.0.0.0:8545",//'https://dai.poa.network',
  erc20ContractAddr: '0xD5095AAd6aC04C44dd69845AC26a88Fb96b4CE0A', //Contract addr for the ERC20 token
  erc20Abi: require('./contracts/Burner.abi'),
  sendingPk: process.env.SENDING_PK,
  sendingAccount: "0x"+ethereumjsutil.privateToAddress(process.env.SENDING_PK).toString('hex'),
  erc20SendGas: 75034,
  xDaiSendGas: 21000,
  gasPrice: toWei('1.1', 'gwei'),
}


const web3 = new Web3(new Web3.providers.HttpProvider(CONFIG.provider));
let ERC20 = new web3.eth.Contract(CONFIG.erc20Abi, CONFIG.erc20ContractAddr);

const AMOUNT_OF_ERC20_TO_SEND = CONFIG.testRun ? toWei('1', 'wei') : toWei('5', 'ether')
const AMOUNT_OF_NATIVE_TOKEN_TO_SEND = CONFIG.testRun ? toWei('1', 'wei') : toWei('0.02', 'ether')

//Batch related settings
const TXS_PER_BATCH = 6
const SLEEP_TIME = 10000

function main() {
  let accounts = []
  let accountsJson = JSON.parse(fs.readFileSync("./accounts.json").toString())
  for(let a in accountsJson){
    accounts[a] = accountsJson[a].address
  }

  checkBalances(accounts)
  if(!CONFIG.justChecking) airDrop(accounts)
}

main()

async function airDrop(accounts) {
  if(CONFIG.sendingPk === undefined && CONFIG.dryRun === false) {
    console.log("Cannot airdrop without a PK. Please supply PK in env.SENDING_PK")
    process.exit(1)
  }

  if(CONFIG.testRun === true) {
    console.log("WARNING: You are in testRun=true mode. Only dust will be sent to accounts")
  }

  let hasFunds = await senderHasFunds(accounts.length)

  if(!hasFunds) {
    console.log("Sender did not have sufficient funds. Exiting")
    process.exit(1)
  }

  console.log(`Airdropping ${accounts.length} accounts`)

  web3.eth.getTransactionCount(CONFIG.sendingAccount).then(async function(nonce) {
    console.log('Nonce: ', nonce);

    let batch = []
    for(let i = 0; i < accounts.length; i++) {
      console.log('AMOUNT_OF_ERC20_TO_SEND: ', AMOUNT_OF_ERC20_TO_SEND);
      console.log('AMOUNT_OF_NATIVE_TOKEN_TO_SEND: ', AMOUNT_OF_NATIVE_TOKEN_TO_SEND);

      let tx = sendErc20(accounts[i], nonce++)
      batch = await addToBatch(batch, tx)

      tx = sendXDai(accounts[i], nonce++)
      batch = await addToBatch(batch, tx)
    }

    await clearBatch(batch)
  })
}

async function addToBatch(batch, promise) {
  batch.push(promise)

  if(batch.length === TXS_PER_BATCH) {
    await clearBatch(batch)
    batch = []
  }

  return batch
}

async function clearBatch(batch) {
  console.log("About to wait for batch: ", batch);
  await Promise.all(batch);
  console.log("Batch finished")
  console.log("Sleeping")
  await sleep(SLEEP_TIME)
}

function expectedGasCosts() {
  return new BN((CONFIG.xDaiSendGas + CONFIG.erc20SendGas) * CONFIG.gasPrice);
}

async function senderHasFunds(numAccounts) {
  let requiredXDai = (new BN(AMOUNT_OF_NATIVE_TOKEN_TO_SEND).add(expectedGasCosts())) * numAccounts;
  let requiredBurn = new BN(AMOUNT_OF_ERC20_TO_SEND) * numAccounts;

  console.log('requiredXDai: ', requiredXDai);
  console.log('requiredBurn: ', requiredBurn);

  let erc20Balance = await checkErc20Balance(CONFIG.sendingAccount);
  let balance = await web3.eth.getBalance(CONFIG.sendingAccount)

  console.log('erc20Balance: ', erc20Balance);
  console.log('nativeBalance: ', balance);

  return (balance >= requiredXDai && erc20Balance >= requiredBurn);
}

async function checkBalances(accounts) {
  console.log(`Checking balances of ${accounts.length} accounts`)

  for(let i = 0; i < accounts.length; i++) {
    let erc20Balance = await checkErc20Balance(accounts[i]);
    let balance = await web3.eth.getBalance(accounts[i])

    //Enable this line if you only want to show those who don't have the correct amount air dropped on them.
    // if(fromWei(erc20Balance, 'ether') !== '10' || fromWei(balance, 'ether') !== '0.01') {
    if(true) {
      console.log(`${accounts[i]}:`)
      console.log(`  erc20Balance: ${fromWei(erc20Balance, 'ether')}`)
      console.log(`  nativeBalance: ${fromWei(balance, 'ether')}`)
    }
  }
}

function checkErc20Balance(account) {
  return ERC20.methods.balanceOf(account).call();
}

async function sendXDai(to, nonce) {
  let tx = {
    to: to,
    value: AMOUNT_OF_NATIVE_TOKEN_TO_SEND,
    gas: CONFIG.xDaiSendGas,
    gasPrice: CONFIG.gasPrice,
    nonce: nonce
  }

  if(CONFIG.dryRun === false) {
    let signed = await web3.eth.accounts.signTransaction(tx, CONFIG.sendingPk)
    return web3.eth.sendSignedTransaction(signed.rawTransaction)
  } else {
    console.log("Dry run enabled. Would have sent tx: ", tx)
  }
}

async function sendErc20(to, nonce) {
  let data = ERC20.methods.transfer(to, AMOUNT_OF_ERC20_TO_SEND).encodeABI()

  let tx = {
    to: CONFIG.erc20ContractAddr,
    gas: CONFIG.erc20SendGas,
    gasPrice: CONFIG.gasPrice,
    data: data,
    nonce: nonce
  }

  if(CONFIG.dryRun === false) {
    let signed = await web3.eth.accounts.signTransaction(tx, CONFIG.sendingPk)
    return web3.eth.sendSignedTransaction(signed.rawTransaction)
  } else {
    console.log("Dry run enabled. Would have sent tx: ", tx)
  }
}

function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}
