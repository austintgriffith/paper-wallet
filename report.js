var fs = require('fs')
console.log("Reading accounts.json...")
let accounts = JSON.parse(fs.readFileSync("./accounts.json").toString())
for(let a in accounts){
  console.log(accounts[a].address)
}
console.log("There are "+accounts.length+" accounts...")
