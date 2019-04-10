var key = 'real secret keys should be long and random';

var express           = require("express"),
bodyParser            = require("body-parser"),
passport              = require("passport"),
LocalStrategy         = require("passport-local"),
passportLocalMongoose = require("passport-local-mongoose"),
User                  = require("./models/User"),
encryptor             = require('simple-encryptor')(key),
session               = require("express-session"),
mongoose              = require("mongoose");

var app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(session({
    secret: "Mrs. Allen was my 10th grade CS teacher",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
// app.use(methodOverride("_method"));


passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
passport.use(new LocalStrategy(User.authenticate()));

//======================
//ROUTES
//======================

// registration routes

app.get("/register", function(req, res) {
    res.render("register", {usertop: req.user, isAuth: req.isAuthenticated()}); 
});

app.post("/register", function(req, res) {
   var username = req.body.username.trim();
   var password = req.body.password.trim();
   var email    = req.body.email.trim();
   User.register(new User({username: username, email: email}), password, function(err, user){
       if(err){
           console.log(err);
           return res.render("register", {usertop: req.user, isAuth: req.isAuthenticated()});
       }
      passport.authenticate("local")(req, res, function(){
            QuestPost.find({}, function(err, quests) {
               if(err){
                   console.log(err);
               }else{
                   res.redirect("/q")
               }
                });
      });
   });
});

//login routes

app.get("/login", function(req, res) {
    res.render("login", {usertop: req.user, isAuth: req.isAuthenticated()});
});

app.get("/login/:id", function(req, res) {
    incrementSolved(req.params.id);
    res.render("login", {usertop: req.user, isAuth: req.isAuthenticated()});
});


app.get("/loginfailure", function(req, res) {
    res.render("loginfail", {usertop: req.user, isAuth: req.isAuthenticated()});
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/q",
    failureRedirect: "/loginfailure"
}), function(req, res) {
    
});

//logout route

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
})

//LANDING PAGE
app.get("/", function(req, res){
    res.render("home", {usertop: req.user, isAuth: req.isAuthenticated()});
});

//HOW TO PAGE
app.get("/howto", function(req, res){
    res.render("howto", {usertop: req.user, isAuth: req.isAuthenticated()});
});

//QUEST FRONT PAGE
app.get("/q", function(req, res){
    var postsrank = {};
    var pageTitle = "Hottest";
     QuestPost.find({}, function(err,   quests) {
        if(err){
            console.log(err);
        } else {
            // quests.forEach(function(q) {
             var newquests = quests.sort(function(a, b) {
                    return getRank(b) > getRank(a);
                });
            // })
            
            quests.forEach(function(q) {
                console.log(q.title + ": " + getRank(q));
                
            });
            console.log("----------");
            res.render("quests", {quests: newquests, pageTitle: pageTitle, usertop: req.user, isAuth: req.isAuthenticated()})
            
        }
                
                 
     });
});

//QUEST FRONT PAGE NEWEST
app.get("/quests/newest", function(req, res){
    var postsrank = {};
    var pageTitle =  "Newest";
     QuestPost.find({}, function(err,   quests) {
        if(err){
            console.log(err);
        } else {
            // quests.forEach(function(q) {
             var newquests = quests.sort(function(a, b) {
                    return getDateValue(a.date) > getDateValue(b.date);
                });
            // })
            
            for(var i = 1; i < quests.length; i++) {
                console.log(quests[i].title + ": " + i);
            }
            console.log("----------");
            res.render("quests", {quests: newquests, pageTitle: pageTitle, usertop: req.user, isAuth: req.isAuthenticated()})
            
        }
                
                 
     });
});

//QUEST FRONT PAGE POPULAR
app.get("/quests/popular", function(req, res){
    var postsrank = {};
    var pageTitle =  "Most Popular";
     QuestPost.find({}, function(err,   quests) {
        if(err){
            console.log(err);
        } else {
            // quests.forEach(function(q) {
             var newquests = quests.sort(function(a, b) {
                    return getRank(b) > getRank(a);
                });
            // })
            
            quests.forEach(function(q) {
                console.log(q.title + ": " + getPopular(q));
                
            });
            console.log("----------");
            console.log("1");
            res.render("quests", {quests: newquests, pageTitle: pageTitle, usertop: req.user, isAuth: req.isAuthenticated()})
            
        }
               
                 
     });
});

//POST A QUEST TO /q/
app.post("/q", function(req, res){
  var pageTitle = "Hottest"
  var title = req.body.title;
  var category = req.body.category.toLowerCase();
  var numOfSteps = req.body.steps.length;
  var date = getDate();
  var timessolved = 0;
  var likes = 0;
  var timesviewed = 0;
  var rank = 0;
  var creator = req.user.username;
  var newsteps = [numOfSteps];
   
  for(var i = 0; i<numOfSteps; i++){
    var clue = req.body.steps[i][0];
    var link = req.body.steps[i][2];
    var type = req.body.steps[i][1];
    var answer = req.body.steps[i][3];
    answer = encrypt(answer);
    newsteps[i] = {clue: clue, link: link, answer: answer, qType: type};  
  }
   

var newQuest = {title: title, category: category, stepnum: numOfSteps, date: date, timessolved: timessolved, timesviewed: timesviewed, likes: likes, rank: rank, creator: creator, steps: newsteps};
 


QuestPost.create(newQuest, function(err, newly) {
    if(err){
        console.log(err);
        
    } else {
    QuestPost.find({}, function(err, quests) {
       if(err){
           console.log(err);
       }else{
           res.render("quests", {quests: quests, pageTitle: pageTitle, usertop: req.user, isAuth: req.isAuthenticated()});
       }
    });
    }
});
  
});

//deleting posts
app.get("/quests/del/:postid", isQuestCreator, function(req, res) {
    QuestPost.findByIdAndRemove(req.params.postid, function(err, num) {
        if(err) {
            console.log(err);
        } else {
            res.redirect("/q");
        }
    });
});

//editing questposts
app.get("/qediting/:postid", isQuestCreator, function(req, res) {
    QuestPost.findById(req.params.postid, function(err, quest) {
        if(err) {
            console.log("no retrieval");
            console.log(err);
        } else {
            console.log(quest);
            quest.steps.forEach(function(s) {
               
                    s.answer = decrypt(s.answer);     
                });
            
            res.render("edit", {quest: quest, usertop: req.user, isAuth: req.isAuthenticated()});
        }
    });
});

app.post("/q/:postid", isQuestCreator, function(req, res) {
  var title = req.body.title;
  var category = req.body.category.toLowerCase();
  var numOfSteps = req.body.steps.length;
  var date = getDate();
  var newsteps = [numOfSteps];
   
  for(var i = 0; i<numOfSteps; i++){
    var clue = req.body.steps[i][0];
    var link = req.body.steps[i][2];
    var type = req.body.steps[i][1];
    var answer = req.body.steps[i][3];
    answer = encrypt(answer);
    newsteps[i] = {clue: clue, link: link, answer: answer, qType: type};  
  }
   

var newQuest = {title: title, category: category, stepnum: numOfSteps, date: date, steps: newsteps};

console.log(newQuest);

QuestPost.findByIdAndUpdate(req.params.postid, newQuest, function(err, num) {
    if(err) {
        console.log(err);
    } else  {
        res.redirect("/q/" + category + "/" + req.params.postid);
    }
});
});



//DISPLAYS ALL QUESTS IN SPECIFIED CATEGORY PAGE
app.get("/q/:category", function(req, res){
    var pageTitle =  "Hottest in";
    QuestPost.find({"category": req.params.category}, function(err, quests) {
       if(err == true || quests[0] == null){
           console.log(err);
           console.log("2");
           res.render("errors", {usertop: req.user, isAuth: req.isAuthenticated()});
              
       }else{
        
        res.render("questCat", {questAtCat:quests, pageTitle: pageTitle, usertop: req.user, isAuth: req.isAuthenticated()});
       }
    });
    
});

//QUEST CATEGORY NEWEST
app.get("/quests/:category/newest", function(req, res){
    var postsrank = {};
    var pageTitle =  "Newest in";
     QuestPost.find({"category": req.params.category}, function(err,   quests) {
        if(err){
            console.log(err);
        } else {
            // quests.forEach(function(q) {
             var newquests = quests.sort(function(a, b) {
                    return b.date > a.date;
                });
            // })
            
            quests.forEach(function(q) {
                console.log(q.title + ": " + getDate(q));
                
            });
            console.log("----------");
            res.render("questCat", {questAtCat:quests, pageTitle: pageTitle, usertop: req.user, isAuth: req.isAuthenticated()})
            
        }
                
                 
     });
});


//QUEST CATEGORY POPULAR
app.get("/quests/:category/popular", function(req, res){
    var postsrank = {};
    var pageTitle =  "Most Popular in";
     QuestPost.find({"category": req.params.category}, function(err,   quests) {
        if(err){
            console.log(err);
        } else {
            // quests.forEach(function(q) {
             var newquests = quests.sort(function(a, b) {
                    return getPopular(b) > getPopular(a);
                });
            // })
            
            quests.forEach(function(q) {
                console.log(q.title + ": " + getPopular(q));
                
            });
            res.render("questCat", {questAtCat:quests, pageTitle: pageTitle, usertop: req.user, isAuth: req.isAuthenticated()})
            
        }
               
                 
     });
});

//DISPLAYS SPECIFIED QUEST CONTENT
app.get("/q/:category/:title", function(req, res){
    
    var qId = req.params.title;
    QuestPost.find({"_id": qId}, function(err, quests) {
       if(err || quests == null){
           console.log(err);
           res.render("errors", {usertop: req.user, isAuth: req.isAuthenticated()});
       }else{
        QuestPost.update({"_id" : qId}, {$inc: {timesviewed: 1}}, function(err, numeffected) {
             if(err){
                 console.log("Failure updating solved" + err);
                 res.render("errors", {usertop: req.user, isAuth: req.isAuthenticated()});
             }
        });
         res.render("questTitle", {questTitle: quests, usertop: req.user, isAuth: req.isAuthenticated()});
        
       }      
    });       
           
});

app.get("/q/:category/:title/qompleted", function(req, res) {
   var qId = req.params.title;
   QuestPost.find({"_id": qId}, function(err, quests) {
      if(err){
          console.log("Failure querying quest with passed _id" + err);
          res.render("errors", {usertop: req.user, isAuth: req.isAuthenticated()});
      }else{
        if(req.user != null && req.user.questsQompleted.indexOf(qId) == -1 && quests[0].creator != req.user.username) { 
         QuestPost.update({"_id" : qId}, {$inc: {timessolved: 1}}, function(err, numeffected) {
             if(err){
                 console.log("Failure updating solved" + err);
                 res.render("errors", {usertop: req.user, isAuth: req.isAuthenticated()});
             }
      });
        
        
        User.findByIdAndUpdate(req.user._id, {$push: {questsQompleted: qId}}, function(err, user){
            if(err){
                console.log(err);
            } else {
                res.redirect("/q");
            }
        });
        } 
        else{
         QuestPost.update({"_id" : qId}, {$inc: {timessolved: 1}}, function(err, numeffected) {
             if(err){
                 console.log("Failure updating solved" + err);
                 res.render("errors", {usertop: req.user, isAuth: req.isAuthenticated()});
             }
      });        
        
    res.redirect("/q");  
        }
        }
   });
    
});

//LISTS EVERY CREATED CATEGORY
app.get("/categories", function(req, res) {
    var categories = []; 
    var countPosts = [];
    var uniqueCat = 1;
   QuestPost.find({}, function(err, quests) {
       if(err){
           console.log(err);
       }else{
           
       
    for(var i = 0; i<quests.length; i++){
        categories[i] = quests[i].category;
        for(var j = 0; j<quests.length; j++){
                if(categories[i]==quests[j].category)
                    countPosts[i]++;
        }
    }
        res.render("categories", {categories:categories, countPosts:countPosts, usertop: req.user, isAuth: req.isAuthenticated()});

    }
   });
});

app.get("/users", function(req, res) {
    var users = []; 
   User.find({}, function(err, user) {
       if(err){console.log(err);
       }else{
        res.render("users", {user:user, usertop: req.user, isAuth: req.isAuthenticated()});

       }
   });
});

//CREATE QUEST PAGE
app.get("/post",isLoggedIn, function(req, res) {
    res.render("post", {usertop: req.user});
});

app.listen(process.env.PORT || 3000, function(){
    console.log("The Server Has Started!");
});

app.get("/users/:username", function(req, res) {
   QuestPost.find({"creator": req.params.username}, function(err, quests){
       if(err){
           console.log("error querying users" + err);
       }else{
         User.find({"username": req.params.username}, function(err, users) {
             if(err) {
                 console.log(err);
             } else {
                 
                 
           
           QuestPost.find({"_id": {$in: users[0].questsQompleted} }, function(err, qompQuests) {
               if(err) {
                   console.log(err);
               } else {
                   
            //  console.log(users[0].questsQompleted);
            //  console.log(qompQuests);
           
           
           res.render("userpage", {quests: quests, completed: qompQuests, user: req.params.username, postnum: quests.length, compnum: qompQuests.length, usertop: req.user, isAuth: req.isAuthenticated()});
       
           
               }
           });
             
             }
         });  
           
           
           
       }
   });
});

app.get("/q/:category/:title/qompleted/lk", function(req, res) {
    QuestPost.findByIdAndUpdate(req.params.title, {$inc : {likes: 1}}, function(err, numeffected) {
        if(err){
            console.log(err);
        } else {
         res.redirect("/q/"+req.params.category+"/" +req.params.title+ "/qompleted");
            
        }
    });
});


//======================
//FUNCTIONS
//======================

function incrementSolved(id) {
     QuestPost.update({"_id" : id}, {$inc: {timessolved: 1}}, function(err, numeffected) {
             if(err){
                 console.log("Failure updating solved" + err);
             }
      });
}



//changes title to URL title
function convertToSlug(Text)
{
    return Text
        .toLowerCase()
        .replace(/ /g,'-')
        .replace(/[^\w-]+/g,'')
        ;
}

function decrypt(s) {
            var e={},i,b=0,c,x,l=0,a,r='',w=String.fromCharCode,L=s.length;
            var A="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
            for(i=0;i<64;i++){e[A.charAt(i)]=i;}
            for(x=0;x<L;x++){
                c=e[s.charAt(x)];b=(b<<6)+c;l+=6;
                while(l>=8){((a=(b>>>(l-=8))&0xff)||(x<(L-2)))&&(r+=w(a));}
            }
            return r;
        }

function encrypt(str) {
    var encrypt = new Buffer(str);
    return encrypt.toString('base64');
}

//populates date variable
function getDate(){
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!

    var yyyy = today.getFullYear();
    if(dd<10){
        dd='0'+dd;
    } 
    if(mm<10){
        mm='0'+mm;
    } 
    today = mm+'/'+dd+'/'+yyyy;
    return today;
}

function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()){
        
        return next();

    }
    res.redirect("/login");

}

function hasSpace(e) {
    return e.indexOf('') > 0;
}

function getRank(obj) {
    var likes  = obj.likes,
        date   = (getDateValue(obj.date) + 1),
        views  = obj.timesviewed,
        solved = obj.timessolved,
        rank   = 0;
     
    rank = (((likes * 20) / date) * .55) + (((solved * 20) / date) * .3) + (((views * 20) / date) * .15);
    
    return rank;
}

function getPopular(obj) {
    var likes  = obj.likes,
        date   = getDateValue(obj.date) + 1,
        views  = obj.timesviewed,
        solved = obj.timessolved,
        rank   = 0;
    
        
    rank = ((likes * 20) * .55) + ((solved * 20) * .3) + ((views * 20) * .15);
    
    return rank;
}

function isQuestCreator (req, res, next) {
    console.log(req.user);
    QuestPost.findById(req.params.postid, function(err, quest) {
        if(err) {
            console.log(err);
        } else {
            if(quest.creator == req.user.username){
                return next();
            }else {
                res.redirect("/");
            }
        }
    })
}

function getDateValue(date) {
    var todays = getDate()
    .split("/");
    
    var other  = date.split("/");
    
    if(todays[2] == other[2] && todays[0] == other[0]){
        return todays[1] - other[1];
    }
    if(todays[2] == other[2]){
        var monthdiff = (todays[0] - other[0]) * 30;
        return (todays[1] - other[1]) + monthdiff;
    }
    else {
        var monthdiffer = (todays[0] - other[0]) * 30;
        var yeardiff = (todays[2] - other[2]) * 365;
        return (todays[1] - other[1]) + monthdiffer + yeardiff;
    }
}
//======================
//DATA
//======================


// mongoose.connect("mongodb://localhost/quest");
mongoose.connect("mongodb://mustafa:allen@ds019936.mlab.com:19936/questavi");
mongodb://mustafa:allen@ds019936.mlab.com:19936/questavi 

var postSchema = mongoose.Schema({
    title: String,
    category: String,
    stepnum: Number,
    date: String,
    timessolved: Number,
    timesviewed: Number,
    likes: Number,
    creator: String,
    steps: [{clue: String, link: String, answer: String, qType: String}]
});

var QuestPost = mongoose.model("QuestPost", postSchema);

