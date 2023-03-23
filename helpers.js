/** functions */
// generate a string of n random alphnumeric characters
const generateRandomString = function(strLen) {
  let randomString = Math.random().toString(36).substring(2, strLen + 2);
  return randomString;
};

// find user with email and return user
const findUserByEmail = function(database, email) {
  for (const userId in database) {
    const user = database[userId];
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

module.exports = {
  generateRandomString,
  findUserByEmail,
  urlsForUser
};