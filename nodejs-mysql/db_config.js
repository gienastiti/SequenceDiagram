// var mysql = require('mysql');

// var db = mysql.createConnection({
//     host: "localhost",
//     user: "root",
//     password: "",
//     database: "login"
// });

// db.connect(function(err) {
//     if (err) throw err;
//     console.log("Connected!");
// });

// db.query('select * from login');


var mysql = require('mysql');

var db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "myapp"
});

db.connect(function(error) {
    if (error) {
        console.log(error);
    } else {
        console.log("Connected!");
    }
});
module.exports=db;

db.query('select * from users');



// const mysql = require('mysql');

// let connection = mysql.createConnection({
//     host: "localhost",
//     user: "root",
//     password: ""
// });

// let select = `SELECT COUNT(*) AS count FROM login.login;`;

// connection.query(select);