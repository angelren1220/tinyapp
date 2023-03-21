const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// generate a string of 6 random alphnumeric characters
// a-Z: 65-122; 0-9: 48-57
const generateRandomString = function() {
  let randomString = "";
  for(let i = 0; i < 6; i++) {
    const numOrAlph = getRandomInt(0, 1);
    // char is number
    if(numOrAlph) {
      const charCode = getRandomInt(48, 57);
      const char = String.fromCharCode(charCode);
      randomString += char;
      continue;
    }
    // char is alphabet
    const lowerCaseOrUpperCase = getRandomInt(0, 1);
    // lowercase
    if(lowerCaseOrUpperCase) {
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

app.use(express.urlencoded({ extended: true }));

// app.get("/", (req, res) => {
//   res.send("Hello!");
// });

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  const id = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[id] = longURL;
  console.log(`create a new url: { ${id} : ${longURL} }`); // log the post request body to the console
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  console.log(`delete an exist url: { ${req.params.id} : ${urlDatabase[id]} }`);
  delete urlDatabase[id];
  res.redirect("/urls");
});


// app.get("/set", (req, res) => {
//   const a = 1;
//   res.send(`a = ${a}`);
//  });

// app.get("/fetch", (req, res) => {
//   res.send(`a = ${a}`);
//  });

app.listen(PORT, () => {
  console.log(`Tinny app listening on port ${PORT}!`);
});