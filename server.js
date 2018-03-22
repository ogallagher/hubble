var express = require("express");
var app = express();

var jsonPostParser = require("body-parser").json({limit:"50mb"}); //the object argument with a 50mb limit attribute allows clients to emit icon files via POST

var nodemailer = require("nodemailer");
var transporter = nodemailer.createTransport({
                                             service: "gmail",
                                             auth: {
                                                user: "hubbleojpgapps@gmail.com",
                                                pass: "pBC-6DT-hwN-UxG"
                                             }
                                             });

var fs = require("fs");

var dataDirectoryPath = "/data/";  //path to data files that won't be overwritten

try {
    var games = require(dataDirectoryPath + "games.json");
    var accounts = require(dataDirectoryPath + "accounts.json");
    var submissions = require(dataDirectoryPath + "submissions.json");
}
catch (error) { //JSON files failed to load; creating database from local copy in the persistent directory
    games = require("./games.json");
    accounts = require("./accounts.json");
    submissions = require("./submissions.json");
    fileGames();
    fileAccounts();
    fileSubmissions();
}


/*
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

var port = process.env.HUBBLE_SERVICE_PORT || 8080;
var ip = process.env.HOSTNAME || "127.0.0.1";

var RESULT_MAX = 30; //the number of search results will not exceed RESULT_MAX
var ADMIN_ADDRESS = "hubbleojpgapps@gmail.com";
var alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
var emailTemplate = {
    from: "hubble <hubbleojpgapps@gmail.com>",
    registerSubject: "Hubble Account Information",
    curatorSubject: "New Curator: ",
    submissionSubject: "New Game: * from ",
    additionSubject: "Submission Accepted for ",
    applicationSubject: "Hubble Curation Request Sent"
};
var registerEmail = null;
var applicationEmail = null;
var curatorEmail = null;
var additionEmail = null;

var serverDirectoryPath = "/opt/app-root/src/"; //$pwd in openshift remote shell to hubble's server pod

var shuffleUrl = "http://shuffle-shuffle.193b.starter-ca-central-1.openshiftapps.com/";

app.use(express.static("public"));

//RENDER EMAIL TEMPLATES INFORMATION
fs.readFile("./email_resources/registration.html", "utf-8", function(err, data) {
            if (err) {
                console.log("Couldn't read registration.html email content!");
            }
            else {
                registerEmail = data;
            
                fs.readFile("./email_resources/network1.png", "base64", function(err,data) {
                            if (err) {
                                registerEmail = registerEmail.replace(/(<img.*>)/,"http://hubblegames.site/"); //replace image link with text link
                            }
                            else {
                                registerEmail = registerEmail.replace("((logo))","data:image/png;base64," + data); //fill in image link
                            }
                            });
            }
            });

fs.readFile("./email_resources/application.html", "utf-8", function(err, data) {
            if (err) {
                console.log("Couldn't read application.html email content!");
            }
            else {
                applicationEmail = data;
                
                fs.readFile("./email_resources/network1.png", "base64", function(err,data) {
                            if (err) {
                                applicationEmail = applicationEmail.replace(/(<img.*>)/,"http://hubblegames.site/");
                            }
                            else {
                                applicationEmail = applicationEmail.replace("((logo))","data:image/png;base64," + data);
                            }
                            });
            }
            });

fs.readFile("./email_resources/curator.html", "utf-8", function(err, data) {
            if (err) {
                console.log("Couldn't read curator.html email content!");
            }
            else {
                curatorEmail = data;
                
                fs.readFile("./email_resources/network1.png", "base64", function(err,data) {
                            if (err) {
                                curatorEmail = curatorEmail.replace(/(<img.*>)/,"http://hubblegames.site/");
                            }
                            else {
                                curatorEmail = curatorEmail.replace("((logo))","data:image/png;base64," + data);
                            }
                            });
            }
            });

fs.readFile("./email_resources/addition.html", "utf-8", function(err, data) {
            if (err) {
                console.log("Couldn't read addition.html email content!");
            }
            else {
                additionEmail = data;
                
                fs.readFile("./email_resources/network1.png", "base64", function(err,data) {
                            if (err) {
                                additionEmail = additionEmail.replace(/(<img.*>)/,"http://hubblegames.site/");
                            }
                            else {
                                additionEmail = additionEmail.replace("((logo))","data:image/png;base64," + data);
                            }
                            });
            }
            });


//SEARCH HANDLER
var searchTerms = null;
var resultNames = [];
var resultTags = [];
var resultAccounts = [];
var result = null;

var gamesByName = null;
var gamesByTag = null;
var accountsByAddress = null;

var responseObject = null;

function nextGameByTag(counter,tagCounter,isSearch) {
    if (tagCounter < gamesByTag.length) {
        var found = false;
        
        for (var i=0; i<resultTags.length && !found; i++) {
            if (resultTags[i].name == gamesByTag[tagCounter].name) {
                found = true;
            }
        }
        
        if (!found) {
            fs.readFile(dataDirectoryPath + "game_icons/" + gamesByTag[tagCounter].name + ".png", function(err, data) {
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
                        
                        console.log("\t\t" + game.name);
                        resultTags.push(game);
                        
                        nextGameByTag(counter,tagCounter+1,isSearch);
                        });
        }
        else {
            nextGameByTag(counter,tagCounter+1,isSearch);
        }
    }
    else {
        nextResults(counter+1,isSearch);
    }
}

function nextGameByName(counter,nameCounter,isSearch,proceedToTags) {
    if (nameCounter < gamesByName.length) {
        var found = false;
        
        for (var i=0; i<resultNames.length && !found; i++) {
            if (resultNames[i].name == gamesByName[nameCounter].name) {
                found = true;
            }
        }
        
        if (!found) {
            fs.readFile(dataDirectoryPath + "game_icons/" + gamesByName[nameCounter].name + ".png", "base64", function(err, data) {
                        var iconData = "";
                        
                        if (err) {
                            result.message = "ERROR:read";
                        }
                        else {
                            iconData = "data:image/png;base64," + data;
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
                        
                        console.log("\t\t" + game.name);
                        resultNames.push(game);
                        
                        nextGameByName(counter,nameCounter+1,isSearch,proceedToTags);
                        });
        }
        else {
            nextGameByName(counter,nameCounter+1,isSearch,proceedToTags);
        }
    }
    else if (proceedToTags) {
        gamesByTag = searchGamesByTag(searchTerms[counter],RESULT_MAX-resultTags.length);  //tag search
        nextGameByTag(counter,0,isSearch);
    }
    else {
        nextResults(counter+1,isSearch);
    }
}

function nextAccountByAddress(counter,accountCounter,isSearch) {
    console.log("\tnextAccountByAddress(): counter=" + counter + " a=" + accountCounter + " isSearch=" + isSearch);
    if (accountCounter < accountsByAddress.length) {
        var found = false;
        
        for (var i=0; i<resultAccounts.length && !found; i++) {
            if (resultAccounts[i].address == accountsByAddress[accountCounter].address) {
                found = true;
            }
        }
        
        if (!found) {
            console.log("\tpush(" + accountsByAddress[accountCounter] + ")");
            resultAccounts.push(accountsByAddress[accountCounter]);
            
            nextAccountByAddress(counter,accountCounter+1,isSearch);
        }
        else {
            console.log("\t" + accountsByAddress[accountCounter] + " already in resultAccounts");
            nextAccountByAddress(counter,accountCounter+1,isSearch);
        }
    }
    else {
        nextResults(counter+1,isSearch);
    }
}

function nextResults(counter,isSearch) {
    var moreTerms = false; //there are more search terms AND there is space in the results array(s)
    
    var moreSpace = [false,false,false]; //[names,tags,accounts]
    if (isSearch) {
        moreSpace[0] = (resultNames.length < RESULT_MAX);
        moreSpace[1] = (resultTags.length < RESULT_MAX);
        
        moreTerms = (counter < searchTerms.length);
    }
    else {
        moreSpace[2] = (resultAccounts < RESULT_MAX);
        
        moreTerms = (counter < searchTerms.length);
    }
    
    console.log("nextResults(): counter=" + counter + " isSearch=" + isSearch);
    
    if (moreTerms) {
        if (searchTerms[counter].length > 0) {
            console.log("\tloading results for " + searchTerms[counter]);
            
            if (moreSpace[0]) {
                gamesByName = searchGamesByName(searchTerms[counter],RESULT_MAX-resultNames.length,true);  //name search
                nextGameByName(counter,0,isSearch,moreSpace[1]); //search games.byName (also calls nextGameByName if moreSpace[1]
            }
            else if (moreSpace[1]) {
                gamesByTag = searchGamesByTag(searchTerms[counter],RESULT_MAX-resultTags.length);  //tag search
                nextGameByTag(counter,0,isSearch); //search games.byRating
            }
            
            if (moreSpace[2]) {
                console.log("\t" + searchTerms[counter] + " is an account address...");
                accountsByAddress = searchAccounts(searchTerms[counter],RESULT_MAX-resultAccounts.length,true); //address search
                
                nextAccountByAddress(counter,0,isSearch); //search accounts
            }
        }
        else {
            nextResults(counter+1,isSearch);
        }
    }
    else {
        console.log("search complete.");
        
        if (isSearch) {
            console.log("resultNames: " + resultNames.length);
            console.log("resultTags: " + resultTags.length);
            
            result.name = resultNames;
            result.tags = resultTags;
        }
        else {
            console.log("resultAccounts: " + resultAccounts.length);
            result.address = resultAccounts;
        }
        
        responseObject.send(JSON.stringify(result));
    }
}
app.get("/search", function(request,response) {
        //search games.json by name and tags
        searchTerms = request.query.terms;
        resultNames = [];
        resultTags = [];
        result = {
            message: "",
            name: [],
            tags: []
        };
        
        responseObject = response;
        
        console.log("/search request received");
        
        nextResults(0,true); //counter,isSearch
        });

//ACCOUNTS HANDLER (SEARCH ACCOUNTS)
app.get("/accounts", function(request,response) {
        //search accounts.json by address
        searchTerms = request.query.terms;
        resultAccounts = [];
        result = {
            message: "",
            address: []
        };
        
        responseObject = response;
        
        nextResults(0,false);
        });


//FEATURED HANDLER
app.get("/featured", function(request,response) {
        //search games by game.featured
        var result = {
            message: "",
            games: []
        };
        
        function nextResult(counter) {
            if (counter < games.byName.length && result.games.length < RESULT_MAX) {
                if (games.byName[counter].featured) {
                    fs.readFile(dataDirectoryPath + "game_icons/" + games.byName[counter].name + ".png", "base64", function(err, data) {
                                var iconData = "";
                                
                                if (err) {
                                    result.message = "ERROR:read";
                                }
                                else {
                                    iconData = "data:image/png;base64," + data;
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

//RANDOM HANDLER
app.get("/random", function(request,response) {
        var result = {
            message: "",
            games: []
        }
        
        function nextRandom(previous) {
            if (previous.length < RESULT_MAX*0.5 && previous.length < games.byRating.length*0.75) {
                var index = -1;
        
                while (previous.indexOf(index) != -1) {
                    index = Math.round(Math.random() * (games.byName.length-1));
                }

                var newGame = games.byName[index];
                
                fs.readFile(dataDirectoryPath + "game_icons/" + newGame.name + ".png", "base64", function(err, data) {
                            newGame.icon = "";
                            
                            if (err) {
                                result.message = "ERROR:read";
                            }
                            else {
                                newGame.icon = "data:image/png;base64," + data;
                            }
                            
                            result.games.push(newGame);
                            previous.push(index);
                            
                            nextRandom(previous);
                            });
            }
            else {
                response.send(JSON.stringify(result));
            }
        }
        
        nextRandom([-1]);
        });

//REGISTER HANDLER
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
            var htmlEmail = registerEmail;
        
            if (htmlEmail) {
                htmlEmail = htmlEmail.replace(/\(\(username\)\)/g,newAccount.address.substring(0,newAccount.address.indexOf("@")))
                                .replace(/\(\(address\)\)/g,newAccount.address)
                                .replace(/\(\(password\)\)/g,newAccount.password);
            }
        
            transporter.sendMail({
                                     from: emailTemplate.from,
                                     to: newAccount.address,
                                     subject: emailTemplate.registerSubject,
                                     text: "Hi " + newAccount.address.substring(0,newAccount.address.indexOf("@")) + ",\n\nWelcome to hubble! Since you've created an account, you will now be able to rate games and suggest the addition of new ones.\n\nSo you don't forget, here is your account information:\n\tAccount: " + newAccount.address + "\n\tPassword: " + newAccount.password + "\n\nThanks for your help!\nhttp://hubblegames.site/\n\nPS: If you didn't mean to create an account with hubble, click here to delete your account and unsubscribe from future emails: http://hubblegames.site/accounts_remove?oldAccount=" + newAccount.address,
                                     html: htmlEmail
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
                                 
                                        function fail() {
                                            result.message = "ERROR:write";
                                            response.send(JSON.stringify(result));
                                        }
                                        function proceed() {
                                            response.send(JSON.stringify(result));
                                        }
                                        //update accounts.json
                                        fileAccounts(proceed,fail);
                                 
                                 
                                     }
                                 });
        }
        else {
            response.send(JSON.stringify(result));
        }
        });

//LOGIN HANDLER
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
                if (accounts[foundAddress].address == ADMIN_ADDRESS) {
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

//RATE HANDLER
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
        
            function accountsProceed() {
                function gamesProceed() {
                    if (result.message == "") {
                        //success message
                        result.message = "SUCCESS";
                        result.reviews = accounts[foundAddress].reviews;
                        result.rating = newReview.rating;
                    }
        
                    response.send(JSON.stringify(result));
                }
        
                function gamesFail() {
                    result.message = "ERROR:write";
                    response.send(JSON.stringify(result));
                }
        
                //update games.json
                fileGames(gamesProceed,gamesFail);
            }
        
            //update accounts.json
            fileAccounts(accountsProceed);
        }
        });

//CURATE HANDLER
app.get("/curate", function (request,response) {
        var submission = {
            curator: request.query.curator,
            game: request.query.game || null
        };
        
        var result = {
            message: ""
        }
        
        //find user in accounts[]
        var foundAddress = -1;
        
        for (var i=0; i<accounts.length && foundAddress == -1; i++) {
            if (submission.curator == accounts[i].address) {
                foundAddress = i;
            }
        }
        
        if (foundAddress == -1) {
            //user not found
            result.message = "ERROR:gone";
        
            response.send(JSON.stringify(result));
        }
        else {
            function sendEmail(emailSubject,emailDestination,emailText,htmlEmail,done) {
                if (htmlEmail) {
                    htmlEmail = htmlEmail.replace(/\(\(username\)\)/g,submission.curator);
                }
        
                transporter.sendMail({
                                         from: emailTemplate.from,
                                         to: emailDestination,
                                         subject: emailSubject,
                                         text: emailText,
                                         html: htmlEmail
                                     },
                                     function (error, info) {
                                         if (error) {
                                             result.message = "ERROR:email";
                                             
                                             response.send(JSON.stringify(result));
                                         }
                                         else if (done) {
                                             result.message = "SUCCESS";
                                             response.send(JSON.stringify(result));
                                         }
                                     });
            }
        
            if (accounts[foundAddress].curator == null) {
                result.message = "ERROR:curator";
                response.send(JSON.stringify(result));
            }
            else if (!accounts[foundAddress].curator) { //add request to curate ()
                accounts[foundAddress].curator = null; //false = nothing, null = requested, true = curator
        
                function proceed() {
                    sendEmail(emailTemplate.curatorSubject + submission.curator,emailTemplate.from,"See subject line.",null,false);
        
                    var emailText = "Hi " + submission.curator.substring(submission.curator.indexOf("@")) + ",\n\nYour request to be a curator for hubble has been sent successfully! Check back in a bit to see if you've been approved.\n\nThanks for your help!\nhttp://hubblegames.site/\n\nPS: Most anyone will get approved to curate within a day or so, when the admin reads the email request; we just like to give the requester time to delete their hubble account if it was created accidentally and such.";
                    sendEmail(emailTemplate.applicationSubject,submission.curator,emailText,applicationEmail,true);
                }
                function fail() {
                    result.message = "ERROR:write";
                    response.send(JSON.stringify(result));
                }
                fileAccounts(proceed,fail);
            }
            else if (submission.game == null) {
                result.message = "SUCCESS:true";
                response.send(JSON.stringify(result));
            }
            else { //add new game submission to submissions.json
                submission.game.id = Math.round(Math.random()*1000); //when submissions are edited, id retains identification
                submissions.push(submission);
        
                function fail() {
                    result.message = "ERROR:write";
                }
                function proceed() {
                    result.message = "SUCCESS";
        
                    var emailSubject = emailTemplate.submissionSubject.replace(/\*/, submission.game.name) + submission.curator;
        
                    var emailText = "Name: " + submission.game.name + "\nURL: " + submission.game.url + "\nAuthors: ";
                    for (var i=0; i<submission.game.authors.length; i++) {
                        emailText += submission.game.authors[i];
                        if (i<submission.game.authors.length) {
                            emailText += ", ";
                        }
                    }
                    emailText += "\nDescription: " + submission.game.description + "\nRating: " + submission.game.rating + "\nTags: ";
                    for (var i=0; i<submission.game.tags.length; i++) {
                        emailText += submission.game.tags[i];
                        if (i<submission.game.tags.length-1) {
                            emailText += ", ";
                        }
                    }
        
                    sendEmail(emailSubject,emailTemplate.from,emailText,null,true);
                }
                fileSubmissions(proceed,fail);
            }
        }
        });

//ACCOUNTS_REPLACE HANDLER
app.post("/accounts_replace", jsonPostParser, function(request,response) {
         var result = {
             message: ""
         };
         
         var newAccountAddress = request.body.newAccount.address;
         var index = searchAccounts(newAccountAddress,1,false);
         
         console.log("Updating account: " + newAccountAddress);
         
         if (index != -1) {
             var approved = false;
         
             if (!accounts[index].curator && request.body.newAccount.curator) {
                 approved = true;
             }
         
             accounts.splice(index,1,request.body.newAccount);
         
             function proceed() {
                 console.log("CURATOR APPROVED: " + approved);
         
                 if (approved) {
                     var accountName = newAccountAddress.substring(0,newAccountAddress.indexOf("@"));
         
                     var emailText = "Congratulations " + accountName + ",\n\nWe've approved you to be a curator for hubble, and much appreciate your future additions to the site.\nCuration is easy; you just find a browser game online (could be your own) that you like, and submit its url along with a bit of other info in hubble. Then, we review the submission and approve it, and you'll be notified that your game was added.\n\nCheers!\nhttp://hubblegames.site/";
         
                     var htmlEmail = curatorEmail.replace(/\(\(username\)\)/g,accountName);
         
                     transporter.sendMail({
                                          from: emailTemplate.from,
                                          to: newAccountAddress,
                                          subject: "Curator request approved!",
                                          text: emailText,
                                          html: htmlEmail
                                          },
                                          function (error, info) {
                                              if (error) {
                                                  result.message = "ERROR:email";
                                                  
                                                  response.send(JSON.stringify(result));
                                              }
                                              else {
                                                  result.message = "SUCCESS";
                                                  response.send(JSON.stringify(result));
                                              }
                                          });
                 }
                 else {
                     result.message = "SUCCESS";
                     response.send(JSON.stringify(result));
                 }
             }
             function fail() {
                 result.message = "ERROR:write";
                 response.send(JSON.stringify(result));
             }
             fileAccounts(proceed,fail);
         }
         else {
             result.message = "ERROR:gone";
             response.send(JSON.stringify(result));
         }
         });

app.get("/accounts_remove", function(request,response) {
        var result = {
            message: ""
        };
        
        var oldAccountAddress = request.query.oldAccount;
        var index = searchAccounts(oldAccountAddress,1,false);
        
        console.log("Deleting account: " + JSON.stringify(request.query));
        
        if (index != -1) {
            accounts.splice(index,1);
        
            function proceed() {
                result.message = "SUCCESS";
                response.send(JSON.stringify(result));
            }
            function fail() {
                result.message = "ERROR:write";
                response.send(JSON.stringify(result));
            }
        
            fileAccounts(proceed,fail);
        }
        else {
            result.message = "ERROR:gone";
            response.send(JSON.stringify(result));
        }
        });

//SUBMISSIONS HANDLER
app.get("/submissions", function(request,response) {
        var result = {
            file: submissions
        };
        
        response.send(JSON.stringify(result));
        });

//SUBMISSIONS_REPLACE HANDLER
app.post("/submissions_replace", jsonPostParser, function(request,response) {
         var result = {
             message: ""
         };
        
         var newSubmission = request.body;
         var found = false;
         console.log("Replacing submission: " + JSON.stringify(newSubmission));
         
         for (var i=0; !found && i<submissions.length; i++) {
             if (submissions[i].game.id == newSubmission.game.id) {
                 found = true;
                 submissions.splice(i,1,newSubmission);
             }
         }
         
         if (found) {
             function proceed() {
                 result.message = "SUCCESS";
                 response.send(JSON.stringify(result));
             }
             function fail() {
                 result.message = "ERROR:write";
                 response.send(JSON.stringify(result));
             }
             fileSubmissions(proceed,fail);
         }
         else {
             result.message = "ERROR:gone";
             response.send(JSON.stringify(result));
         }
         });

//SUBMISSIONS_REMOVE HANDLER
app.get("/submissions_remove", function(request,response) {
        var result = {
            message: ""
        };
        
        var deletionId = request.query.id;
        console.log("Deleting submission: " + JSON.stringify(request.query));
        
        var found = false;
        
        for (var i=0; !found && i<submissions.length; i++) {
            if (submissions[i].game.id == deletionId) {
                found = true;
                submissions.splice(i,1);
            }
        }
        
        if (found) {
            function proceed() {
                result.message = "SUCCESS";
                response.send(JSON.stringify(result));
            }
            function fail() {
                result.message = "ERROR:write";
                response.send(JSON.stringify(result));
            }
            fileSubmissions(proceed,fail);
        }
        else {
            result.message = "ERROR:gone";
            response.send(JSON.stringify(result));
        }
        });

//GAMES_APPEND HANDLER
app.post("/games_append", jsonPostParser, function(request,response) {
         var result = {
             message: ""
         };
         
         var submission = request.body;
         
         if (searchGamesByName(submission.game.name,1,false) == -1) {
             var icon = submission.game.icon;
             delete submission.game.icon;
         
             if (icon) {
                 fs.writeFile(dataDirectoryPath + "game_icons/" + submission.game.name + ".png",icon.replace(/^data:image\/png;base64,/,""),"base64",function(error) {
                                  if (error) {
                                      result.message = "ERROR:icon";
                                      response.send(JSON.stringify(result));
                                  }
                                  else {
                                      //add new game to games
                                      if (addGame(submission.game)) {
                                          function gamesFail() {
                                              result.message = "ERROR:write";
                                              response.send(JSON.stringify(result));
                                          }
                                          function gamesProceed() {
                                              //remove old submission from submissions
                                              var foundSubmission = -1;
                                              for (var i=0; i<submissions.length && foundSubmission == -1; i++) {
                                                  if (submissions[i].curator == submission.curator && submissions[i].game.url == submission.game.url) {
                                                      submissions.splice(i,1);
                                                      
                                                      foundSubmission = true;
                                                  }
                                              }
                                              
                                              if (foundSubmission) { //update submissions.json
                                                  function submissionsProceed() {
                                                      var username = submission.curator.substring(0,submission.curator.indexOf("@"));
                              
                                                      var gameDescription;
                                                      for (var attribute in submission.game) {
                                                          if (submission.game.hasOwnProperty(attribute)) {
                                                              gameDescription += attribute + ": " + submission.game[attribute] + "\n";
                                                          }
                                                      }
                              
                                                      var htmlEmail = additionEmail.replace(/\(\(username\)\)/g,username).replace(/\(\(game\)\)/g,submission.game.name).replace(/\(\(game_info\)\)/g,gameDescription.replace(/\\n/g,"<br>"));
                              
                                                      //send email to curator
                                                      transporter.sendMail({
                                                                           from: emailTemplate.from,
                                                                           to: submission.curator,
                                                                           subject: emailTemplate.additionSubject + submission.name,
                                                                           text: username + ",\nThanks so much for your addition to the collection! " + submission.game.name + " was just approved for hubble and is now part of the website.\n\nWe try our best to fill in missing information about the game when we approve game submissions, so if you see any incorrect info, feel free to reply to any emails we send.\nHere's what we included in hubble about the game:\n\n" + gameDescription + "\n\nKeep them coming,\nhttp://hubblegames.site",
                                                                           html: htmlEmail
                                                                           },
                                                                           function (error, info) {
                                                                               if (error) {
                                                                                   result.message = "ERROR:email";
                                                                                   response.send(JSON.stringify(result));
                                                                               }
                                                                               else {
                                                                                   //send confirmation to admin
                                                                                   result.message = "SUCCESS";
                                                                                   response.send(JSON.stringify(result));
                                                                               }
                                                                           });
                                                  }
                                                  function submissionsFail() {
                                                      result.message = "ERROR:erase";
                                                      response.send(JSON.stringify(result));
                                                  }
                              
                                                  fileSubmissions(submissionsProceed,submissionsFail);
                                              }
                                              else {
                                                  //failed to delete old submission
                                                  result.message = "ERROR:erase";
                                                  response.send(JSON.stringify(result));
                                              }
                                          }
                                          //update games.json
                                          fileGames(gamesProceed,gamesFail);
                                      }
                                      else {
                                          //failed to add game
                                          result.message = "ERROR:add";
                                          response.send(JSON.stringify(result));
                                      }
                                  }
                              });
             }
             else {
                 result.message = "ERROR:icon";
                 response.send(JSON.stringify(result));
             }
         }
         else {
             //game was already added to games.json
             result.message = "ERROR:exists";
             response.send(JSON.stringify(result));
         }
         });

//GAMES_REPLACE HANDLER
app.post("/games_replace", jsonPostParser, function(request,response) {
         var result = {
             message: ""
         };
         var newGame = request.body;
         
         console.log("Replacing games.json with: " + JSON.stringify(request.body));
         
         var index = searchGamesByName(newGame.name.toLowerCase(),1,false);
         
         if (index != -1) {
             console.log("Game found");
         
             games.byName[index].authors = newGame.authors; //I don't want to be able to change rating or reviews information
             games.byName[index].description = newGame.description;
             games.byName[index].tags = newGame.tags;
             games.byName[index].featured = newGame.featured;
             games.byName[index].url = newGame.url;
         
             var found = false;
             for (var i=0; !found && i<games.byRating.length; i++) {
                 if (games.byRating[i].index == index) {
                     games.byRating[i].tags = newGame.tags;
                     found = true;
                 }
             }
         
             function proceed() {
                 result.message = "SUCCESS";
                 response.send(JSON.stringify(result));
             }
             function fail() {
                 result.message = "ERROR:write";
                 response.send(JSON.stringify(result));
             }
             fileGames(proceed,fail);
         }
         else {
             result.message = "ERROR:gone";
         }
        });

//GAMES_REMOVE HANDLER
app.get("/games_remove", function(request,response) {
         var result = {
             message: ""
         };
         var oldGame = request.query.game;
         
         var index = searchGamesByName(oldGame.toLowerCase(),1,false);
         
         if (index != -1) {
             deleteGameByRating(index,games.byName[index].rating);
             games.byName.splice(index,1);
             
             function proceed() {
                 result.message = "SUCCESS";
                 response.send(JSON.stringify(result));
             }
             function fail() {
                 result.message = "ERROR:write";
                 response.send(JSON.stringify(result));
             }
             fileGames(proceed,fail);
         }
         else {
             result.message = "ERROR:gone";
         }
         });

//use known domain hubblegames.site to make my other sites known: hubblegames.site/mygame
app.get("/shuffle", function(request,response) {
            response.redirect(shuffleUrl);
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
    
    while (result.length < resultMax && !stop) {
        if (!stopP && start+away < games.byName.length) {
            if (games.byName[start+away].name.toLowerCase().indexOf(searchName) > -1 && result.indexOf(games.byName[start+away]) == -1) {
                if (completeReturn) {
                    result.push(games.byName[start+away]);
                }
                else if (resultMax > 1) {
                    result.push(start+away);
                }
                else {
                    resultIndex = start+away;
                    stop = true;
                }
            }
        }
        else {
            stopP = true;
        }
        
        if (away > 0 && !stop) {
            if (!stopN && start-away >= 0) {
                if (games.byName[start-away].name.toLowerCase().indexOf(searchName) > -1 && result.indexOf(games.byName[start-away]) == -1) {
                    if (completeReturn) {
                        result.push(games.byName[start-away]);
                    }
                    else if (resultMax > 1) {
                        result.push(start-away);
                    }
                    else {
                        resultIndex = start-away;
                        stop = true;
                    }
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
    
    if (resultMax == 1 && !completeReturn) {
        return resultIndex;
    }
    else {
        return result;
    }
}

//tag search
function searchGamesByTag(searchTag,resultMax) {
    var result = [];
    
    for (var r=0; result.length < resultMax && r<games.byRating.length; r++) {
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

//address search in accounts.json
function searchAccounts(searchAddress,resultMax,completeReturn) {
    var result = [];
    var resultIndex = -1;
    
    for (var i=0; result.length < resultMax && i<accounts.length; i++) {
        if (accounts[i].address.indexOf(searchAddress) > -1) {
            console.log("\t\t" + accounts[i].address + " contains " + searchAddress);
            
            if (completeReturn) {
                result.push(accounts[i]);
            }
            else if (resultMax > 1) {
                result.push(i);
            }
            else {
                resultIndex = i;
            }
        }
    }
    
    if (!completeReturn && resultMax == 1) {
        return resultIndex;
    }
    else {
        return result;
    }
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

//this adds a new game to both games.byName lexicographically, and games.byRating by rating and index in games.byName
function addGame(newGame) {
    newGame.reviews = 1;
    newGame.featured = false;
    
    var indexByName = addGameByName(newGame);

    if (indexByName > -1) {
        addGameByRating(indexByName,newGame.rating);
        
        return true;
    }
    else {
        return false;
    }
}

//this appends a new game to games.byName lexicographically
function addGameByName(newGame) {
    var location = alphabet.indexOf(newGame.name.toLowerCase().charAt(0));
    location = Math.round(location/alphabet.length) * games.byName.length;
    
    var left = null;
    var right = null;
    var done = false;

    while (!done) {
        if (location > 0) {
            left = games.byName[location-1].name;
        }
        else {
            left = newGame.name;
        }
        if (location < games.byName.length) {
            right = games.byName[location].name;
        }
        else {
            right = newGame.name;
        }
        
        if (compareStrings(newGame.name,left) < 0) {
            if (location > 0) {
                location--;
            }
            else {
                done = true;
            }
        }
        else if (compareStrings(newGame.name,right) > 0) {
            if (location < games.byName.length) {
                location++;
            }
            else {
                done = true;
            }
        }
        else {
            done = true;
        }
    }
    
    games.byName.splice(location,0,newGame);
    
    return location;
}

//this appends a new game to games.byRating according to game.rating and game.name
function addGameByRating(indexByName,rating) {
    var location = Math.round(((5-rating)/4) * games.byRating.length);
    
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
    
    for (var i=0; i<games.byRating.length; i++) {       //update indeces after new game is inserted into games.byName
        if (games.byRating[i].index >= indexByName) {
            games.byRating[i].index++;
        }
    }
    
    games.byRating.splice(location,0,game); //splice(location,#_delete,[insert_1,insert_2,...])
}

//update games.json to match games
function fileGames(proceed,fail) {//this is ugly, but I want not to proceed until I get the outcome of the asynchronous fs.writeFile() call
    fs.writeFile(dataDirectoryPath + "games.json", JSON.stringify(games), function(err) {
                 if (err) {
                     if (fail != null) {
                         fail();
                     }
                 }
                 else if (proceed != null) {
                     proceed();
                 }
    });
}

//update accounts.json to match accounts
function fileAccounts(proceed,fail) {
    fs.writeFile(dataDirectoryPath + "accounts.json", JSON.stringify(accounts), function(err) {
                 if (err) {
                     if (fail != null) {
                         fail();
                     }
                 }
                 else if (proceed != null) {
                     proceed();
                 }
    });
}

//update submissions.json to match submissions
function fileSubmissions(proceed,fail) {
    fs.writeFile(dataDirectoryPath + "submissions.json", JSON.stringify(submissions), function(err) {
                 if (err) {
                     if (fail != null) {
                         fail();
                     }
                 }
                 else if (proceed != null) {
                     proceed();
                 }
                 });
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

//compare lexicographically two strings (-1 = first<second, 0 = first=second, 1 = first>second)
function compareStrings(first,second) {
    var result = 0;
    
    for (var i=0; i<first.length && result == 0; i++) {
        if (i >= second.length) {
            result = 1;
        }
        else {
            var a = alphabet.indexOf(first.charAt(i).toLowerCase());
            var b = alphabet.indexOf(second.charAt(i).toLowerCase());
            
            if (a == -1 && first.charAt(i) != " ") {
                a = alphabet.length;
            }
            if (b == -1 && second.charAt(i) != " ") {
                b = alphabet.length;
            }
            
            if (a < b) {
                result = -1;
            }
            else if (a > b) {
                result = 1;
            }
        }
    }
    
    if (result == 0 && first.length < second.length) {
        result =  -1;
    }
    
    return result;
}