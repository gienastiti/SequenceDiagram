function validate()
{
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;
  if (username == "admin" && password == "admin")
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