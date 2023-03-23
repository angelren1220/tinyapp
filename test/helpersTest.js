const { assert } = require('chai');

const {
  generateRandomString,
  findUserByEmail,
  urlsForUser
} = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const testUrls = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  lei82G: {
    longURL: "https://www.lighthouselabs.ca",
    userID: "skwuxl"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  }
};

describe('generateRandomString', function() {
  it('should return a string with needed length', function() {
    const stringLength = generateRandomString(6).length;
    const expectedLength = 6;
    assert.strictEqual(stringLength, expectedLength);
  });
});

describe('findUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = findUserByEmail(testUsers, "user@example.com");
    const expectedUserID = "userRandomID";
    // Write your assert statement here
    assert.strictEqual(user.id, expectedUserID);
  });

  it('should return undefined with invalid email', function() {
    const user = findUserByEmail(testUsers, "not@example.com");
    const expectedUser = undefined;
    // Write your assert statement here
    assert.strictEqual(user, expectedUser);
  });
});

describe('urlsForUser', function() {
  it('should return all urls associated with userId with valid usrId', function() {
    const urls = urlsForUser(testUrls, "aJ48lW");
    const expectedUrls = {
      b6UTxQ: {
        longURL: "https://www.tsn.ca",
        userID: "aJ48lW",
      },
      i3BoGr: {
        longURL: "https://www.google.ca",
        userID: "aJ48lW",
      }
    };
    // Write your assert statement here
    assert.deepEqual(urls, expectedUrls);
  });

  it('should return empty object with invalid userId', function() {
    const urls = urlsForUser(testUsers, "hello12");
    const expectedUrls = {};
    // Write your assert statement here
    assert.deepEqual(urls, expectedUrls);
  });
});