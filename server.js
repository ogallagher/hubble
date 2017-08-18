var express = require("express");
var app = express();

var jsonPostParser = require("body-parser").json();

var nodemailer = require("nodemailer");
var transporter = nodemailer.createTransport({
                                             service: "gmail",
                                             auth: {
                                                user: "hubbleojpgapps@gmail.com",
                                                pass: "pBC-6DT-hwN-UxG"
                                             }
                                             });

var fs = require("fs");

var games = require("./games.json");
var accounts = require("./accounts.json");
var submissions = require("./submissions.json");

/*
 ORDER
 A  B  C  D  E  F  G  H  I  J  K  L  M  N  O  P  Q  R  S  T  U  V  W  X  Y  Z  0  1  2  3  4  5  6  7  8  9
 1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36
 
 games.byName lists the games according to game.name
 
     Doodle Jump:   04
     Flappy Bird:   06
     Karnage:       11
     Paper IO:      16
     Shuffle:       19 08
     Slither:       19 12
     Wings:         23
     Zball 5:       26
 
 games.byRating lists the games according to game.rating, and then game.index
 
     2 Karnage:         5
     3 Paper IO:        5
     4 Shuffle:         5
     0 Doodle Jump:     4
     5 Slither:         4
     6 Wings:           3
     1 Flappy Bird:     2
     7 Zball 5:         2
*/

var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ip = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";

var RESULT_MAX = 10; //the number of search results will not exceed RESULT_MAX
var alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
var emailTemplate = {
    from: "hubble <hubbleojpgapps@gmail.com>",
    subject: "Hubble Account Information"
};
var serverDirectoryPath = process.env.OPENSHIFT_REPO_DIR + "/";

app.use(express.static("public"));

app.get("/search", function(request,response) {
        //search games.json by name and tags
        var searchTerms = request.query.terms;
        var resultNames = [];
        var resultTags = [];
        var result = {
            message: "",
            name: null,
            tags: null
        };
        
        function nextResults(counter) {
            if (counter<searchTerms.length && (resultNames.length<RESULT_MAX || resultTags.length<RESULT_MAX)) {
                if (searchTerms[counter].length > 0) {
                    var gamesByName = searchGamesByName(searchTerms[counter],RESULT_MAX-resultNames.length,true);  //name search
                    var gamesByTag = searchGamesByTag(searchTerms[counter],RESULT_MAX-resultTags.length);  //tag search
        
                    function nextGameByTag(tagCounter) {
                        if (tagCounter < gamesByTag.length) {
                            if (resultTags.indexOf(gamesByTag[tagCounter]) == -1) {
                                fs.readFile("./game_icons/" + gamesByTag[tagCounter].name + ".png", function(err, data) {
                                    var iconData = "";
                                            
                                    if (err) {
                                        result.message = "ERROR:read";
                                    }
                                    else {
                                        iconData = "data:image/png;base64," + (new Buffer(data)).toString("base64");
                                    }
                                        
                                    var game = {
                                        name: gamesByTag[tagCounter].name,
                                        authors: gamesByTag[tagCounter].authors,
                                        description: gamesByTag[tagCounter].description,
                                        tags: gamesByTag[tagCounter].tags,
                                        rating: gamesByTag[tagCounter].rating,
                                        reviews: gamesByTag[tagCounter].reviews,
                                        featured: gamesByTag[tagCounter].featured,
                                        url: gamesByTag[tagCounter].url,
                                        icon: iconData
                                    }
                                    
                                    resultTags.push(game);
                                    
                                    nextGameByTag(tagCounter+1);
                                });
                            }
                            else {
                                nextGameByTag(tagCounter+1);
                            }
                        }
                        else {
                            nextResults(counter+1);
                        }
                    }
        
                    function nextGameByName(nameCounter) {
                        if (nameCounter < gamesByName.length) {
                            if (resultNames.indexOf(gamesByName[nameCounter]) == -1) {
                                fs.readFile("./game_icons/" + gamesByName[nameCounter].name + ".png", function(err, data) {
                                    var iconData = "";
                                            
                                    if (err) {
                                        result.message = "ERROR:read";
                                    }
                                    else {
                                        iconData = "data:image/png;base64," + (new Buffer(data)).toString("base64");
                                    }
                                    
                                    var game = {
                                        name: gamesByName[nameCounter].name,
                                        authors: gamesByName[nameCounter].authors,
                                        description: gamesByName[nameCounter].description,
                                        tags: gamesByName[nameCounter].tags,
                                        rating: gamesByName[nameCounter].rating,
                                        reviews: gamesByName[nameCounter].reviews,
                                        featured: gamesByName[nameCounter].featured,
                                        url: gamesByName[nameCounter].url,
                                        icon: iconData
                                    }
                                    
                                    resultNames.push(game);
                                    
                                    nextGameByName(nameCounter+1);
                                });
                            }
                            else {
                                nextGameByName(nameCounter+1);
                            }
                        }
                        else {
                            nextGameByTag(0);
                        }
                    }
        
                    nextGameByName(0);
                }
                else {
                    nextResults(counter+1);
                }
            }
            else {
                if (result.message.length == 0) {
                    result.name = resultNames;
                    result.tags = resultTags;
                }
        
                response.send(JSON.stringify(result));
            }
        }
        
        nextResults(0);
        });

app.get("/featured", function(request,response) {
        //search games by game.featured
        var result = {
            message: "",
            games: []
        };
        
        function nextResult(counter) {
            if (counter < games.byName.length && result.games.length < RESULT_MAX) {
                if (games.byName[counter].featured) {
                    fs.readFile("./game_icons/" + games.byName[counter].name + ".png", function(err, data) {
                                var iconData = "";
                                
                                if (err) {
                                    result.message = "ERROR:read";
                                }
                                else {
                                    iconData = "data:image/png;base64," + (new Buffer(data)).toString("base64");
                                }
                                    
                                var game = {
                                    name: games.byName[counter].name,
                                    authors: games.byName[counter].authors,
                                    description: games.byName[counter].description,
                                    tags: games.byName[counter].tags,
                                    rating: games.byName[counter].rating,
                                    reviews: games.byName[counter].reviews,
                                    featured: games.byName[counter].featured,
                                    url: games.byName[counter].url,
                                    icon: iconData //the conversion of the image to a base64 string allows the image to be transferred within a JSON message
                                }
                                
                                result.games.push(game);
                                
                                nextResult(counter+1);
                                
                                });
                }
                else {
                    nextResult(counter+1);
                }
            }
            else {
                response.send(JSON.stringify(result));
            }
        }
        
        nextResult(0);
        });

app.get("/register", function(request,response) {
        //check if user already exists, check if email is valid, and return the appropriate messages
        var now = new Date();
        
        var newAccount = {
            address: request.query.account.address,
            password: request.query.account.password,
            reviews: [],
            curator: false,
            bday: {
                year: now.getFullYear(),
                month: now.getMonth() + 1,
                day: now.getDate()
            }
        }
        var foundAddress = false;
        var result = {
                        message: ""
                     };
        
        //check if user already exists
        for (var i=0; i<accounts.length && !foundAddress; i++) {
            if (newAccount.address == accounts[i].address) {
                result.message = "ERROR:many";
                foundAddress = true;
            }
        }
        
        //check if email is valid
        if (!foundAddress) {
            transporter.sendMail({
                                     from: emailTemplate.from,
                                     to: newAccount.address,
                                     subject: emailTemplate.subject,
                                     text: "Hi " + newAccount.address + ",\n\nWelcome to hubble! Since you've created an account, you will now be able to rate games and suggest the addition of new ones.\n\nSo you don't forget, here is your account information:\n\tUsername: " + newAccount.address + "\n\tPassword: " + newAccount.password + "\n\nThanks for your help!\nhttp://hubble-ojpgapps.rhcloud.com/"
                                 },
                                 function (error, info) {
                                     if (error) {
                                        result.message = "ERROR:email";
                                 
                                        response.send(JSON.stringify(result));
                                     }
                                     else {
                                        result.message = "SUCCESS";
                                 
                                        //encrypt password for newAccount
                                        newAccount.password = encrypt(newAccount.password);
                                 
                                        //add new account to accounts[]
                                        accounts.push(newAccount);
                                 
                                        //update accounts.json
                                        if (!fileAccounts()) {
                                            result.message = "ERROR:write";
                                        }
                                 
                                        response.send(JSON.stringify(result));
                                     }
                                 });
        }
        else {
            response.send(JSON.stringify(result));
        }
        });

app.get("/login", function (request,response) {
        //check that user is in accounts.json, check that accounts[i].password == proposedAccount.password, and return the appropriate messages
        var proposedAccount = request.query.account;
        var foundAddress = -1;
        var result = {
            message: "",
            reviews: [],
            curator: false,
            bday: null
        };
        
        for (var i=0; i<accounts.length && foundAddress == -1; i++) {
            if (proposedAccount.address == accounts[i].address) {
                foundAddress = i;
            }
        }
        
        if (foundAddress == -1) {
            result.message = "ERROR:gone";
            response.send(JSON.stringify(result));
        }
        else {
            var stored = accounts[foundAddress].password;
            var proposed = encrypt(proposedAccount.password,stored.substring(stored.length-8)); //length of salt = 8
        
        
            if (proposed == stored) {
                result.message = "SUCCESS";
                if (foundAddress == 0) {
                    result.message += ":admin";
                }
                result.reviews = accounts[foundAddress].reviews;
                result.curator = accounts[foundAddress].curator;
                result.bday = accounts[foundAddress].bday;
            }
            else {
                result.message = "ERROR:code";
            }
        
            response.send(JSON.stringify(result));
        }
        });

app.get("/rate", function (request,response) {
        //handle clients' requests to rate games
        var account = request.query.account;
        var newRating = parseFloat(request.query.rating);
        var result = {
            message: "",
            reviews: [],
            rating: -1
        };
        
        //find game to change (name search is the same one used in response to the /search request)
        var index = searchGamesByName(request.query.game.toLowerCase(),1,false);
        
        if (index == -1) {
            result.message = "ERROR:game";
        }
        else {
            //update game.rating and game.reviews
        
            var n = parseFloat(games.byName[index].reviews);
            var mean = parseFloat(games.byName[index].rating);
        
            if (account.reviewed == "true") {       //I think request.query objects all come in as strings, so they should be parsed individually according to what they really represent.
                //if user already has already rated this game, then newRating is the change between the previous and new ratings
                games.byName[index].rating = mean + (newRating / n);
            }
            else {
                //if user hasn't yet rated this game
        
                games.byName[index].rating = ((mean * n) + newRating) / (n+1);
                games.byName[index].reviews = n+1;
            }
        
            //update games.byRating's order to reflect games.byName[index].rating; moveGameByRating(indexByName,oldRating,newRating) returns boolean
        
            if (!moveGameByRating(index,mean,games.byName[index].rating)) {
                result.message = "ERROR:game";
            }
        }
        
        //find user in accounts[]
        var foundAddress = -1;
        
        for (var i=0; i<accounts.length && foundAddress == -1; i++) {
            if (account.address == accounts[i].address) {
                foundAddress = i;
            }
        }
        
        if (foundAddress == -1) {
            //user not found
            result.message = "ERROR:gone";
        }
        else {
            //user found; update accounts[foundAddress].reviews
            var newReview = {
                game: request.query.game,
                rating: newRating
            };
        
            if (account.reviewed == "false") {
                //add new review to user's account.reviews
                accounts[foundAddress].reviews.push(newReview);
            }
            else {
                //find review corresponding to the same game and update accounts[foundAddress].reviews[i].rating
                var foundReview = false;
                for (var i=0; i<accounts[foundAddress].reviews.length && !foundReview; i++) {
                    if (accounts[foundAddress].reviews[i].game == request.query.game) {
                        foundReview = true;
        
                        accounts[foundAddress].reviews[i].rating = parseInt(accounts[foundAddress].reviews[i].rating) + newRating;
        
                        newReview.rating = parseInt(accounts[foundAddress].reviews[i].rating);
                    }
                }
        
                if (!foundReview) {
                    //review not found
                    result.message = "ERROR:review";
                }
            }
        
            //update accounts.json
            if (!fileAccounts()) {
                result.message = "ERROR:write";
            }
        
            //update games.json
            if (!fileGames()) {
                result.message = "ERROR:write";
            }

            if (result.message.length == 0) {
                //success message
                result.message = "SUCCESS";
                result.reviews = accounts[foundAddress].reviews,
                result.rating = newReview.rating
            }
        }
        
        response.send(JSON.stringify(result));
        });

app.get("/curate", function (request,response) {
        var address = request.query.address;
        var newGame = request.query.game;
        
        var result = {
            message: ""
        }
        
        var emailSubject = "";
        var emailText = "";
        
        //find user in accounts[]
        var foundAddress = -1;
        
        for (var i=0; i<accounts.length && foundAddress == -1; i++) {
            if (address == accounts[i].address) {
                foundAddress = i;
            }
        }
        
        if (foundAddress == -1) {
            //user not found
            result.message = "ERROR:gone";
        
            response.send(JSON.stringify(result));
        }
        else {
            if (accounts[foundAddress].curator == null) {
                result.message = "ERROR:curator";
            }
            else if (!accounts[foundAddress].curator) { //add request to curate ()
                accounts[foundAddress].curator = null; //false = nothing, null = requested, true = curator
        
                if (!fileAccounts()) {
                    result.message = "ERROR:write";
                }
                else {
                    emailSubject = "New Curator: " + address;
                }
            }
            else if (newGame == null) {
                result.message = "ERROR:write";
            }
            else { //add new game submission to submissions.json
                submissions.push(newGame);
        
                if (!fileSubmissions) {
                    result.message = "ERROR:write";
                }
                else {
                    emailSubject = "New Game: " + newGame.name;
                    emailText = "Name: " + newGame.name + "\nURL: " + newGame.url + "\nAuthors: ";
                    for (var i=0; i<newGame.authors.length; i++) {
                        emailText += newGame.authors[i];
                        if (i<newGame.authors.length) {
                            emailText += ", ";
                        }
                    }
                    emailText += "\nDescription: " + newGame.description + "\nRating: " + newGame.rating + "\nTags: ";
                    for (var i=0; i<newGame.tags.length; i++) {
                        emailText += newGame.tags[i];
                        if (i<newGame.tags.length-1) {
                            emailText += ", ";
                        }
                    }
                }
            }
        
            if (result.message.length == 0) {
                transporter.sendMail({
                                         from: emailTemplate.from,
                                         to: emailTemplate.from,
                                         subject: emailSubject,
                                         text: emailText
                                     },
                                     function (error, info) {
                                         if (error) {
                                             result.message = "ERROR:email";
                                             
                                             response.send(JSON.stringify(result));
                                         }
                                         else {
                                             result.message = "SUCCESS";
                                             
                                             //update accounts.json
                                             if (!fileAccounts()) {
                                                 result.message = "ERROR:write";
                                             }
                                             
                                             //update submissions.json
                                             if (!fileSubmissions()) {
                                                 result.message = "ERROR:write";
                                             }
                                             
                                             if (result.message.length == 0) {
                                                 result.message = "SUCCESS";
                                             }
                                     
                                             response.send(JSON.stringify(result));
                                         }
                                     });
            }
            else {
                response.send(JSON.stringify(result));
            }
        }
        });

app.get("/accounts", function(request,response) {
        var result = {
            file: accounts
        }
                    
        response.send(JSON.stringify(result));
        });

app.post("/accounts_new", jsonPostParser, function(request,response) {
         var result = {
             message: ""
         };
         
         fs.writeFile(serverDirectoryPath + "accounts.json", request.body.file, "utf8", function(err) {
                      if (err) {
                          result.message = "ERROR:write";
                      
                          response.send(JSON.stringify(result));
                      }
                      else {
                          result.message = "SUCCESS";
                      
                          accounts = JSON.parse(request.body.file);
                      
                          response.send(JSON.stringify(result));
                      }
                      });
         });

app.get("/games_replace", function(request,response) {
        var result = {
            file: games
        }
        
        response.send(JSON.stringify(result));
        });

app.post("/games_replace_new", jsonPostParser, function(request,response) {
         var result = {
             message: ""
         };
         
         fs.writeFile(serverDirectoryPath + "games.json", request.body.file, "utf8", function(err) {
                      if (err) {
                          result.message = "ERROR:write";
                          
                          response.send(JSON.stringify(result));
                      }
                      else {
                          result.message = "SUCCESS";
                          
                          games = JSON.parse(request.body.file);
                          
                          response.send(JSON.stringify(result));
                      }
                      });
        });

var server = app.listen(port,ip);

//name search
function searchGamesByName(searchName,resultMax,completeReturn) {
    var start = alphabet.indexOf(searchName.charAt(0));
    start = Math.round((start / alphabet.length) * games.byName.length);
    
    var away = 0;
    var stop = false;
    var stopP = false;
    var stopN = false;
    
    var result = [];
    var resultIndex = -1;
    
    while (result.length < RESULT_MAX && !stop) {
        if (!stopP && start+away < games.byName.length) {
            if (games.byName[start+away].name.toLowerCase().indexOf(searchName) > -1 && result.indexOf(games.byName[start+away]) == -1) {
                result.push(games.byName[start+away]);
                resultIndex = start+away;
            }
        }
        else {
            stopP = true;
        }
        
        if (away > 0) {
            if (!stopN && start-away >= 0) {
                if (games.byName[start-away].name.toLowerCase().indexOf(searchName) > -1 && result.indexOf(games.byName[start-away]) == -1) {
                    result.push(games.byName[start-away]);
                    resultIndex = start-away;
                }
            }
            else {
                stopN = true;
            }
        }
        
        
        if (start+away < games.byName.length-1 || start-away > 0) {
            away++;
        }
        else {
            stop = true;
        }
    }
    
    if (completeReturn) {
        return result;
    }
    else {
        return resultIndex;
    }
}

//tag search
function searchGamesByTag(searchTag,resultMax) {
    var result = [];
    
    for (var r=0; result.length < RESULT_MAX && r<games.byRating.length; r++) {
        var tagMatch = false;
        
        for (var t=0; !tagMatch && t<games.byRating[r].tags.length; t++) {
            if (games.byRating[r].tags[t].indexOf(searchTag) > -1 && result.indexOf(games.byName[games.byRating[r].index]) == -1) {
                result.push(games.byName[games.byRating[r].index]);
                tagMatch = true;
            }
        }
    }
    
    return result;
}

//the input is the index of the game to move in games.byName. This removes games.byRating[r] (where games.byRating[r].index == index) and finds a new place for it according to games.byName[index].rating
function moveGameByRating(indexByName,oldRating,newRating) {
    var result = deleteGameByRating(indexByName,oldRating);
    
    if (result) {
        addGameByRating(indexByName,newRating);
    }
    
    return result;
}

function deleteGameByRating(indexByName,rating) {
    var start = Math.round(((5-rating)/4) * games.byRating.length);
    var away = 0;
    var stop = false;
    var stopP = false;
    var stopN = false;
    var result = false;
    
    //find game where games.byRating[t].index == indexByName and remove it from games.byRating
    while (!stop) {
        if (!stopP && start+away < games.byRating.length && !result) {
            if (games.byRating[start+away].index == indexByName) {
                games.byRating.splice(start+away,1);
                result = true;
                stop = true;
            }
        }
        else {
            stopP = true;
        }
        
        if (!stopN && start-away >= 0 && !result) {
            if (games.byRating[start-away].index == indexByName) {
                games.byRating.splice(start-away,1);
                result = true;
                stop = true;
            }
        }
        else {
            stopN = true;
        }
        
        away++;
    }
    
    return result;
}

//this appends a new game to games.byName lexicographically, ¿and then to games.byRating by rating+index?
function addGameByName() {
    
}

//this appends a new game to games.byRating according to game.rating
function addGameByRating(indexByName,rating) {
    var location = Math.round(((5-rating)/4) * games.byRating.length);
    var stop = false;
    
    var game = {
        tags: games.byName[indexByName].tags,
        index: indexByName
    }
    
    var left = null;
    var right = null;
    
    if (location > 0) {
        left = games.byName[games.byRating[location-1].index];
    }
    else {
        left = games.byName[indexByName];
    }
    if (location < games.byRating.length) {
        right = games.byName[games.byRating[location].index];
    }
    else {
        right = games.byName[indexByName];
    }
    
    while ((location < games.byRating.length) && ((left.rating > rating && right.rating > rating) || (right.rating == rating && games.byRating[location].index < indexByName))) {
        location++;
        
        left = games.byName[games.byRating[location-1].index];
        if (location < games.byRating.length) {
            right = games.byName[games.byRating[location].index];
        }
        else {
            right = games.byName[indexByName];
        }
    }
    
    while ((location > 0) && ((left.rating < rating && right.rating < rating) || (left.rating == rating && games.byRating[location-1].index > indexByName))) {
        location--;
        
        if (location > 0) {
            left = games.byName[games.byRating[location-1].index];
        }
        else {
            left = games.byName[indexByName];
        }
        right = games.byName[games.byRating[location].index];
    }
    
    games.byRating.splice(location,0,game); //splice(location,#_delete,[insert_1,insert_2,...])
}

//update games.json to match games
function fileGames() {
    var result = true;
    
    fs.writeFile(serverDirectoryPath + "games.json", JSON.stringify(games), function(err) {
                 if (err) {
                     result = false;
                 }
    });
    
    return result;
}

//update accounts.json to match accounts
function fileAccounts() {
    var result = true;
    
    fs.writeFile(serverDirectoryPath + "accounts.json", JSON.stringify(accounts), function(err) {
                 if (err) {
                     result = false;
                 }
    });
    
    return result;
}

function fileSubmissions() {
    var result = true;
    
    fs.writeFile(serverDirectoryPath + "submissions.json", JSON.stringify(submissions), function(err) {
                 if (err) {
                     result = false;
                 }
                 });
    
    return result;
}

function encrypt(input,seed) {
    var available = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()[]{}<>-+=/|\\,.?~;:"; //no spaces allowed
    var salt = "";
    
    if (seed == null) {
        for (var i=0; i<8; i++) {
            salt += available.charAt(Math.round(Math.random() * available.length));
        }
    }
    else {
        salt = seed;
    }
    
    var encrypted = input + salt;
    
    var bits = "";
    
    for (var i=0; i<encrypted.length; i++) {
        var byte = encrypted.charCodeAt(i).toString(2);
        
        while (byte.length < 8) {
            byte = "0" + byte;
        }
        
        bits += byte + " ";
    }
    bits = bits.substring(0,bits.length-1);
    
    for (var i=0; i<bits.length; i++) {
        if ((i%9 == 4 || i%9 == 6) && bits.charAt(i) != " ") { //the bit alternation placement ensures that the output characters are still within my available characters
            if (bits.charAt(i) == "0") {
                bits = bits.substring(0,i) + "1" + bits.substring(i+1);
            }
            else {
                bits = bits.substring(0,i) + "0" + bits.substring(i+1);
            }
        }
    }
    
    var start = 0;
    encrypted = "";
    
    while (start < bits.length) {
        var end = bits.indexOf(" ",start);
        
        if (end == -1) {
            end = bits.length;
        }
        
        var byte = bits.substring(start,end);
        var character = String.fromCharCode(parseInt(byte,2));
        
        encrypted += character;
        
        start = end+1;
    }
    
    encrypted += salt;
    
    return encrypted;
}