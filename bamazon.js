
var mysql = require("mysql");
var inquirer = require("inquirer");
var connection = mysql.createConnection({
    host: "127.0.0.1",
    port: 8080,
    user: "root",
    password: "root",
    database: "bamazon"
})

connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    console.log("-----------**********-------------");
    start();
    queryProducts();
    console.log("--------************----------");
});

//Grabbing the table from the database & printing into my console
function queryProducts() {
    connection.query("SELECT * FROM products", function (err, res) {
        for (var i = 0; i < res.length; i++) {
            console.log(res[i].itemid + " || " +
                "PRODUCT: " + res[i].productname + " || " +
                "DEPARTMENT: " + res[i].departmentname + " || " +
                "PRICE: $" + res[i].price + " || " +
                "IN STOCK: " + res[i].stockquantity);
        }
        console.log("----**********--------");
    });
}


//start function that prompts the user if they want to buy or exit
function start() {
    inquirer
        .prompt({
            name: "buyOrLeave",
            type: "list",
            message: "Would you like to [Buy] today?",
            choices: ["SHOP", "EXIT"]
        })
        //if they choose to buy it will initiate the shopfunction and guide them trough an array of items 
        .then(function (answer) {

            if (answer.buyOrLeave === "Buy") {
                shop();

            } else {
                //if they choose to exit terminal will end the prompt & end my connection
                connection.end();
                console.log("well try again next time!")
            }
        });
};

function shop() {

    connection.query("SELECT * FROM products", function (err, results) {
        if (err) throw err;

        inquirer
            .prompt([
                {
                    name: "choice",
                    type: "rawlist",
                    choices: function () {
                        var AnswerArray = [];
                        for (var i = 0; i < results.length; i++) {
                            AnswerArray(results[i].product);
                        }
                        return AnswerArray;
                    },
                    message: "What would you like to buy?"
                },
                {
                    name: "quantity",
                    type: "input",
                    message: "How many would you like to purchase?"
                }
            ])
            .then(function (answer) {
                //LOOPS THROUGH THE MYSQL TABLE TO CHECK THAT THE PRODUCT THEY WANTED EXISTS//
                var chosenItem;
                for (var i = 0; i < results.length; i++) {
                    if (results[i].productname === answer.choice) {
                        chosenItem = results[i];
                    }
                }

                if (chosenItem.stockquantity >= parseInt(answer.quantity)) {

                    connection.query(
                        "UPDATE products SET ? WHERE ?",
                        [
                            {
                                stockquantity: chosenItem.stockquantity - answer.quantity
                            },
                            {
                                itemid: chosenItem.itemid
                            }
                        ],
                        function (error) {
                            if (error) throw err;
                            console.log("You've placed an order! Your cost is $" + chosenItem.price * answer.quantity);
                            start();
                        }
                    );
                }
                else {

                    console.log("Insufficient quantity...");
                    start();
                }

            });
    });
}
