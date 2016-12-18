/* * Description: A webpage with a bubble-chart layout for a game site * Author: Owen Gallagher * Date: 1 October 2016 */var canvas;var parentID = "main";var backdrop;var w = 500;var camera;var mobile = false;var cursor = {x: 0.0,y: 0.0};var home;var mobileZoom = 0.7;var fan = 1.7;var size = 0.3;//--------------------------------------------------------------------- SETUPfunction preload() {    backdrop = loadImage("./images/jelly.jpg");}function setup() {    canvas = createCanvas(document.getElementById(parentID).offsetWidth,document.getElementById(parentID).offsetHeight);    canvas.parent(parentID);        w = getDimension();        camera = new Camera();        mobile = mobileCheck();        home = new Bubble(0,0,0.5,0.5,0,0.4,"",3,""); //∆X,∆Y,anchorX,anchorY,initial,size,label,branches,url        home.addBranch(1,2,size,"",5,"");            home.bubbles[0].addBranch(1,fan,size,"",0,""); //diametersAway,fan,size,label,branches,url            home.bubbles[0].addBranch(1,fan,size,"",0,"");            home.bubbles[0].addBranch(1,fan,size,"",0,"");            home.bubbles[0].addBranch(1,fan,size,"",0,"");            home.bubbles[0].addBranch(1,fan,size,"",0,"");        home.addBranch(1,2,size,"",3,"");            home.bubbles[1].addBranch(1,fan,size,"",5,"");                home.bubbles[1].bubbles[0].addBranch(1,fan,size,"",0,"");                    /*home.bubbles[1].bubbles[0].bubbles[0].addBranch(1,fan,size,"",0,"");                    home.bubbles[1].bubbles[0].bubbles[0].addBranch(1,fan,size,"",0,"");                    home.bubbles[1].bubbles[0].bubbles[0].addBranch(1,fan,size,"",0,"");                    home.bubbles[1].bubbles[0].bubbles[0].addBranch(1,fan,size,"",0,"");*/                home.bubbles[1].bubbles[0].addBranch(1,fan,size,"",0,"");                home.bubbles[1].bubbles[0].addBranch(1,fan,size,"",0,"");                home.bubbles[1].bubbles[0].addBranch(1,fan,size,"",0,"");                home.bubbles[1].bubbles[0].addBranch(1,fan,size,"",0,"");            home.bubbles[1].addBranch(1,fan,size,"",0,"");            home.bubbles[1].addBranch(1,fan,size,"",0,"");        home.addBranch(1,2,size,"",7,"");            home.bubbles[2].addBranch(1,fan,size,"",0,"");            home.bubbles[2].addBranch(1,fan,size,"",0,"");            home.bubbles[2].addBranch(1,fan,size,"",0,"");            home.bubbles[2].addBranch(1,fan,size,"",0,"");            home.bubbles[2].addBranch(1,fan,size,"",0,"");            home.bubbles[2].addBranch(1,fan,size,"",0,"");            home.bubbles[2].addBranch(1,fan,size,"",0,"");        cursor.x = width/2;    cursor.y = height/2;}//--------------------------------------------------------------------- DRAWfunction draw() {    //TEMPORARY vv    if (mobile) {        background("#555");    }    else {        image(backdrop,0,0,backdrop.width,backdrop.height,0,0,width,height);    }    //TEMPORARY ^^        if (!mobile) {        updateCursor();    }        home.interact();    home.updateAnchor();    home.enableBranches();    home.display();        camera.zoom();    camera.move();}//--------------------------------------------------------------------- GENERAL FUNCTIONS//---------------------------------- RESIZE WINDOWfunction getDimension() {    var dimension = height;        if (width < height) {        dimension = width;    }        return dimension;}//---------------------------------- CHECK MOBILEfunction mobileCheck() {    //adapted from http://detectmobilebrowsers.com/ open-source code        var check = false;        (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);        return check;};//---------------------------------- UPDATE CURSORfunction updateCursor() {    cursor.x = mouseX;    cursor.y = mouseY;}//--------------------------------------------------------------------- CLASSES//---------------------------------- BUBBLEfunction Bubble(x,y,ax,ay,i,s,l,b,u) {    this.location = new p5.Vector(x,y);    this.anchor = new p5.Vector(ax,ay);    this.initial = i; //direction of this bubble to determine those of its branches    this.size = s; //diameter    this.label = l; //display on bubble    this.selected = false; //sets camera.anchor to bubble.location    this.origin = false; //if one of bubble.bubbles is selected, whiten branch    this.grow = 1.00;    this.spin = 0.00; //for activating bubbles    this.bubbles = []; //bubbles attached to this one    this.branches = b; //number of bubbles attached    this.url = u; //url to a specific game site        this.addBranch = function(d,f,s,l,b,u) { //add element to this.bubbles;        var angle = f*PI;        angle = ((angle/this.branches) * (this.bubbles.length+0.5)) + this.initial;                var branch = new p5.Vector(cos(angle),sin(angle));        branch.mult(d*(this.size));                angle -= (1-((2-fan)*0.5))*PI;        if (angle > 2*PI) {            angle -= 2*PI;        }        else if (angle < 0) {            angle += 2*PI;        }                this.bubbles.push(new Bubble(branch.x,branch.y,((this.anchor.x*width) + (this.location.x*w)) / width,((this.anchor.y*height) + (this.location.y*w)) / height,angle,this.size*s,l,b,u));    }        this.interact = function() { //change size on hover; re-anchor camera if selected; this.origin if any branches are selected;        var difference = new p5.Vector(mouseX,mouseY);                var drawLocation = new p5.Vector(this.anchor.x * width,this.anchor.y * height);        drawLocation.add(this.location.x*w,this.location.y*w);        drawLocation.sub(camera.anchor);        drawLocation.mult(camera.z);        drawLocation.sub(camera.location);        drawLocation.add(camera.anchor);                difference.sub(drawLocation);        difference.div(camera.z);                if (difference.mag() < (this.size*w)/2) {            this.grow += (1.5-this.grow)*0.25;        }        else {            this.grow += (1-this.grow)*0.5;        }            if (this.selected) {            camera.anchored = true;            camera.anchorTarget.set((this.anchor.x*width) + (this.location.x*w),(this.anchor.y*height) + (this.location.y*w));        }        else {            this.origin = false;                        for (var i=0; i<this.bubbles.length && !this.origin; i++) {                if (this.bubbles[i].selected || this.bubbles[i].origin) {                    this.origin = true;                }            }        }    }        this.select = function() { //update this.selected based on: difference.mag(), this.selected, this.selectOrigin, branches.selectOrigin; re-zoom camera;        var selectOrigin = false;        var difference = new p5.Vector(mouseX,mouseY);                var drawLocation = new p5.Vector(this.anchor.x * width,this.anchor.y * height);        drawLocation.add(this.location.x*w,this.location.y*w);        drawLocation.sub(camera.anchor);        drawLocation.mult(camera.z);        drawLocation.sub(camera.location);        drawLocation.add(camera.anchor);                difference.sub(drawLocation);        difference.div(camera.z);                if (difference.mag() < (this.size*w)/2) {            if (this.selected && this.url.length > 0) {                this.redirect();            }            else {                this.selected = true;                if (mobile) {                    camera.zTarget = 1/map(this.size,0,0.5,0,1/mobileZoom);                }                else {                    camera.zTarget = 1/map(this.size,0,0.5,0,1);                }            }        }        else if (this.selected) {            this.selected = false;                        if (mobile && !(this.location.x == 0 && this.location.y == 0)) {                selectOrigin = true;            }            else {                camera.anchored = false;            }        }                for (var i=0; i<this.bubbles.length; i++) {            if (this.bubbles[i].select() && !this.selected) {                this.selected = true;                camera.zTarget = 1/map(this.size,0,0.5,0,1/mobileZoom);            }            if (this.bubbles[i].selected) {                selectOrigin = false;            }        }                if (this.selected) {            selectOrigin = false;        }                return selectOrigin;    }        this.redirect = function() { //tell browser to find the game's website        if (this.url.length > 0) {            window.location.assign(this.url);        }    }        this.updateAnchor = function() { //update branches.anchor;        for (var i=0; i<this.branches; i++) {            this.bubbles[i].anchor.set(((this.anchor.x*width) + (this.location.x*w)) / width,((this.anchor.y*height) + (this.location.y*w)) / height);        }    }        this.display = function() { //display bubble and lines colored according to this.selected and this.origin        var drawLocation = new p5.Vector(this.anchor.x * width,this.anchor.y * height);        drawLocation.add(this.location.x*w,this.location.y*w);                push()                noFill();        if (this.selected || this.origin) {            stroke(255);        }        else {            stroke(0);        }        strokeWeight(2);        line((camera.z * ((this.anchor.x*width) - camera.anchor.x)) - camera.location.x + camera.anchor.x,(camera.z * ((this.anchor.y*height) - camera.anchor.y)) - camera.location.y + camera.anchor.y,(camera.z * (drawLocation.x - camera.anchor.x)) - camera.location.x + camera.anchor.x,(camera.z * (drawLocation.y - camera.anchor.y)) - camera.location.y + camera.anchor.y);                if (this.selected || this.origin) {            fill(255);        }        else {            fill(0);        }        noStroke();        ellipse((camera.z * (drawLocation.x - camera.anchor.x)) - camera.location.x + camera.anchor.x,(camera.z * (drawLocation.y - camera.anchor.y)) - camera.location.y + camera.anchor.y,this.size * this.grow * w * camera.z,this.size * this.grow * w * camera.z);                pop();    }        this.enableBranches = function() {        for (var i=0; i<this.bubbles.length; i++) {            this.bubbles[i].interact();            this.bubbles[i].updateAnchor();            this.bubbles[i].enableBranches();            this.bubbles[i].display();        }    }}//---------------------------------- CAMERAfunction Camera() {    this.location = new p5.Vector(cursor.x-(width/2),cursor.y-(height/2));    this.anchor = new p5.Vector(width/2,height/2);    this.anchorTarget = new p5.Vector(width/2,height/2);    this.anchored = false;    this.speed = 0.2;    this.z = 1;    this.zTarget = 1;        this.move = function() {        if (!this.anchored) {            this.anchorTarget.set(width/2,height/2);        }            var velocity = new p5.Vector();        velocity.set(this.anchorTarget);        velocity.sub(this.anchor);        if (this.zTarget > this.z) {            velocity.mult(this.speed);            this.anchor.add(velocity);        }        else if ((this.z - this.zTarget)/this.z < 0.2) {            velocity.mult(this.speed*0.5);            this.anchor.add(velocity);        }                if (mobile) {            cursor.x = width/2;            cursor.y = height/2;        }                velocity.set(cursor.x - width,cursor.y - height);        velocity.add(this.anchor);        velocity.sub(this.location);        velocity.mult(this.speed);        this.location.add(velocity);    }        this.zoom = function() {        if (!this.anchored) {            if (mobile) {                this.zTarget = mobileZoom;            }            else {                this.zTarget = 1;            }        }                var change = this.speed * (this.zTarget-this.z);                if (this.zTarget > this.z) {            var velocity = new p5.Vector();            velocity.set(this.anchorTarget);            velocity.sub(this.anchor);                        if (velocity.mag() > 0.01) {                this.z += change / (velocity.mag() * (w/this.z));            }            else {                this.z += change;            }        }        else {            this.z += change;        }    }}//--------------------------------------------------------------------- OVERRIDES//---------------------------------- FIX CANVASfunction windowResized() {    document.getElementById(parentID).style.width = "100%";    document.getElementById(parentID).style.height = "100%";        resizeCanvas(windowWidth, windowHeight);        w = getDimension();}//---------------------------------- DISABLE SCROLLINGfunction mouseWheel(event) {    return false;}//---------------------------------- DISABLE ZOOMINGfunction mousePressed() {    return false;}//---------------------------------- SELECTIONfunction mouseReleased() {    home.select();        return false;}//---------------------------------- DISABLE SCROLLINGfunction mouseDragged() {    return false;}//---------------------------------- DISABLE SCROLLINGfunction touchMoved() {    return false;}//---------------------------------- DISABLE ZOOMINGfunction touchStarted() {    return false;}//---------------------------------- DISABLE ZOOMING + SELECTIONfunction touchEnded() {    home.select();        return false;}