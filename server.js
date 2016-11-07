var express = require('express');
var app = express();

var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ip = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";

var server = app.listen(port,ip);    //settings for testing on home computer

app.use(express.static('public'));