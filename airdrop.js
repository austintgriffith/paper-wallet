//***** WARNING *****//
// This code is pure garbage, and you will be sending potentially lots of cash with it.
// Use at your own risk and start with small verifying txs.
//TODO: Make this all better and incorporate clevis


const Web3 = require('web3');
const { BN, fromWei, toWei } = Web3.utils;

const CONFIG = {
  dryRun: false, //Tells you what it would do without actually sending any txs
  testRun: true, //Sends small dust amounts instead of the real airdrop amount
  provider: 'https://dai.poa.network',
  erc20ContractAddr: '0xDec31651Bec1fBbFF392aa7DE956d6EE4559498b', //Contract addr for the ERC20 token
  erc20Abi: require('./contracts/Burner.abi'),
  sendingAccount: '0x425b550cc2a60b297fa4a50ca4840265ec67ada8',
  sendingPk: process.env.SENDING_PK,
  erc20SendGas: 75034,
  xDaiSendGas: 21000,
  gasPrice: toWei('1', 'gwei'),
}

const web3 = new Web3(new Web3.providers.HttpProvider(CONFIG.provider));
let ERC20 = new web3.eth.Contract(CONFIG.erc20Abi, CONFIG.erc20ContractAddr);

const AMOUNT_OF_BURN_TO_SEND = CONFIG.testRun ? toWei('1', 'wei') : toWei('10', 'ether')
const AMOUNT_OF_XDAI_TO_SEND = CONFIG.testRun ? toWei('1', 'wei') : toWei('0.01', 'ether')

function main() {
  let accounts = [
    "0x425b550cc2a60b297fa4a50ca4840265ec67ada8"
  ];

  checkBalances(accounts)
  airDrop(accounts)
}

main()





async function airDrop(accounts) {
  if(CONFIG.sendingPk === undefined && CONFIG.dryRun === false) {
    console.log("Cannot airdrop without a PK. Please supply PK in env.SENDING_PK")
    process.exit(1)
  }

  let hasFunds = await senderHasFunds(accounts.length)

  if(!hasFunds) {
    console.log("Sender did not have sufficient funds. Exiting")
    process.exit(1)
  }

  console.log(`Airdropping ${accounts.length} accounts`)

  web3.eth.getTransactionCount(CONFIG.sendingAccount).then(nonce => {
    console.log('Nonce: ', nonce);

    for(let i = 0; i < accounts.length; i++) {
      console.log('AMOUNT_OF_BURN_TO_SEND: ', AMOUNT_OF_BURN_TO_SEND);
      console.log('AMOUNT_OF_XDAI_TO_SEND: ', AMOUNT_OF_XDAI_TO_SEND);

      sendXDai(accounts[i], nonce++);
      sendErc20(accounts[i], nonce++);
    }

  })
}

function expectedGasCosts() {
  return new BN((CONFIG.xDaiSendGas + CONFIG.erc20SendGas) * CONFIG.gasPrice);
}

async function senderHasFunds(numAccounts) {
  let requiredXDai = (new BN(AMOUNT_OF_XDAI_TO_SEND).add(expectedGasCosts())) * numAccounts;
  let requiredBurn = new BN(AMOUNT_OF_BURN_TO_SEND) * numAccounts;

  console.log('requiredXDai: ', requiredXDai);
  console.log('requiredBurn: ', requiredBurn);

    let erc20Balance = await checkErc20Balance(CONFIG.sendingAccount);
    let balance = await web3.eth.getBalance(CONFIG.sendingAccount)

    console.log('erc20Balance: ', erc20Balance);
    console.log('balance: ', balance);

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
      console.log(`  BURN: ${fromWei(erc20Balance, 'ether')}`)
      console.log(`  xDai: ${fromWei(balance, 'ether')}`)
    }
  }
}

function checkErc20Balance(account) {
  return ERC20.methods.balanceOf(account).call();
}

function sendXDai(to, nonce) {
  let tx = {
    to: to,
    value: AMOUNT_OF_XDAI_TO_SEND,
    gas: CONFIG.xDaiSendGas,
    gasPrice: CONFIG.gasPrice,
    nonce: nonce
  }

  if(CONFIG.dryRun === false) {
    web3.eth.accounts.signTransaction(tx, CONFIG.sendingPk).then(signed => {
        web3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', console.log);
    });
  } else {
    console.log("Dry run enabled. Would have sent tx: ", tx)
  }
}

function sendErc20(to, nonce) {
  let data = ERC20.methods.transfer(to, AMOUNT_OF_BURN_TO_SEND).encodeABI()

  let tx = {
    to: CONFIG.erc20ContractAddr,
    gas: CONFIG.erc20SendGas,
    gasPrice: CONFIG.gasPrice,
    data: data,
    nonce: nonce
  }

  if(CONFIG.dryRun === false) {
    web3.eth.accounts.signTransaction(tx, CONFIG.sendingPk).then(signed => {
        web3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', console.log);
    });
  } else {
    console.log("Dry run enabled. Would have sent tx: ", tx)
  }
}
