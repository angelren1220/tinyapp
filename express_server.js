const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const methodOverride = require('method-override');
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
}));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

/** server methods */
// root page
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// show urls
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDb[userId];

  // if user is logged in, show user's urls
  if (user) {
    const urls = urlsForUser(urlDatabase, userId);
    const templateVars = { urls, user };
    return res.render("urls_index", templateVars);
  }

  // if user is not logged in, render null
  const templateVars = { urls: null, user };

  res.render("urls_index", templateVars);
});
// Authentication

// register page
app.get("/register", (req, res) => {
  // if user is logged in, redirect to url
  const userId = req.session.user_id;
  const user = usersDb[userId];
  if (user) {
    return res.redirect("/urls");
  }

  // otherwise create a new user template
  const templateVars = {
    id: req.body.id,
    email: req.body.email,
    password: req.body.password,
    user
  };

  res.render("user_register", templateVars);
});

// register a new user
app.post("/register", (req, res) => {
  // create a new id and get all info of new user
  const stringLength = 12;
  const userId = generateRandomString(stringLength);
  const email = req.body["email"];
  const password = req.body["password"];

  // if either email or password is empty string, send 400
  if (!(email && password)) {
    return res.status(400).send("Cannot register with empty string! <a href='/register'>back</a>");
  }

  // if email is already registered, send 400
  if (findUserByEmail(usersDb, email)) {
    return res.status(400).send("Email is already registered! <a href='/register'>back</a>");
  }

  // encrypt password
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: userId,
    email: email,
    password: hashedPassword
  };

  // add new user to database
  usersDb[userId] = newUser;

  // set cookie session for userId
  req.session.user_id = userId;
  res.redirect("/urls");
});

// get user
app.get("/login", (req, res) => {
  // if user is logged in, redirect to url
  const userId = req.session.user_id;
  const user = usersDb[userId];
  if (user) {
    return res.redirect("/urls");
  }

  // otherwise create a user template
  const templateVars = {
    id: req.body.id,
    email: req.body.email,
    password: req.body.password,
    user
  };

  res.render("user_login", templateVars);
});

// user login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // find user in users database
  const user = findUserByEmail(usersDb, email);

  // if cannot find user or password is wrong, send 403
  if (!(user && bcrypt.compareSync(password, user.password))) {
    return res.status(403).send("Invalid login! <a href='/login'>back</a>");
  }

  // user found and password is correct, set cookie session for user id
  const userId = user.id;

  req.session.user_id = userId;
  res.redirect("/urls");
});

// user logout
app.post("/logout", (req, res) => {
  // set user_id to null for now, may change in future for view times
  req.session.user_id = null;
  res.redirect("/login");
});

// CRUD
// new url page
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDb[userId];
  // if user is not logged in,redirect to login 
  if (!user) {
    return res.redirect("/login");
  }

  const templateVars = { user };

  res.render("urls_new", templateVars);
});

// show url page
app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDb[userId];
  // if user is not logged in,redirect to login 
  if (!user) {
    return res.status(403).send("Please login to see information. <a href='/login'>Login</a>");
  }

  const id = req.params.id;

  // if id (short url) not exists, send 404
  if (!(id in urlDatabase)) {
    return res.status(404).send("URL not found! <a href='/urls'>back</a>");
  }

  const urlInfo = urlDatabase[id];

  // if user does not own this url, send 403
  if (urlInfo.userID !== userId) {
    return res.status(403).send("You do not own this url. <a href='/urls'>back</a>");
  }

  // show view times
  let totalViewTimes = req.session.total_view_times;

  const templateVars = {
    id: id,
    longURL: urlInfo.longURL,
    user,
    totalViewTimes
  };

  res.render("urls_show", templateVars);
});

// redirect to long url
app.get("/u/:id", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDb[userId];
  // if user is not logged in,redirect to login 
  if (!user) {
    return res.status(403).send("Please login to see information. <a href='/login'>Login</a>");
  }

  const id = req.params.id;
  const urlInfo = urlDatabase[id];
  const longURL = urlInfo.longURL;

  // count total viewed times
  // total viewed: if first time view, set total_view_times = 1
  if (!req.session.total_view_times) {
    req.session.total_view_times = 1;
  } else {
    req.session.total_view_times++;
  }

  res.redirect(longURL);
});

// create new url
app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDb[userId];
  // if user is not logged in,redirect to login 
  if (!user) {
    return res.status(403).send("Login to shorten URLs. <a href='/login'>Login</a>");
  }

  // create a short url
  const stringLength = 6;
  const id = generateRandomString(stringLength);
  
  // add this url to database
  const longURL = req.body.longURL;
  urlDatabase[id] = { longURL: longURL, userID: userId };

  res.redirect(`/urls/${id}`);
});

// delete url
app.delete("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDb[userId];
  // if user is not logged in,redirect to login 
  if (!user) {
    return res.status(403).send("Login to delete URLs. <a href='/login'>Login</a>");
  }

  const id = req.params.id;
  // if id (short url) not exists, send 404
  if (!(id in urlDatabase)) {
    return res.status(404).send("URL not found. <a href='/urls'>back</a>");
  }

  const urlInfo = urlDatabase[id];
  // if user does not own this url, send 403
  if (urlInfo.userID !== userId) {
    return res.status(403).send("You do not own this url. <a href='/urls'>back</a>");
  }

  delete urlDatabase[id];
  res.redirect("/urls");
});

// edit url
app.put("/urls/:id", (req, res) => {

  const userId = req.session.user_id;
  const user = usersDb[userId];
  // if user is not logged in,redirect to login 
  if (!user) {
    return res.status(403).send("Login to edit URLs. <a href='/login'>Login</a>");
  }

  const id = req.params.id;

  // if id (short url) not exists, send 404
  if (!(id in urlDatabase)) {
    return res.status(404).send("URL not found. <a href='/urls'>back</a>");
  }

  const urlInfo = urlDatabase[id];
  // if user does not own this url, send 403
  if (urlInfo.userID !== userId) {
    return res.status(403).send("You do not own this url. <a href='/urls'>back</a>");
  }

  // update url in database
  const longURL = req.body.longURL;
  urlDatabase[id].longURL = longURL;

  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Tinny app listening on port ${PORT} 😊!`);
});