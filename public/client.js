/* * * Description: A webpage with a bubble-chart layout for a game site * Author: Owen Gallagher * Start Date: 1 October 2016 * */var canvas;var parentID = "main";var images = [];var w = 500;var camera;var mobile = false;var mobileZoom = 0.7;var loading = -1;var home;var fan = 1.7;var cursor = {x: 0.0,y: 0.0};var featuredGames = []; //0 ... 9       0 to 9 refer to featuredGames[image]; 10 and up refer to searchedGames[image-10]var searchedGames = []; //10 ... ∞var searchTerms = "";var UPPER_CASE_REGEX = /^[A-Z]/; //currently used to check if the bubble is a game (all games are uppercase), meaning that its thumbnail won't come from images[].//--------------------------------------------------------------------- SETUPfunction preload() {    images.push(loadImage("./images/home0.png"));    images.push(loadImage("./images/home1.png"));    images.push(loadImage("./images/search0.png"));    images.push(loadImage("./images/search1.png"));    images.push(loadImage("./images/star0.png"));    images.push(loadImage("./images/star1.png"));    images.push(loadImage("./images/categories0.png"));    images.push(loadImage("./images/categories1.png"));    images.push(loadImage("./images/i0.png"));    images.push(loadImage("./images/i1.png"));    images.push(loadImage("./images/help0.png"));    images.push(loadImage("./images/help1.png"));    images.push(loadImage("./images/author0.png"));    images.push(loadImage("./images/author1.png"));    images.push(loadImage("./images/description0.png"));    images.push(loadImage("./images/description1.png"));    images.push(loadImage("./images/tag0.png"));    images.push(loadImage("./images/tag1.png"));    images.push(loadImage("./images/name0.png"));    images.push(loadImage("./images/name1.png"));    images.push(loadImage("./images/corduroy.jpg"));}function setup() {    canvas = createCanvas(document.getElementById(parentID).offsetWidth,document.getElementById(parentID).offsetHeight);    canvas.parent(parentID);        w = getDimension();        camera = new Camera();        mobile = mobileCheck();        home = new Bubble(0,0,0.5,0.5,0,0.4,new Label(0,"hubble"),5,""); //∆X,∆Y,anchorX,anchorY,initial,size,label,branches,link            home.addBranch(1,2,0.3,new Label(2,"search"),0,"/search");                                       //diametersAway,fan,size,label,branches,link            home.addBranch(1,2,0.3,new Label(4,"featured"),0,"/featured");            home.addBranch(1,2,0.3,new Label(6,"categories"),7,"");            home.bubbles[2].addBranch(1,fan,0.3,new Label(-1,"strategy"),0,"/newSearch");            home.bubbles[2].addBranch(1,fan,0.3,new Label(-1,"action"),0,"/newSearch");            home.bubbles[2].addBranch(1,fan,0.3,new Label(-1,"singleplayer"),0,"/newSearch");            home.bubbles[2].addBranch(1,fan,0.3,new Label(-1,"multiplayer"),0,"/newSearch");            home.bubbles[2].addBranch(1,fan,0.3,new Label(-1,"adventure"),0,"/newSearch");            home.bubbles[2].addBranch(1,fan,0.3,new Label(-1,"race"),0,"/newSearch");            home.bubbles[2].addBranch(1,fan,0.3,new Label(-1,"puzzle"),0,"/newSearch");            home.addBranch(1,2,0.3,new Label(8,"about"),3,"");            home.bubbles[3].addBranch(1,fan,0.3,new Label(12,"author"),0,"Owen Gallagher began creating hubble on 1 October 2016, at the beginning of his freshman year in college.");            home.bubbles[3].addBranch(1,fan,0.3,new Label(14,"description"),0,"hubble is a game hosting site, with a layout inspired by bubble charts and satellites.");            home.bubbles[3].addBranch(1,fan,0.3,new Label(-1,"version"),0,"");            home.addBranch(1,2,0.3,new Label(10,"help"),0,"");        cursor.x = width/2;    cursor.y = height/2;}//--------------------------------------------------------------------- DRAWfunction draw() {    //TEMPORARY vv    if (mobile) {        background("#555");    }    else {        image(images[images.length-1],0,0,images[images.length-1].width,images[images.length-1].height,0,0,width,height);    }    //TEMPORARY ^^        if (!mobile) {        updateCursor();    }        home.interact();    home.extendBranches();    home.updateAnchor();    home.enableBranches();    home.display();    home.displayText(); //text is displayed ontop of everything else        camera.zoom();    camera.move();}//--------------------------------------------------------------------- GENERAL FUNCTIONS//---------------------------------- RESIZE WINDOWfunction getDimension() {    var dimension = height;        if (width < height) {        dimension = width;    }        return dimension;}//---------------------------------- CHECK MOBILEfunction mobileCheck() {    //adapted from http://detectmobilebrowsers.com/ open-source code        var check = false;        (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);        return check;}//---------------------------------- UPDATE CURSORfunction updateCursor() {    cursor.x = mouseX;    cursor.y = mouseY;}//--------------------------------------------------------------------- CLASSES//---------------------------------- BUBBLEfunction Bubble(x,y,ax,ay,i,s,l,b,u) {    this.location = new p5.Vector(x,y);    this.anchor = new p5.Vector(ax,ay);    this.initial = i; //direction of this bubble to determine those of its branches    this.size = s; //diameter    this.label = l; //display on bubble    this.selected = false; //sets camera.anchor to bubble.location    this.origin = false; //if one of bubble.bubbles is selected, whiten branch    this.grow = 1.00; //for highlighting on hover    this.extension = 0.00; //for activating bubbles    this.bubbles = []; //bubbles attached to this one    this.branches = b; //number of bubbles attached    this.link = u; //link can be a url to a specific game site, a routed GET request to the server, or a dialogue box        this.addBranch = function(d,f,s,l,b,u) { //add element to this.bubbles;        var angle = f*PI;        angle = ((angle/this.branches) * (this.bubbles.length+0.5)) + this.initial;                var branch = new p5.Vector(cos(angle),sin(angle));        branch.mult(d*(this.size));                angle -= (1-((2-fan)*0.5))*PI;        if (angle > 2*PI) {            angle -= 2*PI;        }        else if (angle < 0) {            angle += 2*PI;        }                this.bubbles.push(new Bubble(branch.x,branch.y,((this.anchor.x*width) + (this.location.x*w)) / width,((this.anchor.y*height) + (this.location.y*w)) / height,angle,this.size*s,l,b,u));    }        this.interact = function() { //change size on hover; re-anchor camera if selected; this.origin if any branches are selected;        var difference = new p5.Vector(mouseX,mouseY);                var drawLocation = new p5.Vector(this.anchor.x * width,this.anchor.y * height);        drawLocation.add(this.location.x*w,this.location.y*w);        drawLocation.sub(camera.anchor);        drawLocation.mult(camera.z);        drawLocation.sub(camera.location);        drawLocation.add(camera.anchor);                difference.sub(drawLocation);        difference.div(camera.z);                if (difference.mag() < (this.size*w)/2) {            this.grow += (1.5-this.grow)*0.25;        }        else {            this.grow += (1-this.grow)*0.5;        }                if (this.selected) {            camera.anchored = true;            camera.anchorTarget.set((this.anchor.x*width) + (this.location.x*w),(this.anchor.y*height) + (this.location.y*w));                        if (mobile && this.link.length > 0 && this.link.indexOf("/") == -1) { // slide the camera over so the bubble is in the corner of the view                var direction = new p5.Vector(this.location.x * w,this.location.y * w);                direction.normalize();                                var angle = direction.heading();                                if (angle < 0) {                    angle += 2*PI;                }                else if (angle > 2*PI) {                    angle -= 2*PI;                }                                if (angle > 0.5*PI && angle < 1.5*PI) {                    if (angle < PI) {                        camera.anchorTarget.add(-0.5*this.size*width,0.5*this.size*height);                    }                    else {                        camera.anchorTarget.add(-0.5*this.size*width,-0.5*this.size*height);                    }                }                else {                    if (angle > 1.5*PI) {                        camera.anchorTarget.add(0.5*this.size*width,-0.5*this.size*height);                    }                    else {                        camera.anchorTarget.add(0.5*this.size*width,0.5*this.size*height);                    }                }            }        }    }        this.select = function() { //update this.selected based on: difference.mag(), this.selected, this.selectOrigin, branches.selectOrigin; re-zoom camera;        var selectOrigin = false;        var difference = new p5.Vector(mouseX,mouseY);                var drawLocation = new p5.Vector(this.anchor.x * width,this.anchor.y * height);        drawLocation.add(this.location.x*w,this.location.y*w);        drawLocation.sub(camera.anchor);        drawLocation.mult(camera.z);        drawLocation.sub(camera.location);        drawLocation.add(camera.anchor);                difference.sub(drawLocation);        difference.div(camera.z);                if (difference.mag() < this.size*w*0.5 || searchTerms.length > 0) { //searchTerms.length is greater than 0 when a tag bubble is selected. This will only happen for home.bubbles[0] (search)            if (this.selected) {                if (searchTerms.length > 0) {                    if (mobile) {                        camera.zTarget = 1/map(this.size,0,0.5,0,1/mobileZoom);                    }                    else {                        camera.zTarget = 1/map(this.size,0,0.5,0,1);                    }                }                                if (this.link.length > 0) {                    if (this.link.indexOf("http") > -1) {                        this.redirect();                    }                    else if (this.link === "/search") {                        //input search                                                var dialogue;                                                if (searchTerms.length > 0) {                            dialogue = searchTerms;                        }                        else {                            dialogue = prompt("Input terms for a game's title or tags.");                        }                                                if (dialogue != null && dialogue.length > 0) {                            searchTerms = "";                                                        dialogue = dialogue.toLowerCase();                            dialogue = (dialogue.match(/[0-9a-z ]/g)).join(""); //remove punctuation and symbols (EX: "owen's fav'rite (3d) game!" --> "owens favrite 3d game")                                                        home.bubbles[0].branches = 0;                            home.bubbles[0].bubbles = [];                                                        searchedGames = [];                                                        loading = 0;                                                        //send ajax request                            $.ajax({                                   url: "http://hubble-ojpgapps.rhcloud.com" + this.link,                                   type: "GET",                                   dataType: "json",                                   data: {terms: dialogue.split(" ")},                                   success: function (incoming) {                                        //search by name                                        if (incoming.name.length > 0) {                                            home.bubbles[0].branches++;                                                                               if (incoming.tags.length > 0) {                                                home.bubbles[0].branches++;                                            }                                                                               home.bubbles[0].addBranch(1,fan,0.3,new Label(18,"name"),0,"");                                                                               home.bubbles[0].bubbles[0].branches = incoming.name.length;                                                                               for (var n=0; n<incoming.name.length; n++) {                                                searchedGames.push(loadImage("./images/games/" + incoming.name[n].name + ".png"));                                                                                   home.bubbles[0].bubbles[0].addBranch(1,fan,0.3,new Label(searchedGames.length-1+10,incoming.name[n].name),4,incoming.name[n].url);                                                home.bubbles[0].bubbles[0].bubbles[n].addBranch(1,fan,0.3,new Label(12,"authors"),0,incoming.name[n].authors);                                                home.bubbles[0].bubbles[0].bubbles[n].addBranch(1,fan,0.3,new Label(14,"description"),0,incoming.name[n].description);                                                home.bubbles[0].bubbles[0].bubbles[n].addBranch(1,fan,0.3,new Label(16,"tags"),incoming.name[n].tags.length,"");                                                for (var i=0; i<incoming.name[n].tags.length; i++) {                                                    home.bubbles[0].bubbles[0].bubbles[n].bubbles[2].addBranch(1,fan,0.3,new Label(-1,incoming.name[n].tags[i]),0,"/newSearch");                                                }                                                home.bubbles[0].bubbles[0].bubbles[n].addBranch(1,fan,0.3,new Label(4,"rating"),0,incoming.name[n].rating);                                            }                                        }                                                                           //search by tags                                        if (incoming.tags.length > 0) {                                            if (incoming.name.length == 0) {                                                home.bubbles[0].branches++;                                            }                                                                               home.bubbles[0].addBranch(1,fan,0.3,new Label(16,"tags"),0,"");                                                                               home.bubbles[0].bubbles[home.bubbles[0].branches-1].branches = incoming.tags.length;                                                                               for (var t=0; t<incoming.tags.length; t++) {                                                searchedGames.push(loadImage("./images/games/" + incoming.tags[t].name + ".png"));                                                                                   home.bubbles[0].bubbles[home.bubbles[0].branches-1].addBranch(1,fan,0.3,new Label(searchedGames.length-1+10,incoming.tags[t].name),4,incoming.tags[t].url);                                                home.bubbles[0].bubbles[home.bubbles[0].branches-1].bubbles[t].addBranch(1,fan,0.3,new Label(12,"authors"),0,incoming.tags[t].authors);                                                home.bubbles[0].bubbles[home.bubbles[0].branches-1].bubbles[t].addBranch(1,fan,0.3,new Label(14,"description"),0,incoming.tags[t].description);                                                home.bubbles[0].bubbles[home.bubbles[0].branches-1].bubbles[t].addBranch(1,fan,0.3,new Label(16,"tags"),incoming.tags[t].tags.length,"");                                                for (var i=0; i<incoming.tags[t].tags.length; i++) {                                                    home.bubbles[0].bubbles[home.bubbles[0].branches-1].bubbles[t].bubbles[2].addBranch(1,fan,0.3,new Label(-1,incoming.tags[t].tags[i]),0,"/newSearch");                                                }                                                home.bubbles[0].bubbles[home.bubbles[0].branches-1].bubbles[t].addBranch(1,fan,0.3,new Label(4,"rating"),0,incoming.tags[t].rating);                                            }                                        }                                                                           loading = -1;                                   }                                   });                        }                    }                }            }            else if (this.extension > 0.01 || (this.location.x == 0 && this.location.y == 0)) {                this.selected = true;                if (mobile) {                    camera.zTarget = 1/map(this.size,0,0.5,0,1/mobileZoom);                }                else {                    camera.zTarget = 1/map(this.size,0,0.5,0,1);                }                                if (this.link.length > 0) {                    if (this.link === "/featured" && featuredGames.length == 0) {                        //$ refers to the jquery library                        //ajax() sends an http message to the url, in this case to get an array of featured games stored on the server.                                                loading = 0;                                                $.ajax({                               url: "http://hubble-ojpgapps.rhcloud.com" + this.link,                               type: "GET",                               dataType: "json",                               success: function(incoming) {                                   home.bubbles[1].branches = incoming.length;                                                                  for (var i=0; i<incoming.length; i++) {                                        featuredGames.push(loadImage("./images/games/" + incoming[i].name + ".png"));                                        home.bubbles[1].addBranch(1,fan,0.3,new Label(i, incoming[i].name),4,incoming[i].url);                                            home.bubbles[1].bubbles[i].addBranch(1,fan,0.3,new Label(12,"authors"),0,incoming[i].authors);                                            home.bubbles[1].bubbles[i].addBranch(1,fan,0.3,new Label(14,"description"),0,incoming[i].description);                                            home.bubbles[1].bubbles[i].addBranch(1,fan,0.3,new Label(16,"tags"),incoming[i].tags.length,"");                                            for (var t=0; t<incoming[i].tags.length; t++) {                                                home.bubbles[1].bubbles[i].bubbles[2].addBranch(1,fan,0.3,new Label(-1,incoming[i].tags[t]),0,"/newSearch");                                            }                                            home.bubbles[1].bubbles[i].addBranch(1,fan,0.3,new Label(4,"rating"),0,incoming[i].rating);                                   }                                                                  loading = -1;                               }                               });                    }                    else if (this.link == "/newSearch") {                        searchTerms = this.label.name;                                                this.selected = false;                        home.bubbles[0].selected = true;                        home.bubbles[0].select();                    }                }            }        }        else if (this.selected) {            this.selected = false;                        if (mobile && !(this.location.x == 0 && this.location.y == 0)) {                selectOrigin = true;            }            else {                camera.anchored = false;            }        }                for (var i=0; i<this.bubbles.length; i++) {            if (this.bubbles[i].select() && !this.selected) {                this.selected = true;                camera.zTarget = 1/map(this.size,0,0.5,0,1/mobileZoom);            }            if (this.bubbles[i].selected) {                selectOrigin = false;            }        }                if (this.selected || home.bubbles[0].selected) { //the second expression is needed because if categories.bubble is clicked, search is selected, but categories.select() also returns true.            selectOrigin = false;        }                return selectOrigin;    }        this.originate = function() { //update this.bubbles.origin, then update this.origin        this.origin = false;                for (var i=0; i<this.bubbles.length && !this.origin; i++) {            this.bubbles[i].originate();                        if (this.bubbles[i].selected || this.bubbles[i].origin) {                this.origin = true;            }        }        for (var i=0; i<this.bubbles.length && !this.origin; i++) {            if (this.bubbles[i].selected || this.bubbles[i].origin) {                this.origin = true;            }        }    }        this.extendBranches = function() { //update this.extension and this.bubbles.extension based on this.selected and this.origin        if (this.origin || this.selected) {            for (var i=0; i<this.bubbles.length; i++) {                this.bubbles[i].extension += (1.00 - this.bubbles[i].extension) * 0.1;            }        }        else {            for (var i=0; i<this.bubbles.length; i++) {                this.bubbles[i].extension *= 0.9;            }        }    }        this.redirect = function() { //tell browser to find the game's website        if (this.link.length > 0) {            window.location.assign(this.link);        }    }        this.updateAnchor = function() { //update branches.anchor;        for (var i=0; i<this.branches; i++) {            this.bubbles[i].anchor.set(((this.anchor.x*width) + (this.location.x * w * this.extension)) / width,((this.anchor.y*height) + (this.location.y * w * this.extension)) / height);        }    }        this.display = function() { //display bubble and lines colored according to this.selected and this.origin        if (this.extension > 0.01 || (this.location.x == 0 && this.location.y == 0)) {            var drawAnchor = new p5.Vector(this.anchor.x * width,this.anchor.y * height);            drawAnchor.sub(camera.anchor);            drawAnchor.mult(camera.z);            drawAnchor.sub(camera.location);            drawAnchor.add(camera.anchor);                        var drawLocation = new p5.Vector(this.anchor.x * width,this.anchor.y * height);            drawLocation.add(this.location.x * w * this.extension,this.location.y * w * this.extension);            drawLocation.sub(camera.anchor);            drawLocation.mult(camera.z);            drawLocation.sub(camera.location);            drawLocation.add(camera.anchor);                        var drawSize = this.size * w * camera.z;                        if (this.selected && loading >= 0) {                if (loading < PI*2) {                    loading += PI*0.02;                }                else {                    loading = 0;                }                                drawSize += abs(sin(loading)) * (drawSize * 0.08);            }                        push()                        if (drawLocation.x + (drawSize * 0.5) > 0 && drawLocation.y + (drawSize * 0.5) > 0 && drawLocation.x - (drawSize * 0.5) < width && drawLocation.y - (drawSize * 0.5) < height) {                noFill();                if (this.selected || this.origin) {                    stroke(255);                }                else {                    stroke(0);                }                strokeWeight(2);                line(drawAnchor.x,drawAnchor.y,drawLocation.x,drawLocation.y);                                if (this.label != null) {                    if (this.grow > 1 && this.label.name != null) { //show name                        translate(drawLocation.x,drawLocation.y);                                                noStroke();                        fill(255);                        if (mobile) {                            textSize(2.5 * (constrain(drawSize,w*0.25,w) * 0.1) * this.grow);                        }                        else {                            textSize((drawSize * 0.1) * this.grow);                        }                        textFont("Courier New");                        textAlign(CENTER);                                                var letter;                        var letterR = (drawSize * 0.5) + (textSize() * 0.5);                        if (mobile) {                            letterR -= textSize() * 0.3;                        }                        var letterAV = constrain((drawSize*0.01) * PI * 0.015,PI*0.04,PI*0.08);                        if (mobile) {                            letterAV = constrain(pow(textSize() * PI * 0.0015,0.6),PI*0.1,PI*0.16);                        }                        var letterA = (PI * 1.5) - (0.5 * letterAV * (this.label.name.length-1));                        var letterX;                        var letterY;                                                for (var i=0; i<this.label.name.length; i++) {                            letter = this.label.name.charAt(i);                                                        letterX = letterR * cos(letterA + (i*letterAV));                            letterY = letterR * sin(letterA + (i*letterAV));                                                        translate(letterX,letterY);                            rotate(letterA + (i*letterAV) - (PI * 1.5));                                                        text(letter,0,0);                                                        rotate(-1*(letterA + (i*letterAV) - (PI * 1.5)));                            translate(-1*letterX,-1*letterY);                        }                                                translate(-1*drawLocation.x,-1*drawLocation.y);                    }                                        if (this.label.image > -1) { //show icon                        imageMode(CENTER);                                                if (UPPER_CASE_REGEX.test(this.label.name)) {                            if (this.label.image > 9) {                                image(searchedGames[this.label.image-10],0,0,searchedGames[this.label.image-10].width,searchedGames[this.label.image-10].height,drawLocation.x,drawLocation.y,drawSize,drawSize);                            }                            else {                                image(featuredGames[this.label.image],0,0,featuredGames[this.label.image].width,featuredGames[this.label.image].height,drawLocation.x,drawLocation.y,drawSize,drawSize);                            }                        }                        else {                            if ((this.selected || this.origin) && this.label.image % 2 == 0) {                                image(images[this.label.image+1],0,0,images[this.label.image+1].width,images[this.label.image+1].height,drawLocation.x,drawLocation.y,drawSize,drawSize);                            }                            else {                                image(images[this.label.image],0,0,images[this.label.image].width,images[this.label.image].height,drawLocation.x,drawLocation.y,drawSize,drawSize);                            }                        }                    }                    else {                        if (this.selected || this.origin) {                            fill(255);                        }                        else {                            fill(0);                        }                        noStroke();                        ellipse(drawLocation.x,drawLocation.y,drawSize,drawSize);                    }                }                else {                    if (this.selected || this.origin) {                        fill(255);                    }                    else {                        fill(0);                    }                    noStroke();                    ellipse(drawLocation.x,drawLocation.y,drawSize,drawSize);                }            }                        pop();        }    }        this.displayText = function() { //show dialogueBox        for (var i=0; i<this.bubbles.length; i++) {            this.bubbles[i].displayText();        }                if (this.selected && this.link.length > 0 && this.link.indexOf("/") == -1) {            var drawLocation = new p5.Vector(this.anchor.x * width,this.anchor.y * height);            drawLocation.add(this.location.x * w * this.extension,this.location.y * w * this.extension);            drawLocation.sub(camera.anchor);            drawLocation.mult(camera.z);            drawLocation.sub(camera.location);            drawLocation.add(camera.anchor);                        var drawSize = this.size * w * camera.z;                        if (drawLocation.x + (drawSize * 0.5) > 0 && drawLocation.y + (drawSize * 0.5) > 0 && drawLocation.x - (drawSize * 0.5) < width && drawLocation.y - (drawSize * 0.5) < height) {                push()                                fill(255);                noStroke();                textFont("Courier New");                                if (mobile) {                    textSize(drawSize * 0.2);                }                else {                    textSize(drawSize * 0.1);                }                                if (drawLocation.x >= width/2) {                    if (drawLocation.y < height/2) {                        textAlign(LEFT,BOTTOM);                                                if (mobile) {                            text(this.link,10,drawLocation.y+(drawSize*0.6),width,height - (drawLocation.y+(drawSize*0.6)));                        }                        else {                            text(this.link,10,0,drawLocation.x - (drawSize * 0.6) - textSize(),height);                        }                    }                    else {                        textAlign(LEFT,TOP);                                                if (mobile) {                            text(this.link,10,0,width,drawLocation.y - (drawSize * 0.6));                        }                        else {                            text(this.link,10,0,drawLocation.x - (drawSize * 0.6) - textSize(),height);                        }                    }                }                else {                    if (drawLocation.y < height/2) {                        textAlign(RIGHT,BOTTOM);                                                if (mobile) {                            text(this.link,10,drawLocation.y+(drawSize*0.6),width,height - (drawLocation.y+(drawSize*0.6)));                        }                        else {                            text(this.link,drawLocation.x + (drawSize * 0.6),0,width - (drawLocation.x + (drawSize * 0.5)) - textSize(),height);                        }                    }                    else {                        textAlign(RIGHT,TOP);                                                if (mobile) {                            text(this.link,10,0,width,drawLocation.y - (drawSize * 0.6));                        }                        else {                            text(this.link,drawLocation.x + (drawSize * 0.6),0,width - (drawLocation.x + (drawSize * 0.5)) - textSize(),height);                        }                    }                }                                pop();            }        }    }        this.enableBranches = function() {        for (var i=0; i<this.bubbles.length; i++) {            this.bubbles[i].interact();            this.bubbles[i].extendBranches();            this.bubbles[i].updateAnchor();            this.bubbles[i].enableBranches();            this.bubbles[i].display();        }    }}//---------------------------------- LABELfunction Label(i,n) {    this.image = i;    this.name = n;}//---------------------------------- CAMERAfunction Camera() {    this.location = new p5.Vector(cursor.x-(width/2),cursor.y-(height/2));    this.anchor = new p5.Vector(width/2,height/2);    this.anchorTarget = new p5.Vector(width/2,height/2);    this.anchored = false;    this.speed = 0.2;    this.z = 1;    this.zTarget = 1;        this.move = function() {        if (!this.anchored) {            this.anchorTarget.set(width/2,height/2);        }                var velocity = new p5.Vector();        velocity.set(this.anchorTarget);        velocity.sub(this.anchor);        if (this.zTarget > this.z) {            velocity.mult(this.speed);            this.anchor.add(velocity);        }        else if ((this.z - this.zTarget)/this.z < 0.2) {            velocity.mult(this.speed*0.5);            this.anchor.add(velocity);        }                if (mobile) {            cursor.x = width/2;            cursor.y = height/2;        }                velocity.set(cursor.x - width,cursor.y - height);        velocity.add(this.anchor);        velocity.sub(this.location);        velocity.mult(this.speed);        this.location.add(velocity);    }        this.zoom = function() {        if (!this.anchored) {            if (mobile) {                this.zTarget = mobileZoom;            }            else {                this.zTarget = 1;            }        }                var change = this.speed * (this.zTarget-this.z);                if (this.zTarget > this.z) {            var velocity = new p5.Vector();            velocity.set(this.anchorTarget);            velocity.sub(this.anchor);                        if (velocity.mag() > 0.01) {                this.z += change / (velocity.mag() * (w/this.z));            }            else {                this.z += change;            }        }        else {            this.z += change;        }    }}//--------------------------------------------------------------------- OVERRIDES//---------------------------------- FIX CANVASfunction windowResized() {    document.getElementById(parentID).style.width = "100%";    document.getElementById(parentID).style.height = "100%";        resizeCanvas(windowWidth, windowHeight);        w = getDimension();}//---------------------------------- DISABLE SCROLLINGfunction mouseWheel(event) {    return false;}//---------------------------------- DISABLE ZOOMINGfunction mousePressed() {    return false;}//---------------------------------- SELECTIONfunction mouseReleased() {    home.select();    home.originate();        return false;}//---------------------------------- DISABLE SCROLLINGfunction mouseDragged() {    return false;}//---------------------------------- DISABLE SCROLLINGfunction touchMoved() {    return false;}//---------------------------------- DISABLE ZOOMINGfunction touchStarted() {    return false;}//---------------------------------- DISABLE ZOOMING + SELECTIONfunction touchEnded() {    home.select();    home.originate();        return false;}