// function validate()
// {
//   var username = document.getElementById("username").value;
//   var password = document.getElementById("password").value;
//   if (username == "admin_test@gmail.com" && password == "admin123")
//   {
//     alert ("Login successfully");
//     window.location = "./index.html";
//     return false;
//   }
//   else
//   {
//     alert ("Login failed");
//   }
// }

const {Connection} = require('../../nodejs-mysql/db_config.js');

function validate()
{
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;
  Connect.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], function(err, rows, fields) {
    if(err) throw err
    
    // if user not found
    if (rows.length <= 0) {
        req.flash('error', 'Tolong masukan kembali!')
        res.redirect('./login.html')
    }
    else { // if user found
        req.session.loggedin = true;
        req.session.name = name;
        res.redirect('./index.html');
    }            
})
}