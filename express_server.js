const express = require("express");
const cookieParser = require("cookie-parser");

/** server setup */
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

/**  mock database */
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

/** functions */
// generate a string of n random alphnumeric characters
// a-Z: 65-122; 0-9: 48-57
// helper: generate a random integer between input min and max
const getRandomInt = function(min, max) {
  max += 1;
  return Math.floor(Math.random() * (max - min) + min);
};
const generateRandomString = function(strLen) {
  let randomString = "";
  for (let i = 0; i < strLen; i++) {
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

/** server methods */
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// show urls
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, email: req.cookies["email"] };
  res.render("urls_index", templateVars);
});
// Authentication

// register page
app.get("/register", (req, res) => {
  const templateVars = {
    id: req.body.id,
    email: req.body.email,
    password: req.body.password
  };
  res.render("user_register", templateVars);
});

// register a new user
app.post("/register", (req, res) => {
  const stringLength = 12;
  const userId = generateRandomString(stringLength);
  const newUser = {
    id: userId,
    email: req.body["email"],
    password: req.body["password"]
  };
  users[userId] = newUser;
  res.cookie("user_id", userId); 
  //console.log(`register a new user: { ${userId} : ${userEmail}, ${userPassword} }`);
  console.log(users); // check if new user was registered
  res.redirect("/urls");
});

// get username
app.get("/urls", (req, res) => {
  const templateVars = { email: req.cookies["email"] };
  res.render("partials/_header", templateVars);
});

// user login
app.post("/login", (req, res) => {
  const email = req.body.email;
  //console.log(`set username: ${name}`);
  res.cookie("email", email);
  res.redirect("/urls");
});

// user logout
app.post("/logout", (req, res) => {
  res.clearCookie("email");
  res.redirect("/");
});

// CRUD

// new created url
app.get("/urls/new", (req, res) => {
  const templateVars = { email: req.cookies["email"] };
  res.render("urls_new", templateVars);
});

// show url page
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], email: req.cookies["email"] };
  res.render("urls_show", templateVars);
});

// redirect to long url
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// create new url
app.post("/urls", (req, res) => {
  const stringLength = 6;
  const id = generateRandomString(stringLength);
  const longURL = req.body.longURL;
  urlDatabase[id] = longURL;
  // console.log(`create a new url: { ${id} : ${longURL} }`); // log the post request body to the console
  res.redirect(`/urls/${id}`);
});

// delete url
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  // console.log(`delete an exist url: { ${req.params.id} : ${urlDatabase[id]} }`);
  delete urlDatabase[id];
  res.redirect("/urls");
});

// edit url
app.post("/urls/:id/edit", (req, res) => {
  const id = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[id] = longURL;
  // console.log(`update a new url: { ${id} : ${longURL} }`);
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Tinny app listening on port ${PORT} 😊!`);
});