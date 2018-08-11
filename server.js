const express = require("express");
const app = express();

const jsonPostParser = require("body-parser").json({limit:"50mb"}); //the object argument with a 50mb limit attribute allows clients to emit icon files via POST

const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
                                             service: "gmail",
                                             auth: {
                                                user: "hubbleojpgapps@gmail.com",
                                                pass: "pBC-6DT-hwN-UxG"
                                             }
                                             });

const fs = require("fs");

const dataDirectoryPath = "/data/";  //path to data files that won't be overwritten
//const dataDirectoryPath = "./"; //HERE: for testing

let games,accounts,submissions,authors = null;

try {
    games = require(dataDirectoryPath + "games.json");
}
catch (error) { //JSON files failed to load; creating database from local copy in the persistent directory
    games = require("./games.json");
    fileGames(); //HERE: for real
}

try {
    accounts = require(dataDirectoryPath + "accounts.json");
}
catch (error) {
    accounts = require("./accounts.json");
    fileAccounts(); //HERE: for real
}

try {
    submissions = require(dataDirectoryPath + "submissions.json");
}
catch (error) {
    submissions = require("./submissions.json");
    fileSubmissions(); //HERE: for real
}

try {
    authors = require(dataDirectoryPath + "authors.json");
}
catch (error) {
    authors = require("./authors.json");
    fileAuthors(); //HERE: for real
}

const SOURCE_CODES = {
    GAMES: 0,
    ACCOUNTS: 1,
    AUTHORS: 2
};


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

const port = process.env.HUBBLE_SERVICE_PORT || 8080;
const ip = process.env.HOSTNAME || "127.0.0.1";

const RESULT_MAX = 30; //the number of search results will not exceed RESULT_MAX
const ADMIN_ADDRESS = "hubbleojpgapps@gmail.com";
const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
const emailTemplate = {
    from: "hubble <hubbleojpgapps@gmail.com>",
    registerSubject: "Hubble Account Information",
    curatorSubject: "New Curator: ",
    submissionSubject: "New Game: * from ",
    additionSubject: "Submission Accepted for ",
    applicationSubject: "Hubble Curation Request Sent"
};
let registerEmail = null;
let applicationEmail = null;
let curatorEmail = null;
let additionEmail = null;

const serverDirectoryPath = "/opt/app-root/src/"; //$pwd in openshift remote shell to hubble's server pod

const shuffleUrl = "http://shuffle-shuffle.193b.starter-ca-central-1.openshiftapps.com/";

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


//SEARCH HANDLERS
let searchTerms = null;
let resultNames = [];
let resultTagAuthors = [];
let resultAccounts = [];
let resultAuthors = [];
let result = null;

let gamesByName = null;
let gamesByTagAuthors = null;
let accountsByAddress = null;
let authorsByName = null;

let responseObject = null;

function grabAuthorLinks(gameAuthors) { //get authors.links from authors.json for games return
    let fullAuthors = [];
    let authorIndex = null;
    
    if (gameAuthors != null) {
        for (let i=0; i<gameAuthors.length; i++) {
            authorIndex = searchAuthors(gameAuthors[i].toLowerCase(),1);
            
            if (authorIndex != -1) {
                fullAuthors.push(authors[authorIndex]);
            }
            else {
                console.log("NOTICE: author " + gameAuthors[i] + " should be deleted from this game.");
            }
        }
    }
    
    return fullAuthors;
}

function nextGameByTagAuthors(counter,tagAuthorsCounter,source) {
    if (tagAuthorsCounter < gamesByTagAuthors.length) {
        let found = false;
        
        for (let i=0; i<resultTagAuthors.length && !found; i++) {
            if (resultTagAuthors[i].name == gamesByTagAuthors[tagAuthorsCounter].name) {
                found = true;
            }
        }
        
        if (!found) {
            fs.readFile(dataDirectoryPath + "game_icons/" + gamesByTagAuthors[tagAuthorsCounter].name + ".png", function(err, data) {
                        let iconData = "";
                        
                        if (err) {
                            result.message = "ERROR:read";
                        }
                        else {
                            iconData = "data:image/png;base64," + (new Buffer(data)).toString("base64");
                        }
                        
                        const game = {
                            name: gamesByTagAuthors[tagAuthorsCounter].name,
                            authors: gamesByTagAuthors[tagAuthorsCounter].authors,
                            description: gamesByTagAuthors[tagAuthorsCounter].description,
                            tags: gamesByTagAuthors[tagAuthorsCounter].tags,
                            rating: gamesByTagAuthors[tagAuthorsCounter].rating,
                            reviews: gamesByTagAuthors[tagAuthorsCounter].reviews,
                            featured: gamesByTagAuthors[tagAuthorsCounter].featured,
                            url: gamesByTagAuthors[tagAuthorsCounter].url,
                            icon: iconData
                        };
                        
                        game.authors = grabAuthorLinks(game.authors);
                        
                        console.log("\t\t" + game.name);
                        resultTagAuthors.push(game);
                        
                        nextGameByTagAuthors(counter,tagAuthorsCounter+1,source);
                        });
        }
        else {
            nextGameByTagAuthors(counter,tagAuthorsCounter+1,source);
        }
    }
    else {
        nextResults(counter+1,source);
    }
}

function nextGameByName(counter,nameCounter,source,proceedToTags) { //HERE: NOW: fix game searches
    if (nameCounter < gamesByName.length) {
        let found = false;
        
        for (let i=0; i<resultNames.length && !found; i++) {
            if (resultNames[i].name == gamesByName[nameCounter].name) {
                found = true;
            }
        }
        
        if (!found) {
            fs.readFile(dataDirectoryPath + "game_icons/" + gamesByName[nameCounter].name + ".png", "base64", function(err, data) {
                        let iconData = "";
                        
                        if (err) {
                            result.message = "ERROR:read";
                        }
                        else {
                            iconData = "data:image/png;base64," + data;
                        }
                        
                        const game = {
                            name: gamesByName[nameCounter].name,
                            authors: gamesByName[nameCounter].authors,
                            description: gamesByName[nameCounter].description,
                            tags: gamesByName[nameCounter].tags,
                            rating: gamesByName[nameCounter].rating,
                            reviews: gamesByName[nameCounter].reviews,
                            featured: gamesByName[nameCounter].featured,
                            url: gamesByName[nameCounter].url,
                            icon: iconData
                        };
                        
                        game.authors = grabAuthorLinks(game.authors);
                        
                        console.log("\t\t" + game.name);
                        resultNames.push(game);
                        
                        nextGameByName(counter,nameCounter+1,source,proceedToTags);
                        });
        }
        else {
            nextGameByName(counter,nameCounter+1,source,proceedToTags);
        }
    }
    else if (proceedToTags) {
        gamesByTagAuthors= searchGamesByTagAuthors(searchTerms[counter],RESULT_MAX-resultTagAuthors.length);  //tag search
        nextGameByTagAuthors(counter,0,source);
    }
    else {
        nextResults(counter+1,source);
    }
}

function nextAccountByAddress(counter,accountCounter,source) {
    if (accountCounter < accountsByAddress.length) {
        console.log("\tnextAccountByAddress(): counter=" + counter + " a=" + accountCounter + " source=" + source);
        let found = false;
        
        for (let i=0; i<resultAccounts.length && !found; i++) {
            if (resultAccounts[i].address == accountsByAddress[accountCounter].address) {
                found = true;
            }
        }
        
        if (!found) {
            resultAccounts.push(accountsByAddress[accountCounter]);
            
            nextAccountByAddress(counter,accountCounter+1,source);
        }
        else {
            console.log("\t" + accountsByAddress[accountCounter].name + " already in resultAccounts");
            nextAccountByAddress(counter,accountCounter+1,source);
        }
    }
    else {
        nextResults(counter+1,source);
    }
}

function nextAuthorByName(counter,authorCounter,source) {
    if (authorCounter < authorsByName.length) {
        console.log("\nnextAuthorByName(): counter=" + counter + " a=" + authorCounter + " source=" + source);
        let found = false;
        
        for (let i=0; i<resultAuthors.length && !found; i++) {
            if (resultAuthors[i].name == authorsByName[authorCounter].name) {
                found = true;
            }
            else {
                console.log("\tauthor " + resultAuthors[i].name + " is not " + authorsByName[authorCounter].name);
            }
        }
        
        if (!found) {
            console.log("\t\t" + authorsByName[authorCounter].name);
            resultAuthors.push(authorsByName[authorCounter]);
            
            nextAuthorByName(counter,authorCounter+1,source);
        }
        else {
            console.log("\t" + authorsByName[authorCounter].name + " already in resultAuthors");
            nextAuthorByName(counter,authorCounter+1,source);
        }
    }
    else {
        nextResults(counter+1,source);
    }

}

function nextResults(counter,source) {
    const moreTerms = (counter < searchTerms.length); //there are more search terms AND there is space in the results array(s)
    
    const moreSpace = [false,false,false,false]; //[names,tags+authors,accounts,authors]
    
    if (source == SOURCE_CODES.GAMES) {
        moreSpace[0] = (resultNames.length < RESULT_MAX);
        moreSpace[1] = (resultTagAuthors.length < RESULT_MAX);
    }
    else if (source == SOURCE_CODES.ACCOUNTS) {
        moreSpace[2] = (resultAccounts.length < RESULT_MAX);
    }
    else { //source == SOURCE_CODES.AUTHORS
        moreSpace[3] = (resultAuthors.length < RESULT_MAX);
    }
    
    if (moreTerms) {
        console.log("nextResults(): counter=" + counter + " source=" + source);
        
        if (searchTerms[counter].length > 0) {
            console.log("\tloading results for " + searchTerms[counter]);
            
            if (moreSpace[0]) {
                console.log("\t" + searchTerms[counter] + " is a game name...");
                gamesByName = searchGamesByName(searchTerms[counter],RESULT_MAX-resultNames.length,true);  //game search by name
                nextGameByName(counter,0,source,moreSpace[1]); //add results to resultNames (also calls tag search if moreSpace[1])
            }
            else if (moreSpace[1]) {
                console.log("\t" + searchTerms[counter] + " is a game tag/author...");
                gamesByTagAuthors= searchGamesByTagAuthors(searchTerms[counter],RESULT_MAX-resultTagAuthors.length);  //game search by tag and author
                
                nextGameByTagAuthors(counter,0,source); //add results to resultTagAuthors
            }
            else if (moreSpace[2]) {
                console.log("\t" + searchTerms[counter] + " is an account address...");
                accountsByAddress = searchAccounts(searchTerms[counter],RESULT_MAX-resultAccounts.length,true); //address search
                
                nextAccountByAddress(counter,0,source); //add results to resultAccounts
            }
            else if (moreSpace[3]) {
                console.log("\t" + searchTerms[counter] + " is an author name...");
                authorsByName = searchAuthors(searchTerms[counter],RESULT_MAX-resultAuthors.length); //authors search
                
                nextAuthorByName(counter,0,source); //add results to resultAuthors
            }
            else {
                console.log("search hit result max.");
                
                if (source == SOURCE_CODES.GAMES) {
                    console.log("resultNames: " + resultNames.length);
                    console.log("resultTagAuthors: " + resultTagAuthors.length);
                    
                    result.name = resultNames;
                    result.tagAuthors = resultTagAuthors;
                }
                else if (source == SOURCE_CODES.ACCOUNTS) {
                    console.log("resultAccounts: " + resultAccounts.length);
                    result.address = resultAccounts;
                }
                else { // source == SOURCE_CODES.AUTHORS
                    console.log("resultAuthors: " + resultAuthors.length);
                    result.authors = resultAuthors;
                }
                
                responseObject.send(JSON.stringify(result));
            }
        }
        else {
            nextResults(counter+1,source);
        }
    }
    else {
        console.log("search complete.");
        
        if (source == SOURCE_CODES.GAMES) {
            console.log("resultNames: " + resultNames.length);
            console.log("resultTagAuthors: " + resultTagAuthors.length);
            
            result.name = resultNames;
            result.tagAuthors = resultTagAuthors;
        }
        else if (source == SOURCE_CODES.ACCOUNTS) {
            console.log("resultAccounts: " + resultAccounts.length);
            result.address = resultAccounts;
        }
        else { // source == SOURCE_CODES.AUTHORS
            console.log("resultAuthors: " + resultAuthors.length);
            result.authors = resultAuthors;
        }
        
        responseObject.send(JSON.stringify(result));
    }
}

app.get("/search", function(request,response) {
        //search games.json by name and tags
        //HERE: unify name and tag search results
        //HERE: ...add searching by author
        searchTerms = request.query.terms;
        resultNames = [];
        resultTagAuthors = [];
        resultAuthors = [];
        
        result = {
            message: "",
            name: [],
            tagAuthors: []
        };
        
        responseObject = response;
        
        console.log("/search request received");
        
        nextResults(0,SOURCE_CODES.GAMES); //counter,source=games
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
        
        nextResults(0,SOURCE_CODES.ACCOUNTS); //counter,source=accounts
        });

app.get("/authors", function(request,response) {
        //search authors.json by name
        searchTerms = request.query.terms;
        resultAuthors = [];
        result = {
            message: "",
            authors: []
        };
        
        responseObject = response;
        
        nextResults(0,SOURCE_CODES.AUTHORS); //counter,source=authors
        })


//FEATURED HANDLER
app.get("/featured", function(request,response) {
        //search games by game.featured
        let result = {
            message: "",
            games: []
        };
        
        function nextResult(counter) {
            if (counter < games.byName.length && result.games.length < RESULT_MAX) {
                if (games.byName[counter].featured) {
                    fs.readFile(dataDirectoryPath + "game_icons/" + games.byName[counter].name + ".png", "base64", function(err, data) {
                                let iconData = "";
                                
                                if (err) {
                                    result.message = "ERROR:read";
                                }
                                else {
                                    iconData = "data:image/png;base64," + data;
                                }
                                    
                                let game = {
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
                                
                                game.authors = grabAuthorLinks(game.authors);
                                
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
        let result = {
            message: "",
            games: []
        }
        
        function nextRandom(previous) {
            if (previous.length < RESULT_MAX*0.5 && previous.length < games.byRating.length*0.75) {
                let index = Math.round(Math.random() * (games.byName.length-1));
        
                while (previous.indexOf(index) != -1) {
                    index = Math.round(Math.random() * (games.byName.length-1));
                }

                let newGame = Object.assign({},games.byName[index]); //deep copy!!
                newGame.authors = grabAuthorLinks(newGame.authors);
        
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
        
        nextRandom([]);
        });

//REGISTER HANDLER
app.get("/register", function(request,response) {
        //check if user already exists, check if email is valid, and return the appropriate messages
        const now = new Date();
        
        let newAccount = {
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
        let foundAddress = false;
        let result = {
                        message: ""
                     };
        
        //check if user already exists
        for (let i=0; i<accounts.length && !foundAddress; i++) {
            if (newAccount.address == accounts[i].address) {
                result.message = "ERROR:many";
                foundAddress = true;
            }
        }
        
        //check if email is valid
        if (!foundAddress) {
            let htmlEmail = registerEmail;
        
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
        const proposedAccount = request.query.account;
        let foundAddress = -1;
        let result = {
            message: "",
            reviews: [],
            curator: false,
            bday: null
        };
        
        for (let i=0; i<accounts.length && foundAddress == -1; i++) {
            if (proposedAccount.address == accounts[i].address) {
                foundAddress = i;
            }
        }
        
        if (foundAddress == -1) {
            result.message = "ERROR:gone";
            response.send(JSON.stringify(result));
        }
        else {
            const stored = accounts[foundAddress].password;
            const proposed = encrypt(proposedAccount.password,stored.substring(stored.length-8)); //length of salt = 8
        
        
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
        const account = request.query.account;
        const newRating = parseFloat(request.query.rating);
        let result = {
            message: "",
            reviews: [],
            rating: -1
        };
        
        //find game to change (name search is the same one used in response to the /search request)
        const index = searchGamesByName(request.query.game.toLowerCase(),1,false);
        
        if (index == -1) {
            result.message = "ERROR:game";
        }
        else {
            //update game.rating and game.reviews
        
            const n = parseFloat(games.byName[index].reviews);
            const mean = parseFloat(games.byName[index].rating);
        
            if (account.reviewed == "true") {       //I think request.query objects all come in as strings, so they should be parsed individually according to what they really represent.
                //if user already has already rated this game, then newRating is the change between the previous and new ratings
                games.byName[index].rating = mean + (newRating / n);
            }
            else {
                //if user hasn't yet rated this game
                games.byName[index].rating = ((mean * n) + newRating) / (n+1);
                games.byName[index].reviews = n+1;
            }
        
            //update games.byRating's order to reflect games.byName[index].rating; moveGameByRating(indexByName,newRating) returns boolean
            if (!moveGameByRating(index,games.byName[index].rating)) {
                result.message = "ERROR:game";
            }
        }
        
        //find user in accounts[]
        const foundAddress = -1;
        
        for (let i=0; i<accounts.length && foundAddress == -1; i++) {
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
            let newReview = {
                game: request.query.game,
                rating: newRating
            };
        
            if (account.reviewed == "false") {
                //add new review to user's account.reviews
                accounts[foundAddress].reviews.push(newReview);
            }
            else {
                //find review corresponding to the same game and update accounts[foundAddress].reviews[i].rating
                let foundReview = false;
                for (let i=0; i<accounts[foundAddress].reviews.length && !foundReview; i++) {
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
        let submission = {
            curator: request.query.curator,
            game: request.query.game || null
        };
        
        let result = {
            message: ""
        }
        
        //find user in accounts[]
        let foundAddress = -1;
        
        for (let i=0; i<accounts.length && foundAddress == -1; i++) {
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
        
                    const emailText = "Hi " + submission.curator.substring(submission.curator.indexOf("@")) + ",\n\nYour request to be a curator for hubble has been sent successfully! Check back in a bit to see if you've been approved.\n\nThanks for your help!\nhttp://hubblegames.site/\n\nPS: Most anyone will get approved to curate within a day or so, when the admin reads the email request; we just like to give the requester time to delete their hubble account if it was created accidentally and such.";
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
        
                for (let i=0; i<submission.game.authors.length; i++) {
                    if (typeof submission.game.authors[i].links == "undefined") { //the empty array doesn't get passed over for some reason
                        submission.game.authors[i].links = [];
                    }
                }
                submissions.push(submission);
        
                console.log("New submission: " + JSON.stringify(submission));
        
                function fail() {
                    result.message = "ERROR:write";
                }
                function proceed() {
                    result.message = "SUCCESS";
        
                    const emailSubject = emailTemplate.submissionSubject.replace(/\*/, submission.game.name) + submission.curator;
        
                    let emailText = "Name: " + submission.game.name + "\nURL: " + submission.game.url + "\nAuthors: ";
                    for (let i=0; i<submission.game.authors.length; i++) { //HERE: modify to include authors.links
                        emailText += "\n\t" + submission.game.authors[i].name + ": ";
                        for (let j=0; j<submission.game.authors[i].links.length; j++) {
                            emailText += submission.game.authors[i].links[j] + " ";
                        }
                    }
                    emailText += "\nDescription: " + submission.game.description + "\nRating: " + submission.game.rating + "\nTags: ";
                    for (let i=0; i<submission.game.tags.length; i++) {
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
         let result = {
             message: ""
         };
         
         const newAccountAddress = request.body.newAccount.address;
         const index = searchAccounts(newAccountAddress,1,false);
         
         console.log("Updating account: " + newAccountAddress);
         
         if (index != -1) {
             let approved = false;
         
             if (!accounts[index].curator && request.body.newAccount.curator) {
                 approved = true;
             }
         
             accounts.splice(index,1,request.body.newAccount);
         
             function proceed() {
                 console.log("CURATOR APPROVED: " + approved);
         
                 if (approved) {
                     const accountName = newAccountAddress.substring(0,newAccountAddress.indexOf("@"));
         
                     const emailText = "Congratulations " + accountName + ",\n\nWe've approved you to be a curator for hubble, and much appreciate your future additions to the site.\nCuration is easy; you just find a browser game online (could be your own) that you like, and submit its url along with a bit of other info in hubble. Then, we review the submission and approve it, and you'll be notified that your game was added.\n\nCheers!\nhttp://hubblegames.site/";
         
                     const htmlEmail = curatorEmail.replace(/\(\(username\)\)/g,accountName);
         
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

//ACCOUNTS_REMOVE HANDLER
app.get("/accounts_remove", function(request,response) {
        let result = {
            message: ""
        };
        
        const oldAccountAddress = request.query.oldAccount;
        const index = searchAccounts(oldAccountAddress,1,false);
        
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
        const result = {
            file: submissions
        };
        
        response.send(JSON.stringify(result));
        });

//SUBMISSIONS_REPLACE HANDLER
app.post("/submissions_replace", jsonPostParser, function(request,response) {
         let result = {
             message: ""
         };
        
         const newSubmission = request.body;
         let found = false;
         console.log("Replacing submission: " + JSON.stringify(newSubmission));
         
         for (let i=0; !found && i<submissions.length; i++) {
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
        let result = {
            message: ""
        };
        
        const deletionId = request.query.id;
        console.log("Deleting submission: " + JSON.stringify(request.query));
        
        let found = false;
        
        for (let i=0; !found && i<submissions.length; i++) {
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
         let result = {
             message: ""
         };
         
         let submission = request.body;
         
         if (searchGamesByName(submission.game.name,1,false) == -1) {
             const icon = submission.game.icon;
             delete submission.game.icon;
         
             let submissionAuthors = [];
             for (let i=0; i<submission.game.authors.length; i++) {
                 submissionAuthors.push(submission.game.authors[i]);
                 submission.game.authors[i] = submission.game.authors[i].name;
             }
         
             if (icon != null) {
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
                                              if (updateAuthors(submissionAuthors)) { //HERE: add new authors and/or add new links to existing authors. Then update authors.json
                                                  function authorsProceed() {
                                                      //remove old submission from submissions
                                                      let foundSubmission = -1;
                                                      for (let i=0; i<submissions.length && foundSubmission == -1; i++) {
                                                          if (submissions[i].curator == submission.curator && submissions[i].game.url == submission.game.url) {
                                                              submissions.splice(i,1);
                                                              
                                                              foundSubmission = true;
                                                          }
                                                      }
                                                      
                                                      if (foundSubmission) { //update submissions.json
                                                          function submissionsProceed() {
                                                              const username = submission.curator.substring(0,submission.curator.indexOf("@"));
                                      
                                                              let gameDescription = "";
                                                              for (let attribute in submission.game) {
                                                                  if (submission.game.hasOwnProperty(attribute)) {
                                                                      gameDescription += attribute + ": " + submission.game[attribute] + "\n";
                                                                  }
                                                              }
                                      
                                                              const htmlEmail = additionEmail.replace(/\(\(username\)\)/g,username).replace(/\(\(game\)\)/g,submission.game.name).replace(/\(\(game_info\)\)/g,gameDescription.replace(/\\n/g,"<br>"));
                                      
                                                              //send email to curator
                                                              transporter.sendMail({
                                                                                   from: emailTemplate.from,
                                                                                   to: submission.curator,
                                                                                   subject: emailTemplate.additionSubject + submission.game.name,
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
                                                  //update authors.json
                                                  fileAuthors(authorsProceed,gamesFail);
                                              }
                                              else {
                                                  //failed to update authors
                                                  result.message = "ERROR:author";
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
         let result = {
             message: ""
         };
         const newGame = request.body;
         
         console.log("Replacing games.json with: " + JSON.stringify(request.body));
         
         const index = searchGamesByName(newGame.name.toLowerCase(),1,false);
         
         if (index != -1) {
             console.log("Game found");
         
             games.byName[index].authors = newGame.authors; //I don't want to be able to change rating or reviews information
             games.byName[index].description = newGame.description;
             games.byName[index].tags = newGame.tags;
             games.byName[index].featured = newGame.featured;
             games.byName[index].url = newGame.url;
         
             let found = false;
             for (let i=0; !found && i<games.byRating.length; i++) {
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
             response.send(JSON.stringify(result));
         }
        });

//GAMES_REMOVE HANDLER
app.get("/games_remove", function(request,response) {
         let result = {
             message: ""
         };
         const oldGame = request.query.game;
         
         const index = searchGamesByName(oldGame.toLowerCase(),1,false);
         
         if (index != -1) {
             deleteGameByRating(index); //remove from games.byRating and update indeces
             games.byName.splice(index,1); //remove from games.byName
        
             function proceed() {
                 fs.unlink(dataDirectoryPath + "game_icons/" + oldGame + ".png", function (error) { //remove icon from game_icons/
                           if (error) {
                               result.message = "ERROR:icon";
                           }
                           else {
                               result.message = "SUCCESS";
                           }
                           response.send(JSON.stringify(result));
                           });
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

//AUTHORS_REPLACE HANDLER
app.post("/authors_replace", jsonPostParser, function(request,response) {
        let result = {
            message: ""
        };
        const newAuthor = request.body;
        const oldAuthor = searchAuthors(newAuthor.name.toLowerCase(),1);
        
        if (oldAuthor != -1) {
            console.log("Replacing author @" + oldAuthor + " with " + JSON.stringify(newAuthor));
            authors[oldAuthor].links = Object.assign([],newAuthor.links); //HERE: author's name is immutable; Object.assign(dest,src) = guaranteed deep copy
        
            function proceed() {
                result.message = "SUCCESS";
                response.send(JSON.stringify(result));
            }
            function fail() {
                result.message = "ERROR:write";
                response.send(JSON.stringify(result));
            }
        
            fileAuthors(proceed,fail);
        }
        else {
            result.message = "ERROR:gone";
            response.send(JSON.stringify(result));
        }
        });

//AUTHORS_REMOVE HANDLER
app.get("/authors_remove", function(request,response) {
        let result = {
            message: ""
        };
        
        console.log("Query: " + JSON.stringify(request.query));
        
        const oldAuthorName = request.query.oldName;

        const index = searchAuthors(oldAuthorName.toLowerCase(),1);
        
        console.log("Deleting author: " + JSON.stringify(request.query));
        
        if (index != -1) {
            authors.splice(index,1);
            
            function proceed() {
                result.message = "SUCCESS";
                response.send(JSON.stringify(result));
            }
            function fail() {
                result.message = "ERROR:write";
                response.send(JSON.stringify(result));
            }
            
            fileAuthors(proceed,fail);
        }
        else {
            result.message = "ERROR:gone";
            response.send(JSON.stringify(result));
        }
        });

//use known domain hubblegames.site to make my other sites known: hubblegames.site/mygame
app.get("/shuffle", function(request,response) {
            response.redirect(shuffleUrl);
        });

const server = app.listen(port,ip);

//name search
function searchGamesByName(searchName,resultMax,completeReturn) {
    let start = alphabet.indexOf(searchName.charAt(0));
    start = Math.round((start / alphabet.length) * games.byName.length);
    
    let away = 0;
    let stop = false;
    let stopP = false;
    let stopN = false;
    
    let result = [];
    let resultIndex = -1;
    
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

//tag and author search
function searchGamesByTagAuthors(searchTerm,resultMax) {
    let result = [];
    let resultIndeces = [];
    let tagAuthorMatch = false;
    let testGame = null;
    let testTag = "";
    let testAuthor = "";
    
    for (let r=0; result.length < resultMax && r<games.byRating.length; r++) {
        tagAuthorMatch = false;
        testGame = games.byRating[r];
        
        for (let at=0; !tagAuthorMatch && (at<testGame.tags.length || at<testGame.authors.length); at++) {
            if (at < testGame.tags.length) {
                testTag = testGame.tags[at].toLowerCase();
                
                if (testTag.indexOf(searchTerm) > -1 && resultIndeces.indexOf(testGame.index) == -1) {
                    console.log("\t\t" + testTag + " contains tag " + searchTerm);
                    tagAuthorMatch = true;
                }
            }
            if (!tagAuthorMatch && at < testGame.authors.length) {
                testAuthor = testGame.authors[at].toLowerCase();
                
                if (testAuthor.indexOf(searchTerm) > -1) {
                    if (resultIndeces.indexOf(testGame.index) == -1) {
                        console.log("\t\t" + testAuthor + " contains author " + searchTerm);
                        tagAuthorMatch = true;
                    }
                    else {
                        console.log("result.indexOf(" + searchTerm + ") -> " + resultIndeces.indexOf(searchTerm));
                    }
                }
            }
        }
        
        if (tagAuthorMatch) {
            resultIndeces.push(testGame.index);
            result.push(games.byName[testGame.index]);
        }
    }
    
    return result;
}

//address search in accounts.json
function searchAccounts(searchAddress,resultMax,completeReturn) {
    let result = [];
    let resultIndex = -1;
    
    for (let i=0; result.length < resultMax && i<accounts.length; i++) {
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

//name search in authors.json
function searchAuthors(searchName,resultMax) {
    let result = [];
    let resultIndex = -1;
    
    let start = alphabet.indexOf(searchName.charAt(0));
    start = Math.round((start / alphabet.length) * authors.length);
    
    let away = 0;
    let stop = false;
    let stopP = false;
    let stopN = false;
    
    while (result.length < resultMax && !stop) {
        if (!stopP && start+away < authors.length) {
            if (authors[start+away].name.toLowerCase().indexOf(searchName) > -1 && result.indexOf(authors[start+away]) == -1) {
                if (resultMax == 1) {
                    resultIndex = start+away;
                    stop = true;
                }
                else {
                    result.push(authors[start+away]);
                }
            }
        }
        else {
            stopP = true;
        }
        
        if (away > 0 && !stop) {
            if (!stopN && start-away >= 0) {
                if (authors[start-away].name.toLowerCase().indexOf(searchName) > -1 && result.indexOf(authors[start-away]) == -1) {
                    if (resultMax == 1) {
                        resultIndex = start-away;
                        stop = true;
                    }
                    else {
                        result.push(authors[start-away]);
                    }
                }
            }
            else {
                stopN = true;
            }
        }
        
        
        if (start+away < authors.length-1 || start-away > 0) {
            away++;
        }
        else {
            stop = true;
        }
    }
    
    if (resultMax == 1) {
        return resultIndex;
    }
    else {
        return result;
    }
}

//the input is the index of the game to move in games.byName. This removes games.byRating[r] (where games.byRating[r].index == index) and finds a new place for it according to games.byName[index].rating
function moveGameByRating(indexByName,newRating) {
    const result = deleteGameByRating(indexByName);
    
    if (result) {
        addGameByRating(indexByName,newRating);
    }
    
    return result;
}

function deleteGameByRating(indexByName) {
    let result = false;
    
    for (let i=0; i<games.byRating.length; i++) { //fix indeces and find game where games.byRating[t].index == indexByName and remove it from games.byRating
        if (games.byRating[i].index == indexByName) {
            games.byRating.splice(i,1);
            i--;
            result = true;
        }
        else if (games.byRating[i].index > indexByName) {
            games.byRating[i].index--;
        }
    }
    
    return result;
}

//this adds a new game to both games.byName lexicographically, and games.byRating by rating and index in games.byName
function addGame(newGame) {
    newGame.reviews = 1;
    newGame.featured = false;
    
    const indexByName = addGameByName(newGame);

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
    let location = alphabet.indexOf(newGame.name.toLowerCase().charAt(0));
    location = Math.round(location/alphabet.length) * games.byName.length;
    
    let left = null;
    let right = null;
    let done = false;

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
    let location = Math.round(((5-rating)/4) * games.byRating.length);
    
    let game = {
        tags: games.byName[indexByName].tags,
        authors: games.byName[indexByName].authors, //HERE: store author info in games.byName
        index: indexByName
    }
    
    let left = null;
    let right = null;
    
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
    
    for (let i=0; i<games.byRating.length; i++) {       //update indeces after new game is inserted into games.byName
        if (games.byRating[i].index >= indexByName) {
            games.byRating[i].index++;
        }
    }
    
    games.byRating.splice(location,0,game); //splice(location,#_delete,[insert_1,insert_2,...])
}

//HERE: check game.authors list against authors.json to find new authors and links
function updateAuthors(newAuthors) {
    console.log("Adding authors: " + JSON.stringify(newAuthors));
    let success = true;
    let index = -1;
    let oldAuthorLinks = null;
    
    for (let i=0; success && i<newAuthors.length; i++) {
        index = searchAuthors(newAuthors[i].name.toLowerCase(),1);
        
        if (index != -1) {
            for (let j=0; j<newAuthors[i].links.length; j++) {
                oldAuthorLinks = authors[index].links;
                if (oldAuthorLinks.indexOf(newAuthors[i].links[j]) == -1) {
                    //add new link to existing author
                    oldAuthorLinks.push(newAuthors[i].links[j]);
                }
            }
        }
        else if (addAuthor(newAuthors[i]) == -1) { //add new author
            success = false;
        }
    }
    
    return success;
}

//HERE: adds author to authors array maintaining lexicographical order
function addAuthor(newAuthor) {
    let location = alphabet.indexOf(newAuthor.name.toLowerCase().charAt(0));
    location = Math.round(location/alphabet.length) * authors.length;
    
    let left = null;
    let right = null;
    let done = false;
    
    while (!done) {
        if (location > 0) {
            left = authors[location-1].name;
        }
        else {
            left = newAuthor.name;
        }
        if (location < authors.length) {
            right = authors[location].name;
        }
        else {
            right = newAuthor.name;
        }
        
        if (compareStrings(newAuthor.name,left) < 0) {
            if (location > 0) {
                location--;
            }
            else {
                done = true;
            }
        }
        else if (compareStrings(newAuthor.name,right) > 0) {
            if (location < authors.length) {
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
    
    authors.splice(location,0,newAuthor);
    
    return location;
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

//update authors.json to match authors
function fileAuthors(proceed,fail) {
    fs.writeFile(dataDirectoryPath + "authors.json", JSON.stringify(authors), function(err) {
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
    const available = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()[]{}<>-+=/|\\,.?~;:"; //no spaces allowed
    let salt = "";
    
    if (seed == null) {
        for (let i=0; i<8; i++) {
            salt += available.charAt(Math.round(Math.random() * available.length));
        }
    }
    else {
        salt = seed;
    }
    
    let encrypted = input + salt;
    
    let bits = "";
    
    for (let i=0; i<encrypted.length; i++) {
        let byte = encrypted.charCodeAt(i).toString(2);
        
        while (byte.length < 8) {
            byte = "0" + byte;
        }
        
        bits += byte + " ";
    }
    bits = bits.substring(0,bits.length-1);
    
    for (let i=0; i<bits.length; i++) {
        if ((i%9 == 4 || i%9 == 6) && bits.charAt(i) != " ") { //the bit alternation placement ensures that the output characters are still within my available characters
            if (bits.charAt(i) == "0") {
                bits = bits.substring(0,i) + "1" + bits.substring(i+1);
            }
            else {
                bits = bits.substring(0,i) + "0" + bits.substring(i+1);
            }
        }
    }
    
    let start = 0;
    encrypted = "";
    
    while (start < bits.length) {
        let end = bits.indexOf(" ",start);
        
        if (end == -1) {
            end = bits.length;
        }
        
        let byte = bits.substring(start,end);
        const character = String.fromCharCode(parseInt(byte,2));
        
        encrypted += character;
        
        start = end+1;
    }
    
    encrypted += salt;
    
    return encrypted;
}

//compare lexicographically two strings (-1 = first<second, 0 = first=second, 1 = first>second)
function compareStrings(first,second) {
    let result = 0;
    
    for (let i=0; i<first.length && result == 0; i++) {
        if (i >= second.length) {
            result = 1;
        }
        else {
            let a = alphabet.indexOf(first.charAt(i).toLowerCase());
            let b = alphabet.indexOf(second.charAt(i).toLowerCase());
            
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