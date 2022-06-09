function validate()
{
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;
  if (username == "admin_test@gmail.com" && password == "admin123")
  {
    alert ("Login successfully");
    window.location = "./index.html";
    return false;
  }
  else
  {
    alert ("Login failed");
  }
}