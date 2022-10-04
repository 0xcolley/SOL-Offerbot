//these are import libraries, they are like usb's you can plug into the coding language to make them do more
//in node.js (this language) they are managed by the node package manager (or npm)
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const Web3 = require('@solana/web3.js');
const config = require('./config.json')
const bs58 = require('bs58')
//var does the same thing as let - this is covered in the comments below, it's a mutable declaration, is more acceptable for imports
//other than imports nobody uses var, its not standard in ES6 (the language standard I write in)
var axios = require('axios');
var fs = require('fs'); 
var csv = require('fast-csv');

//this is the magic eden api token, then the program loads the settings from config.json into variables
//for reference a const variables refers to a constant variable, if I tried to change them it would throw an error in the code
//if I wanted a variable that was mutable(proper term) or changable, I would declare them as "let" instead of const
const bearerToken = "04b37d31-8af7-4c99-90b1-11c5d3e43b4b"
const privateKey = config.privateKey

//Solana handles private keys using a 64 bit array(list) of 8 unsigned bit integers (number from -256 to 255)
//- for proper computing terms, these arrays are unsigned, you don't need to know what that means
//Solana addresses are in a base58 standard excluding the letters/numbers L, O, and 0 to prevent mistyping
//This first line decodes the private key you entered in the config file to an array of the numbers mentioned above
const secretKey = (Uint8Array.from(bs58.decode(privateKey)))
//the line under this comment creates a keypair(your address and private key) from the array created above
let keypair = Web3.Keypair.fromSecretKey(secretKey);
//the line under this comment connects the program to the solana network using the private key
const connection = new Web3.Connection(Web3.clusterApiUrl("mainnet-beta"), "confirmed");
//this variable parses your wallet address from the private key (first 32 bits of the 64 bit integer array)
//sorry for taking you back to calculus, but the public key is typically the derivative of the private key in all crypto (eth, btc)
//no you cannot take integral of the public key to get someone's private key
const wallet = keypair.publicKey.toBase58();

//this function is called when you select the "My Bids" option from the interface in main.js
async function getMyBids() {
  //total variable for adding total amount of solana
  let total = 0

  //makes a get request to the magic eden application platform interface and loads the data to the data variable
  const { data } = await axios.get(`https://api-mainnet.magiceden.dev/v2/wallets/${wallet}/offers_made?offset=0&limit=100`)
  
  //this is called a for-loop, the line under this one in english translates to:
  //for the amount of entries in data minus one, do the stuff inside the loop that many times until the indexer, i, is equal to zero, then deincrement i
  for (let i = data.length - 1; i >= 0; i--) {
    //formatting each line of the data which is then printed
    console.log("Token Mint: " + data[i].tokenMint + " - Price: " + data[i].price)
    total += data[i].price
  }
  //printing total amount of solana
  console.log("Total SOL in Bids: " + total)
}

//this function is called when you select the "Tasks Bidder" option from the interface in main.js
async function taskBidder() {
  //uses filestream to open tasks.csv
  var stream = fs.createReadStream("tasks.csv");
  console.log("Loaded Tasks")
  //then parses the csv file by lines and stores the data in data
  csv.parseStream(stream, {headers : true}).on("data", function(data){
    //then creates a local function that makes an api request to magic-eden and gets the bid instruction using the task
      axios.get(
        'https://api-mainnet.magiceden.dev/v2/instructions/buy', {
          params: {
            buyer: wallet, 
            auctionHouseAddress: 'E8cU1WiRWjanGxmn96ewBgk9vPTcL6AEZ1t6F6fkgUWe',
            tokenMint: data.token_mint, 
            price: data.price 
            },
            headers: { Authorization: "Bearer " + bearerToken }
        }).then((res) => {
            //creates a transaction using the data from the tasks.csv and sends the transaction using the solana keypair
            const txSigned = res.data.txSigned
            const txn = Web3.Transaction.from(Buffer.from(txSigned.data))
            const signature = Web3.sendAndConfirmTransaction(
                connection,
                txn,
                [keypair]
            )
            //tells you in human readable form what bids have been sent
            console.log("Sent Bid to #" + data.id + " for " + data.price + "SOL")
        })
  }).on("end", function(){
  
  });
  console.log("All Bids from Tasks.csv have been sent, you may view them using the My Bids module.");
}

//this function is called when you select the "Clear Escrow" option from the interface in menu.js
async function clearEscrow() {
  let escrow_balance = 0
  let data = await axios.get(`https://api-mainnet.magiceden.dev/v2/wallets/${wallet}/escrow_balance`)
  escrow_balance += data.data.balance

  axios.get(
    'https://api-mainnet.magiceden.dev/v2/instructions/withdraw', {
      params: {
        buyer: wallet, 
        auctionHouseAddress: 'E8cU1WiRWjanGxmn96ewBgk9vPTcL6AEZ1t6F6fkgUWe',
        amount: escrow_balance
        },
        headers: { Authorization: "Bearer " + bearerToken }
    }).then((res) => {
        // sign and send txn here
        const txSigned = res.data.txSigned
        const txn = Web3.Transaction.from(Buffer.from(txSigned.data))
        const signature = Web3.sendAndConfirmTransaction(
            connection,
            txn,
            [keypair]
        )
        console.log(escrow_balance + "SOL has been withdrawn back to wallet")
    })
  
}

async function loadEscrow(amount) {
  axios.get(
    'https://api-mainnet.magiceden.dev/v2/instructions/deposit', {
      params: {
        buyer: wallet, 
        auctionHouseAddress: 'E8cU1WiRWjanGxmn96ewBgk9vPTcL6AEZ1t6F6fkgUWe',
        amount: amount
        },
        headers: { Authorization: "Bearer " + bearerToken }
    }).then((res) => {
        // sign and send txn here
        const txSigned = res.data.txSigned
        const txn = Web3.Transaction.from(Buffer.from(txSigned.data))
        const signature = Web3.sendAndConfirmTransaction(
            connection,
            txn,
            [keypair]
        )
        console.log(amount + "SOL added to escrow wallet")
    })

}

async function printManual(){
  console.log("Modules Explained:")
  console.log("Task Bidding - Reads the tasks.csv file and will make the bids set-up in that file.")
  console.log("My Bids - Reads all bids made from the wallet program is being used with and returns them.")
  console.log("Fund Escrow - Prompts you how much sol you'd like to add, you do not need to fund to make bids, it will be done automatically.")
  console.log("Clear Escrow - Withdraws all SOL in your MagicEden escrow wallet to your address.")
}



export { getMyBids, taskBidder, clearEscrow, loadEscrow, printManual}

