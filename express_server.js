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
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
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

// returns the URLs where the userID === id of the currently logged-in user
const urlsForUser = function(database, userId) {
  const urls = {};
  for (const url in database) {
    if (database[url].userID === userId) {
      const shortUrl = url;
      const longUrl = database[url].longURL;
      urls[shortUrl] = { longURL: longUrl, userID: userId };
    }
  }
  return urls;
};

/** server methods */
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// show urls
app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  // if user is logged in, display urls
  if (req.cookies["user_id"]) {
    const user = usersDb[userId];
    const urls = urlsForUser(urlDatabase, userId);
    const templateVars = { urls, user };
    return res.render("urls_index", templateVars);
  }
  const templateVars = { urls: undefined, user: undefined };
  res.render("urls_index", templateVars);
});
// Authentication

// register page
app.get("/register", (req, res) => {
  // if user is logged in, redirect to url
  if (req.cookies["user_id"]) {
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

// get user
app.get("/login", (req, res) => {
  // if user is logged in, redirect to url
  if (req.cookies["user_id"]) {
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
  //console.log(email, password);
  // find user in users
  const user = findUserByEmail(usersDb, email);
  // cannot find user, send 403
  if (!user) {
    return res.status(403).send("Could not find the user with email!");
  }
  // is user if found but password is wrong, send 403
  if (user.password !== password) {
    return res.status(403).send("Wrong password!");
  }
  const userId = user.id;
  res.cookie("user_id", userId);
  res.redirect("/urls");
});

// user logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// CRUD

// new created url
app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
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
  const userId = req.cookies["user_id"];
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
  const templateVars = { id: id, longURL: urlInfo.longURL, user };
  res.render("urls_show", templateVars);
});

// redirect to long url
app.get("/u/:id", (req, res) => {
  const userId = req.cookies["user_id"];
  // if user is not logged in,redirect to login 
  if (!userId) {
    return res.redirect("/login");
  }
  const id = req.params.id;
  const urlInfo = urlDatabase[id];
  const longURL = urlInfo.longURL;
  res.redirect(longURL);
});

// create new url
app.post("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  // if user is not logged in,redirect to login 
  if (!userId) {
    return res.status(403).send("Login to shorten URLs.");
  }

  const stringLength = 6;
  const id = generateRandomString(stringLength);
  const longURL = req.body.longURL;
  urlDatabase[id] = { longURL: longURL, userID: userId };
  // console.log(`create a new url: { ${id} : ${longURL} }`); // log the post request body to the console
  res.redirect(`/urls/${id}`);
});

// delete url
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.cookies["user_id"];
  // if user is not logged in,redirect to login 
  if (!userId) {
    return res.status(403).send("Login to delete URLs.");
  }

  const id = req.params.id;
  // console.log(`delete an exist url: { ${req.params.id} : ${urlDatabase[id]} }`);
  delete urlDatabase[id];
  res.redirect("/urls");
});

// edit url
app.post("/urls/:id/edit", (req, res) => {
  const userId = req.cookies["user_id"];
  // if user is not logged in,redirect to login 
  if (!userId) {
    return res.status(403).send("Login to edit URLs.");
  }
  const id = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[id].longURL = longURL;
  // console.log(`update a new url: { ${id} : ${longURL} }`);
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Tinny app listening on port ${PORT} 😊!`);
});