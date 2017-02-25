var express = require("express");
var app = express();

var games = require("./games.json");
/*
 
 ORDER
 A  B  C  D  E  F  G  H  I  J  K  L  M  N  O  P  Q  R  S  T  U  V  W  X  Y  Z  0  1  2  3  4  5  6  7  8  9
 1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36
 
 games is arranged lexicographically by different terms.
 
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
        
        for (var i=0; i<searchTerms.length; i++) {
            if (searchTerms[i].length > 0) {
                //name search
                var start = alphabet.indexOf(searchTerms[i].charAt(0));
                start = Math.round((start / alphabet.length) * games.byName.length);
            
                var away = 0;
                var stop = false;
                var stopP = false;
                var stopN = false;
            
                while (resultNames.length < RESULT_MAX && !stop) {
                    if (!stopP && start+away < games.byName.length) {
                        if (games.byName[start+away].name.toLowerCase().indexOf(searchTerms[i]) > -1 && resultNames.indexOf(games.byName[start+away]) == -1) {
                            resultNames.push(games.byName[start+away]);
                        }
                    }
                    else {
                        stopP = true;
                    }
            
                    if (away > 0) {
                        if (!stopN && start-away >= 0) {
                            if (games.byName[start-away].name.toLowerCase().indexOf(searchTerms[i]) > -1 && resultNames.indexOf(games.byName[start-away]) == -1) {
                                resultNames.push(games.byName[start-away]);
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
            
                //tag search
                for (var r=0; resultTags.length < RESULT_MAX && r<games.byRating.length; r++) {
                    var tagMatch = false;
        
                    for (var t=0; !tagMatch && t<games.byRating[r].tags.length; t++) {
                        if (games.byRating[r].tags[t].indexOf(searchTerms[i]) > -1 && resultTags.indexOf(games.byName[games.byRating[r].index]) == -1) {
                            resultTags.push(games.byName[games.byRating[r].index]);
                            tagMatch = true;
                        }
                    }
                }
            }
        }
        
        var result = {
                        name: resultNames,
                        tags: resultTags
                     };
        
        response.send(JSON.stringify(result));
        
        });

app.get("/category", function(request,response) {
        //search games.json by categories key
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

var server = app.listen(port,ip);