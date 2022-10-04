import inquirer from 'inquirer'
import { getMyBids, taskBidder, clearEscrow, loadEscrow, printManual} from './utils.js'
console.log(" ██████╗ ███████╗███████╗███████╗██████╗ ██████╗  ██████╗ ████████╗\n██╔═══██╗██╔════╝██╔════╝██╔════╝██╔══██╗██╔══██╗██╔═══██╗╚══██╔══╝\n██║   ██║█████╗  █████╗  █████╗  ██████╔╝██████╔╝██║   ██║   ██║   \n██║   ██║██╔══╝  ██╔══╝  ██╔══╝  ██╔══██╗██╔══██╗██║   ██║   ██║   \n╚██████╔╝██║     ██║     ███████╗██║  ██║██████╔╝╚██████╔╝   ██║   \n ╚═════╝ ╚═╝     ╚═╝     ╚══════╝╚═╝  ╚═╝╚═════╝  ╚═════╝    ╚═╝   \n                                                                   ")
console.log("Developed for SoCal Stables by colley#8131")

inquirer
.prompt([
  {
    type: 'list',
    name: 'module',
    message: 'Select Module [Enter to Select]', 
    choices: [
      'Task Bidding', //done
      'My Bids', //done
      'Fund Escrow', //done
      'Clear Escrow',//done
      'Manual', //done
      new inquirer.Separator(),
    ],
  },
])
.then((answers) => {
  if(answers.module === "Task Bidding") {
      taskBidder()
  }
  if(answers.module === "My Bids"){
      getMyBids()
  }
  if(answers.module == "Fund Escrow"){
    inquirer.prompt([
      {
        name: 'amount',
        message: 'Enter SOL Amount to Add:'
      },
    ])
    .then(answers => {
      loadEscrow(answers.amount)
    });
  }
  if(answers.module == "Clear Escrow"){
      clearEscrow()
  }
  if(answers.module == "Manual"){
      printManual()
  }
});


