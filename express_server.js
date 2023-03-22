const express = require("express");
const cookieParser = require("cookie-parser");
const { response } = require("express");

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

const usersDb = {
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
const generateRandomString = function(strLen) {
  let randomString = Math.random().toString(36).substring(2, strLen + 2);
  return randomString;
};

// find user with email and return user
const findUserByEmail = function(database, email) {
  for (const userId in usersDb) {
    const user = usersDb[userId];
    if (user.email === email) {
      return user;
    }
  }
};

/** server methods */
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// show urls
app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = usersDb[userId];
  const templateVars = { urls: urlDatabase, user };
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
  const email = req.body["email"];
  const password = req.body["password"];

  // if either email or password is empty string, send 400
  if (!(email && password)) {
    return res.status(400).send("Cannot register with empty string");
  }

  // if email is already registered, send 400
  if (findUserByEmail(usersDb, email)) {
    return res.status(400).send("Email is already registered!");
  }

  const newUser = {
    id: userId,
    email: email,
    password: password
  };
  usersDb[userId] = newUser;
  res.cookie("user_id", userId);
  //console.log(`register a new user: { ${userId} : ${userEmail}, ${userPassword} }`);
  //console.log(usersDb); // check if new user was registered
  res.redirect("/urls");
});

// get username
app.get("/login", (req, res) => {
  const templateVars = {
    id: req.body.id,
    email: req.body.email,
    password: req.body.password
  };
  res.render("user_login", templateVars);
});

// user login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  //console.log(email, password);
  // find user in users
  const user = findUserByEmail(usersDb, email);
  if (user.password !== password) {
    return res.status(403);
  }
  const userId = user.id;
  res.cookie("user_id", userId);
  res.redirect("/urls");
});

// user logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/");
});

// CRUD

// new created url
app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = usersDb[userId];
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

// show url page
app.get("/urls/:id", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = usersDb[userId];
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user };
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