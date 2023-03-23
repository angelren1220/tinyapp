const express = require("express");
const cookieSession = require('cookie-session')
const bcrypt = require("bcryptjs");
const {
  generateRandomString,
  findUserByEmail,
  urlsForUser
} = require("./helpers");
const { urlDatabase, usersDb } = require("./database");

/** server setup */
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ["My cat is named Oreo"],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))
app.use(express.urlencoded({ extended: true }));

/** server methods */
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// show urls
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  
  // if user is logged in, display urls
  if (userId) {
    const user = usersDb[userId];
    const urls = urlsForUser(urlDatabase, userId);
    const templateVars = { urls, user };
    return res.render("urls_index", templateVars);
  }
  
  const templateVars = { urls: null, user: null };
  
  res.render("urls_index", templateVars);
});
// Authentication

// register page
app.get("/register", (req, res) => {
  // if user is logged in, redirect to url
  const userId = req.session.user_id;
  if (userId) {
    return res.redirect("/urls");
  }

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
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: userId,
    email: email,
    password: hashedPassword
  };
  
  usersDb[userId] = newUser;
  
  req.session.user_id = userId;
  res.redirect("/urls");
});

// get user
app.get("/login", (req, res) => {
  // if user is logged in, redirect to url
  const userId = req.session.user_id;
  if (userId) {
    return res.redirect("/urls");
  }

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
 
  // find user in users
  const user = findUserByEmail(usersDb, email);
  
  // cannot find user, send 403
  if (!user) {
    return res.status(403).send("Could not find the user with email!");
  }
  
  // is user if found but password is wrong, send 403
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Wrong password!");
  }
  
  const userId = user.id;
  
  req.session.user_id = userId;
  res.redirect("/urls");
});

// user logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// CRUD

// new created url
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  
  // if user is not logged in,redirect to login 
  if (!userId) {
    return res.redirect("/login");
  }

  const user = usersDb[userId];
  const templateVars = { user };
  
  res.render("urls_new", templateVars);
});

// show url page
app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  
  // if user is not logged in,redirect to login 
  if (!userId) {
    return res.redirect(403, "/login");
  }

  const user = usersDb[userId];
  const id = req.params.id;

  // if id (short url) not exists, send 404
  if (!(id in urlDatabase)) {
    return res.status(404).send("URL not found");
  }

  const urlInfo = urlDatabase[id];
  
  // if user does not own this url, send 403
  if(urlInfo.userID !== userId) {
    return res.status(403).send("You do not own this url.");
  }

  const templateVars = { id: id, longURL: urlInfo.longURL, user };
 
  res.render("urls_show", templateVars);
});

// redirect to long url
app.get("/u/:id", (req, res) => {
  const userId = req.session.user_id;
  
  // if user is not logged in,redirect to login 
  if (!userId) {
    return res.redirect(403, "/login");
  }
  
  const id = req.params.id;
  const urlInfo = urlDatabase[id];
  const longURL = urlInfo.longURL;
  
  res.redirect(longURL);
});

// create new url
app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  
  // if user is not logged in,redirect to login 
  if (!userId) {
    return res.status(403).send("Login to shorten URLs.");
  }

  const stringLength = 6;
  const id = generateRandomString(stringLength);
  const longURL = req.body.longURL;
 
  urlDatabase[id] = { longURL: longURL, userID: userId };

  res.redirect(`/urls/${id}`);
});

// delete url
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.user_id;
  // if user is not logged in,redirect to login 
  if (!userId) {
    return res.status(403).send("Login to delete URLs.");
  }

  const id = req.params.id;
  // if id (short url) not exists, send 404
  if (!(id in urlDatabase)) {
    return res.status(404).send("URL not found");
  }

  const urlInfo = urlDatabase[id];
  // if user does not own this url, send 403
  if(urlInfo.userID !== userId) {
    return res.status(403).send("You do not own this url.");
  }

  delete urlDatabase[id];
  res.redirect("/urls");
});

// edit url
app.post("/urls/:id/edit", (req, res) => {
  const userId = req.session.user_id;
  // if user is not logged in,redirect to login 
  if (!userId) {
    return res.status(403).send("Login to edit URLs.");
  }
  
  const id = req.params.id;

  // if id (short url) not exists, send 404
  if (!(id in urlDatabase)) {
    return res.status(404).send("URL not found");
  }

  const urlInfo = urlDatabase[id];
  // if user does not own this url, send 403
  if(urlInfo.userID !== userId) {
    return res.status(403).send("You do not own this url.");
  }

  const longURL = req.body.longURL;
  urlDatabase[id].longURL = longURL;

  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Tinny app listening on port ${PORT} 😊!`);
});