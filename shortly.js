var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session')


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var bcrypt = require('bcrypt');

var app = express();



app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(session({secret: 'shhhh'}));


app.get('/', 
function(req, res) {
  if(!req.session.username) {
    res.redirect('login');
  } else if(!req.session.id) {
    res.render('login');
  } else {
    res.render('index');
  }
});

app.get('/create', 
function(req, res) {
  if(!sess) {
    res.redirect('login');
  } else {
    res.render('index');
  }
}); 

app.get('/login',
function(req, res) { 
  req.session.destroy(function(err) {
  if(err) {
    throw err;
  }
});
  res.render('login')
});
 
app.post('/login',
function(req, res) {
  sess = req.session;
  sess.username = req.body.username;
  sess.password = req.body.password;
  // query for the username
  var query = new User({ username: sess.username }).fetch().then(function(found) {
    if(found) {
      var salt = found.attributes.salt;
      var hash = bcrypt.hashSync(sess.password, salt);
      if(hash === found.attributes.password) {
        res.redirect('index');
      }  else {
        res.redirect('login');
      }
    } else {
      res.redirect('login');
    }
  }); 


  // grab the salt
  // rehash the password with the salt
  // check if hashed password 
});

app.get('/signup',
function(req, res) {
  res.render('signup');
})

app.post('/signup', function(req, res) {
  req.session.username = req.body.username;
  req.session.password = req.body.password;
  var salt = bcrypt.genSaltSync(10);
  var hash = bcrypt.hashSync(req.session.password, salt);
  if (!req.session.username) {
    console.log('Not a valid username: ', sess.username);
    return res.send(404);
  } 

  new User({ username: req.body.username }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
        var user = new User({
          username: req.body.username, 
          password: hash,
          salt: salt,
        });
        user.save().then(function(newUser) {
          Users.add(newUser);
          res.send(200, res.redirect('login'));
        });
    }
  });
});
 

app.get('/users',
function(req, res) {
  Users.reset().fetch().then(function(users) {
    res.send(200, users.models);
  })
});


app.get('/links', 
function(req, res) {
  if(!sess) {
    sess = null;
    res.redirect('login');
  } else {
    Links.reset().fetch().then(function(links) {
      res.send(200, links.models);
    });
  }
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;
  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  } 

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }
        var link = new Link({
          url: uri, 
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

app.listen(4568);
console.log('Shortly is listening on 4568');

