let fs = require("fs");

let list = fs.readFileSync("cowboy_addresses.txt").toString().split("\n")

let addresses = []
for(let l in list){
  if(list[l]){
    addresses.push({
      address: list[l],
      pk: "0x00"
    })
  }
}

fs.writeFileSync("accounts.json",JSON.stringify(addresses))
