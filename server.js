var express = require("express");
var app = express();

var nodemailer = require("nodemailer");
var transporter = nodemailer.createTransport({
                                             service: "gmail",
                                             auth: {
                                                user: "hubbleojpgapps@gmail.com",
                                                pass: "pBC-6DT-hwN-UxG"
                                             }
                                             });
var emailTemplate = {
                    from: "hubble <hubbleojpgapps@gmail.com>",
                    subject: "Hubble Account Information"
                    };

var fs = require("fs");

var games = require("./games.json");
var accounts = require("./accounts.json");
/*
 
 ORDER
 A  B  C  D  E  F  G  H  I  J  K  L  M  N  O  P  Q  R  S  T  U  V  W  X  Y  Z  0  1  2  3  4  5  6  7  8  9
 1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36
 
 games.byName lists the games according to game.name
 
     Doodle Jump:   04
     Flappy Bird:   06
     Karnage:       11
     Shuffle:       19 08
     Slither:       19 12
     Wings:         23
     Zball 5:       26
 
 games.byRating lists the games according to game.rating
 
     2 Karnage:         5
     3 Shuffle:         5
     0 Doodle Jump:     4
     4 Slither:         4
     5 Wings:           3
     1 Flappy Bird:     2
     6 Zball 5:         2
 
*/

var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ip = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";

var RESULT_MAX = 10; //the number of search results will not exceed RESULT_MAX
var alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";

app.use(express.static("public"));

app.get("/search", function(request,response) {
        //search games.json by name and tags
        var searchTerms = request.query.terms;
        var resultNames = [];
        var resultTags = [];
        
        for (var i=0; i<searchTerms.length && (resultNames.length<RESULT_MAX || resultTags.length<RESULT_MAX); i++) {
            if (searchTerms[i].length > 0) {
                //name search
                var gamesByName = searchGamesByName(searchTerms[i],RESULT_MAX-resultNames.length,true);
        
                for (var g=0; g<gamesByName.length; g++) {
                    resultNames.push(gamesByName[g]);
                }
        
                //tag search
                var gamesByTag = searchGamesByTag(searchTerms[i],RESULT_MAX-resultTags.length);
        
                for (var g=0; g<gamesByTag.length; g++) {
                    resultTags.push(gamesByTag[g]);
                }
            }
        }
        
        var result = {
                        name: resultNames,
                        tags: resultTags
                     };
        
        response.send(JSON.stringify(result));
        
        });

app.get("/featured", function(request,response) {
        //search games by game.featured
        var result = [];
        
        for (var i=0; i<games.byName.length && result.length < RESULT_MAX; i++) {
            if (games.byName[i].featured === "y") {
                result.push(games.byName[i]);
            }
        }
        
        response.send(JSON.stringify(result));
        });

app.get("/register", function(request, response) {
        //check if user already exists, check if email is valid, and return the appropriate messages
        var newAccount = {
            address: request.query.account.address,
            password: request.query.account.password,
            reviews: []
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
                                 
                                        //update accounts.json to match accounts[]
                                        fs.writeFile("accounts.json", JSON.stringify(accounts), function(err) {
                                                        if (err) {
                                                            throw err;
                                                            result.message = "ERROR:write";
                                                        }
                                                        response.send(JSON.stringify(result));
                                                    });
                                     }
                                 });
        }
        else {
            response.send(JSON.stringify(result));
        }
        });

app.get("/login", function (request, response) {
        //check that user is in accounts.json, check that accounts[i].password == proposedAccount.password, and return the appropriate messages
        var proposedAccount = request.query.account;
        var foundAddress = -1;
        var result = {
            message: "",
            reviews: []
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
                result.reviews = accounts[foundAddress].reviews;
            }
            else {
                result.message = "ERROR:code";
            }
        
            response.send(JSON.stringify(result));
        }
        });

app.get("/rate", function (request, response) {
        //handle clients' requests to rate games
        var account = request.query.account;
        var newRating = parseFloat(request.query.rating);
        
        //find game to change (name search is the same one used in response to the /search request)
        var index = searchGamesByName(request.query.game,1,false);
        
        //update game.rating and game.reviews
        if (account.reviewed == "true") {       //I think request.query objects all come in as strings, so they should be parsed individually according to what they really represent.
            //if user already has already rated this game, then newRating is the change between the previous and new ratings
            games.byName[index].rating = parseFloat(games.byName[index].rating) + (newRating / parseFloat(games.byName[index].reviews));
        }
        else {
            //if user hasn't yet rated this game
            games.byName[index].rating = (parseFloat(games.byName[index].rating) * parseFloat(games.byName[index].reviews) / (parseFloat(games.byName[index].reviews)+1)) + (newRating / parseFloat(games.byName[index].reviews)+1);
            games.byName[index].reviews = parseInt(games.byName[index].reviews)+1;
        }
        
        //find user in accounts[]
        var result = {
            message: "",
            reviews: [],
            rating: -1
        };
        
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
        
            //update accounts.json to match accounts[]
            fs.writeFile("accounts.json", JSON.stringify(accounts), function(err) {
                             if (err) {
                                result.message = "ERROR:write";
                             }
                         });
        
            //update games.json to match games[]
            fs.writeFile("games.json", JSON.stringify(games), function(err) {
                             if (err) {
                                 result.message = "ERROR:write";
                             }
                         });

            if (result.message.length == 0) {
                //success message
                result.message = "SUCCESS";
                result.reviews = accounts[foundAddress].reviews,
                result.rating = newReview.rating
            }
        }
        
        response.send(JSON.stringify(result));
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
    var resultIndex = 0;
    
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

function encrypt(input,seed) {
    var available = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()[]{}<>-+=/|\,.?~;:"; //no spaces allowed
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
        bits += encrypted.charCodeAt(i).toString(2) + " ";
    }
    bits = bits.substring(0,bits.length-1);
    
    for (var i=0; i<bits.length; i++) {
        if (i%3 > 0 && bits.charAt(i) != " ") {
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
        
        encrypted += String.fromCharCode(parseInt(byte,2));
        
        start = end+1;
    }
    
    encrypted += salt;
    
    return encrypted;
}