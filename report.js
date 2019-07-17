var fs = require('fs')
let accounts = JSON.parse(fs.readFileSync("./accounts.json").toString())

console.log("There are "+accounts.length+" accounts...")
for(let a in accounts){
  console.log(accounts[a].address)
}
