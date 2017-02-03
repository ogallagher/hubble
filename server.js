var express = require("express");
var app = express();

var games = require("./games.json");

var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ip = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";

app.use(express.static("public"));

app.get("/search", function(request,response) {
        //search games.json by name, authors, and tags
        });

app.get("/category", function(request,response) {
        //search games.json by categories key
        });

app.get("/featured", function(request,response) {
        //search games by game.featured
        var result = [];
        
        for (var i=0; i<games.length; i++) {
            if (games[i].featured === "y") {
                result.push(games[i]);
            }
        }
        
        response.send(JSON.stringify(result));
        });

var server = app.listen(port,ip);