var Web3 = require('web3')
var fs = require('fs')
const MINEFOR = false//"da06"
var web3 = new Web3()


let AMOUNT = process.argv[2]
if(!AMOUNT) AMOUNT=1

let accounts


for(let a=0;a<AMOUNT;a++){

  let result = ""
  if(MINEFOR){
    while(!result.address || result.address.toLowerCase().indexOf("0x"+MINEFOR)!==0){
      result = web3.eth.accounts.create();
    }
  }else{
    result = web3.eth.accounts.create();
  }

  try{
    accounts = JSON.parse(fs.readFileSync("./accounts.json").toString())
  }catch(e){
    accounts = []
  }


  accounts.push(
    {address:result.address,pk:result.privateKey}
  )
  console.log(result.address)

  fs.writeFileSync("./accounts.json",JSON.stringify(accounts).toString())
}
