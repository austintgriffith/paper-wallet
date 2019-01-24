# paperwallet
Paper wallets to seed the [Burner Wallet](https://github.com/austintgriffith/burner-wallet) with private keys.

# install
```javascript
git clone https://github.com/austintgriffith/paper-wallet
cd paper-wallet
npm i
```

# run
```javascript
node index.js
```

This will generate a file called `generated.html` that can be printed.

You could also just print out `private.svg` if you are in a pinch.

If you would like me to generate you a special wallet design `cspaperwallet.jpg` hit me up on Twitter or Telegram @austingriffith


# air dropping

You will need a distribution account. I would suggest using a mnemonic you can remember in the Burner Wallet and then copy the private key the wallet generates. 

You will then pass this private key into the airdrop script within the command you run it with or in a `.env` file:

```
echo "SENDING_PK=0xdeadbeef" > .env
```

If this account has the necessary funds, it will drop whatever you specify in the `AMOUNT_OF_BURN_TO_SEND` and `AMOUNT_OF_XDAI_TO_SEND` to all `accounts` listed in your `addresses.txt` file:
```
node airdrop.js
```

Use the CONFIG options like `justChecking`, `dryRun`, `testRun` for more control and testing.
