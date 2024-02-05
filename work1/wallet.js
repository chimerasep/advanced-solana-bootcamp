const fs = require('fs');
const { Keypair, Connection, Transaction, clusterApiUrl } = require('@solana/web3.js');

const walletFile = 'wallet.json';

let wallet;

function loadWallet() {
  try {
    const data = fs.readFileSync(walletFile, 'utf-8');
    wallet = JSON.parse(data);
    console.log('Wallet loaded successfully.');
  } catch (error) {
    console.log('Wallet not found or corrupted. Creating a new wallet.');
    createWallet();
  }
}

function saveWallet() {
  fs.writeFileSync(walletFile, JSON.stringify(wallet, null, 2), 'utf-8');
  console.log('Wallet saved successfully.');
}

function createWallet() {
  const keypair = Keypair.generate();
  wallet = {
    address: keypair.publicKey.toBase58(),
    privateKey: keypair.secretKey.toString(),
    balance: 0,
  };
  saveWallet();
}

async function airdrop(amount = 1) {
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  const publicKey = wallet.address;
  const airdropSignature = await connection.requestAirdrop(publicKey, amount * 10 ** 9);
  await connection.confirmTransaction(airdropSignature);
  console.log(`${amount} SOL airdrop received successfully.`);
}

async function getBalance() {
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  const publicKey = wallet.address;
  const balance = await connection.getBalance(publicKey);
  wallet.balance = balance / 10 ** 9;
  saveWallet();
  console.log(`Balance: ${wallet.balance} SOL`);
}

async function transfer(destination, amount) {
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  const privateKey = Uint8Array.from(Buffer.from(wallet.privateKey, 'base64'));
  const fromKeyPair = Keypair.fromSecretKey(privateKey);

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromKeyPair.publicKey,
      toPubkey: new PublicKey(destination),
      lamports: amount * 10 ** 9,
    })
  );

  const signature = await connection.sendTransaction(transaction, [fromKeyPair]);
  console.log(`Transfer to ${destination} of ${amount} SOL initiated. Transaction signature: ${signature}`);
}

function processCommand(command, args) {
  switch (command) {
    case 'new':
      createWallet();
      break;
    case 'airdrop':
      airdrop(args[0] || 1);
      break;
    case 'balance':
      getBalance();
      break;
    case 'transfer':
      transfer(args[0], args[1]);
      break;
    default:
      console.log('Invalid command.');
  }
}

