/* * Description: A webpage with a bubble-chart layout for a game site * Author: Owen Gallagher * Date: 1 October 2016 */var canvas;var parentID = "main";var backdrop;var w = 500;var camera;var home;var fan = 1.7;//--------------------------------------------------------------------- SETUPfunction preload() {    backdrop = loadImage("./images/jelly.jpg");}function setup() {    canvas = createCanvas(document.getElementById(parentID).offsetWidth,document.getElementById(parentID).offsetHeight);    canvas.parent(parentID);        w = getDimension();        camera = new Camera();        home = new Bubble(0,0,0.5,0.5,0,0.4,"",3); //∆X,∆Y,anchorX,anchorY,initial,size,label,branches        home.addBranch(1,2,0.3,"",5);            home.bubbles[0].addBranch(1,fan,0.3,"",0); //diametersAway,fan,size,label,branches            home.bubbles[0].addBranch(1,fan,0.3,"",0);            home.bubbles[0].addBranch(1,fan,0.3,"",0);            home.bubbles[0].addBranch(1,fan,0.3,"",0);            home.bubbles[0].addBranch(1,fan,0.3,"",0);        home.addBranch(1,2,0.3,"",3);            home.bubbles[1].addBranch(1,fan,0.3,"",5);                home.bubbles[1].bubbles[0].addBranch(1,fan,0.3,"",0);                home.bubbles[1].bubbles[0].addBranch(1,fan,0.3,"",0);                home.bubbles[1].bubbles[0].addBranch(1,fan,0.3,"",0);                home.bubbles[1].bubbles[0].addBranch(1,fan,0.3,"",0);                home.bubbles[1].bubbles[0].addBranch(1,fan,0.3,"",0);            home.bubbles[1].addBranch(1,fan,0.3,"",0);            home.bubbles[1].addBranch(1,fan,0.3,"",0);        home.addBranch(1,2,0.3,"",7);            home.bubbles[2].addBranch(1,fan,0.3,"",0);            home.bubbles[2].addBranch(1,fan,0.3,"",0);            home.bubbles[2].addBranch(1,fan,0.3,"",0);            home.bubbles[2].addBranch(1,fan,0.3,"",0);            home.bubbles[2].addBranch(1,fan,0.3,"",0);            home.bubbles[2].addBranch(1,fan,0.3,"",0);            home.bubbles[2].addBranch(1,fan,0.3,"",0);}//--------------------------------------------------------------------- DRAWfunction draw() {    //background("#555"); //not necessary if an image taking up the whole canvas is displayed ontop    image(backdrop,0,0,backdrop.width,backdrop.height,0,0,width,height);        home.interact();    home.updateAnchor();    home.enableBranches();    home.display();        camera.zoom();    camera.move();}//--------------------------------------------------------------------- GENERAL FUNCTIONS//---------------------------------- RESIZE WINDOWfunction getDimension() {    var dimension = height;        if (width < height) {        dimension = width;    }        return dimension;}//--------------------------------------------------------------------- CLASSES//---------------------------------- BUBBLEfunction Bubble(x,y,ax,ay,i,s,l,b) {    this.location = new p5.Vector(x,y);    this.anchor = new p5.Vector(ax,ay);    this.initial = i;    this.size = s; //diameter    this.label = l; //display on bubble    this.selected = false; //sets camera.anchor to bubble.location    this.origin = false; //if one of bubble.bubbles is selected, whiten branch    this.grow = 1.00;    this.spin = 0.00; //for activating bubbles    this.bubbles = []; //bubbles attached to this one    this.branches = b; //number of bubbles attached        this.addBranch = function(d,f,s,l,b) { //add element to this.bubbles        var angle = f*PI;        angle = ((angle/this.branches) * (this.bubbles.length+0.5)) + this.initial;                var branch = new p5.Vector(cos(angle),sin(angle));        branch.mult(d*(this.size));                angle -= (1-((2-fan)*0.5))*PI;        if (angle > 2*PI) {            angle -= 2*PI;        }        else if (angle < 0) {            angle += 2*PI;        }                this.bubbles.push(new Bubble(branch.x,branch.y,((this.anchor.x*width) + (this.location.x*w)) / width,((this.anchor.y*height) + (this.location.y*w)) / height,angle,this.size*s,l,b));    }        this.interact = function() {        var difference = new p5.Vector(mouseX,mouseY);                var drawLocation = new p5.Vector(this.anchor.x * width,this.anchor.y * height);        drawLocation.add(this.location.x*w,this.location.y*w);        drawLocation.sub(camera.anchor);        drawLocation.mult(camera.z);        drawLocation.sub(camera.location);        drawLocation.add(camera.anchor);                difference.sub(drawLocation);        difference.div(camera.z);                if (difference.mag() < (this.size*w)/2) {            this.grow += (1.5-this.grow)*0.25;        }        else {            this.grow += (1-this.grow)*0.5;        }            if (this.selected) {            camera.anchored = true;            camera.anchorTarget.set((this.anchor.x*width) + (this.location.x*w),(this.anchor.y*height) + (this.location.y*w));        }        else {            this.origin = false;                        for (var i=0; i<this.bubbles.length && !this.origin; i++) {                if (this.bubbles[i].selected || this.bubbles[i].origin) {                    this.origin = true;                }            }        }    }        this.select = function() {        var difference = new p5.Vector(mouseX,mouseY);                var drawLocation = new p5.Vector(this.anchor.x * width,this.anchor.y * height);        drawLocation.add(this.location.x*w,this.location.y*w);        drawLocation.sub(camera.anchor);        drawLocation.mult(camera.z);        drawLocation.sub(camera.location);        drawLocation.add(camera.anchor);                difference.sub(drawLocation);        difference.div(camera.z);                if (difference.mag() < (this.size*w)/2) {            this.selected = true;            camera.zTarget = 1/map(this.size,0,0.5,0,1);        }        else if (this.selected) {            this.selected = false;            camera.anchored = false;        }                for (var i=0; i<this.bubbles.length; i++) {            this.bubbles[i].select();        }    }        this.updateAnchor = function() {        for (var i=0; i<this.branches; i++) {            this.bubbles[i].anchor.set(((this.anchor.x*width) + (this.location.x*w)) / width,((this.anchor.y*height) + (this.location.y*w)) / height);        }    }        this.display = function() {        var drawLocation = new p5.Vector(this.anchor.x * width,this.anchor.y * height);        drawLocation.add(this.location.x*w,this.location.y*w);                push()                noFill();        if (this.selected || this.origin) {            stroke(255);        }        else {            stroke(0);        }        strokeWeight(2);        line((camera.z * ((this.anchor.x*width) - camera.anchor.x)) - camera.location.x + camera.anchor.x,(camera.z * ((this.anchor.y*height) - camera.anchor.y)) - camera.location.y + camera.anchor.y,(camera.z * (drawLocation.x - camera.anchor.x)) - camera.location.x + camera.anchor.x,(camera.z * (drawLocation.y - camera.anchor.y)) - camera.location.y + camera.anchor.y);                if (this.selected || this.origin) {            fill(255);        }        else {            fill(0);        }        noStroke();        ellipse((camera.z * (drawLocation.x - camera.anchor.x)) - camera.location.x + camera.anchor.x,(camera.z * (drawLocation.y - camera.anchor.y)) - camera.location.y + camera.anchor.y,this.size * this.grow * w * camera.z,this.size * this.grow * w * camera.z);                pop();    }        this.enableBranches = function() {        for (var i=0; i<this.bubbles.length; i++) {            this.bubbles[i].interact();            this.bubbles[i].updateAnchor();            this.bubbles[i].enableBranches();            this.bubbles[i].display();        }    }}//---------------------------------- CAMERAfunction Camera() {    this.location = new p5.Vector(mouseX-(width/2),mouseY-(height/2));    this.anchor = new p5.Vector(width/2,height/2);    this.anchorTarget = new p5.Vector(width/2,height/2);    this.anchored = false;    this.speed = 0.2;    this.z = 1;    this.zTarget = 1;        this.move = function() {        if (!this.anchored) {            this.anchorTarget.set(width/2,height/2);        }            var velocity = new p5.Vector();        velocity.set(this.anchorTarget);        velocity.sub(this.anchor);        if (this.zTarget > this.z) {            velocity.mult(this.speed);            this.anchor.add(velocity);        }        else if ((this.z - this.zTarget)/this.z < 0.2) {            velocity.mult(this.speed*0.5);            this.anchor.add(velocity);        }                velocity.set(mouseX - width,mouseY - height);        velocity.add(this.anchor);        velocity.sub(this.location);        velocity.mult(this.speed);        this.location.add(velocity);    }        this.zoom = function() {        if (!this.anchored) {            this.zTarget = 1;        }                var change = this.speed * (this.zTarget-this.z);                if (this.zTarget > this.z) {            var velocity = new p5.Vector();            velocity.set(this.anchorTarget);            velocity.sub(this.anchor);                        if (velocity.mag() > 0.01) {                this.z += change / (velocity.mag() * (w/this.z));            }            else {                this.z += change;            }        }        else {            this.z += change;        }    }}//--------------------------------------------------------------------- OVERRIDES//---------------------------------- FIX CANVASfunction windowResized() {    document.getElementById(parentID).style.width = "100%";    document.getElementById(parentID).style.height = "100%";        resizeCanvas(windowWidth, windowHeight);        w = getDimension();}//---------------------------------- DISABLE SCROLLINGfunction mouseWheel(event) {    return false;}//---------------------------------- DISABLE ZOOMINGfunction mousePressed() {    return false;}//---------------------------------- SELECTIONfunction mouseReleased() {    home.select();        return false;}//---------------------------------- DISABLE SCROLLINGfunction mouseDragged() {    return false;}//---------------------------------- DISABLE SCROLLINGfunction touchMoved() {    return false;}//---------------------------------- DISABLE ZOOMINGfunction touchStarted() {    return false;}//---------------------------------- DISABLE ZOOMING + SELECTIONfunction touchEnded() {    home.select();        return false;}