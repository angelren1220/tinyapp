const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// generate a string of 6 random alphnumeric characters
// a-Z: 65-122; 0-9: 48-57
const generateRandomString = function() {
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    const numOrAlph = getRandomInt(0, 1);
    // char is number
    if (numOrAlph) {
      const charCode = getRandomInt(48, 57);
      const char = String.fromCharCode(charCode);
      randomString += char;
      continue;
    }
    // char is alphabet
    const lowerCaseOrUpperCase = getRandomInt(0, 1);
    // lowercase
    if (lowerCaseOrUpperCase) {
      const charCode = getRandomInt(97, 122);
      const char = String.fromCharCode(charCode);
      randomString += char;
      continue;
    }
    // uppercase
    const charCode = getRandomInt(65, 90);
    const char = String.fromCharCode(charCode);
    randomString += char;
  }
  return randomString;
};

// generate a random integer between input min and max
const getRandomInt = function(min, max) {
  max += 1;
  return Math.floor(Math.random() * (max - min) + min);
};


app.get("/", (req, res) => {
  res.redirect("/urls");
});

// show urls
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

// get username
app.get("/urls", (req, res) => {
  const tempName = { username: req.cookies["username"] };
  res.render("partials/_header", tempName);
});

// new created url
app.get("/urls/new", (req, res) => {
  const tempName = { username: req.cookies["username"]};
  res.render("urls_new", tempName);
});

// show url page
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

// redirect to long url
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// create new url
app.post("/urls", (req, res) => {
  const id = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[id] = longURL;
  console.log(`create a new url: { ${id} : ${longURL} }`); // log the post request body to the console
  res.redirect(`/urls/${id}`);
});

// delete url
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  console.log(`delete an exist url: { ${req.params.id} : ${urlDatabase[id]} }`);
  delete urlDatabase[id];
  res.redirect("/urls");
});

// edit url
app.post("/urls/:id/edit", (req, res) => {
  const id = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[id] = longURL;
  console.log(`update a new url: { ${id} : ${longURL} }`);
  res.redirect("/urls");
});

// user login
app.post("/login", (req, res) => {
  const name = req.body.username;
  console.log(`set username: ${name}`);
  res.cookie("username", name);
  res.redirect("/urls");
});

// user logout
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/");
});

// register page
app.get("/register", (req, res) => {
  const templateVars = { 
    username: req.body.username,
    email: req.body.email,
    password: req.body.password
  }
  res.render("user_register", templateVars);
});

app.listen(PORT, () => {
  console.log(`Tinny app listening on port ${PORT}!`);
});