var express = require('express');
var app = express();

var server = app.listen(8080);    //settings for testing on home computer

app.use(express.static('public'));