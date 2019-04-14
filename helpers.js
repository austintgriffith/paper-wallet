const JSBI = require('jsbi');
const { Tx, helpers, Output, Outpoint } = require('leap-core');

async function getBalance(address, color, rpc) {
    const response = await rpc.send('plasma_unspent', [address]);
    const balance = response.reduce((sum, unspent) => { 
        return (unspent.output.color === color) ? JSBI.add(sum, JSBI.BigInt(unspent.output.value)) : sum}, JSBI.BigInt(0));

    return balance;
}

async function sendFunds(from, to, amount, color, rpc) {
    const utxos = (await rpc.send("plasma_unspent", [from.address]))
    .map(u => ({
      output: u.output,
      outpoint: Outpoint.fromRaw(u.outpoint),
    }));

    if (utxos.length === 0) {
        throw new Error("No tokens left in the source wallet");
    }

    const inputs = helpers.calcInputs(utxos, from.address, amount, color);

    let outputs = helpers.calcOutputs(utxos, inputs, from.address, to, amount, color);

    const tx = Tx.transfer(inputs, outputs).signAll(from.priv);

    // eslint-disable-next-line no-console
    const txHash = await rpc.send("eth_sendRawTransaction", [tx.hex()]);
    console.log('txHash:', txHash);
}

module.exports = { getBalance, sendFunds }