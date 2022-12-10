import express from 'express';

const app = express();

import session from 'express-session';
import { default as connectMongoDBSession} from 'connect-mongodb-session';

const MongoDBStore = connectMongoDBSession(session);

//Defining the location of the sessions data in the database.
var store = new MongoDBStore({
  uri: 'mongodb://localhost:27017/FinalProject',
  collection: 'sessions'
});

//Setting up the express sessions to be stored in the database.
app.use(session(
    { 
      secret: 'top secret key',
      resave: true,
      saveUninitialized: false,
      store: store 
    })
);

//Request logger.
import logger from 'morgan'; 

import pkg from 'mongoose';
const { connect, Types } = pkg;

app.use(express.urlencoded({extended: true}));
import User from './UserModel.js';
import Artwork from './artworkModel.js';
const PORT = process.env.PORT || 3000;


//Root directory for javascript files.
const ROOT_DIR_JS = '/public/js';

// Change the host to localhost if you are running the server on your
// own computer.
let host = ["localhost", "YOUR_OPENSTACK_IP"];

//Logging our connections to the express servers.
app.use(logger('dev'));

//Static server will check the following directory.
//Needed for the addPerson, deletePerson and register javascript files.
app.use(express.static("." + ROOT_DIR_JS));

//Convert any JSON stringified strings in a POST request to JSON.
app.use(express.json());

//Setting pug as our template engine.
app.set('views', './views');
app.set('view engine', 'pug');

// Artworks
let searchResult;

// Gloabla User name
let username;
let password;
let prevName;
let prevRating;
let prevReview;


// get home page
app.get(['/', '/home'], (req, res) => {

	res.render('pages/home', { session: req.session });

});



// get user accounts
app.get("/useraccounts", (req, res) => {

	res.render("pages/userChoice", { session: req.session });
     
});

// get login
app.get("/login", async (req, res) => {
    res.render("pages/login", { session: req.session });
});

// get register
app.get("/register", async (req, res) => {
    res.render("pages/register", { session: req.session });
});

// register new account
app.post("/register", async (req, res) => {

    let newUser = req.body;
    newUser.accountType = "Patron";
    

    newUser.following = [];   
    newUser.followers = []; 
    newUser.ratingReview = [];
    newUser.notifications = [];
    newUser.workshops = [];
    newUser.artworks = [];


    try{
        const searchResult = await User.findOne({ username: newUser.username});
        if(searchResult == null) {
            console.log("registering: " + JSON.stringify(newUser));
           
            await User.create(newUser);
            res.status(200).send();
        } else {
            console.log("Send error.");
            res.status(404).json({'error': 'Exists'});
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Error registering" });
    }  

});


// logout
app.get("/logout", (req, res) => {

    
	if(req.session.loggedin) {
		req.session.loggedin = false;
	}
	res.redirect(`http://${host[0]}:3000/home`);

});

// login
app.post("/login", async (req, res) => {

	username = req.body.username;
	password = req.body.password;

    try {
        const searchResult = await User.findOne({ username: username });
        if(searchResult != null) { 
            if(searchResult.password === password) {
                // If we successfully match the username and password
                // then set the session properties.  We add these properties
                // to the session object.
                req.session.loggedin = true;
                req.session.username = searchResult.username;
                req.session.userid = searchResult._id;
                res.render('pages/home', { session: req.session })
            } else {
                res.status(401).send("Not authorized. Invalid password.");
            }
        } else {
            res.status(401).send("Not authorized. Invalid password.");
        }
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: "Error logging in."});
    }    
});


// get account type
app.get("/accountType", async (req, res) => {
    res.render("pages/accountType", { session: req.session });
});

// change account type
app.post("/accountType", async (req, res) => {
    let accountType = req.body.accountType;
    //console.log(accountType);
    
    try {
        const searchResult = await User.findOne({ username: req.session.username });
        if(searchResult != null) { 
            searchResult.accountType = accountType;
            await searchResult.save();
            
            res.render('pages/home', { session: req.session });
        } else {
            res.status(404).send("Not found.");
        }
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: "Error logging in."});
    }
});


// get users that u follow
app.get("/userFollow/:id", async (req, res) => {
    let obj_id = Types.ObjectId(req.params.id);
    const search = await User.findOne({ _id: obj_id });
    //console.log(search);
    res.render("pages/userFollow", { session: req.session, followers: search.following });

});

// 

// view artworks
app.get("/viewingArtworks", async (req, res) => {
    searchResult = await Artwork.find({});
    res.render("pages/viewArtworks", { session: req.session, artworks: searchResult });

});

// get artwork id
app.get("/artwork/:id", async (req, res) => {
    let obj_id = Types.ObjectId(req.params.id);
    const searchResult = await Artwork.findOne({ _id: obj_id });
    const searchResult1 = await User.findOne({ username: req.session.username });
    //console.log(searchResult.name);
    res.render("pages/artwork", { session: req.session, artwork: searchResult, user: searchResult1 });
});


// make new artwork
app.post("/artwork/:id", async (req, res) => {
    let newReview = req.body;
    //console.log(newReview);
    //console.log("error 1")
    let obj_id = Types.ObjectId(req.params.id);
    let condition = true;
    const currentUser = await User.findOne({ username: req.session.username });
    const searchResult1 = await Artwork.findOne({ _id: obj_id});
    //console.log(searchResult1);
    
    const searchName = searchResult1.userRating;
    //console.log(searchName);
    for(let i = 0; i < searchName.length; i++) {
        if(searchName[i].username == currentUser.username) {
            condition = false;
        }
    }
    
    if(condition == true) {
        //console.log("Here it is")
        //console.log("error 2")
        const currentUser = await User.findOne({ username: req.session.username });
        const userRatingName = await searchResult1.updateOne({ $push: {userRating: { username: currentUser.username, reviews: newReview.reviewForm,  rating: newReview.rating, _id: obj_id}} });
        //console.log(searchResult.rating[0].reviewForm);
        
        const artworkName = await Artwork.findOne({ _id: obj_id });
        const searchResult2 = await User.findOne({ username: req.session.username });
        
        
        const userRating = await currentUser.updateOne({ $push: { ratingReview: {review: newReview.reviewForm, rating: newReview.rating, name: artworkName.name, artist: artworkName.artist, _id: obj_id}} } );
        res.render("pages/artwork", { session: req.session, artwork: searchResult1});
    } else{
        //console.log("error3")
        const currentUser = await User.findOne({ username: req.session.username });
        //const index = searchResult1.userRating.indexOf(currentUser.username);
        let index = 0;
        for(let i = 0; i < searchResult1.userRating.length; i++) {
            if(searchResult1.userRating[i].username == currentUser.username) {
                index = i;
            }
        }
        const rating = await searchResult1.updateOne({ $set: {userRating: {username: currentUser.username, rating: newReview.rating, reviews: newReview.reviewForm, _id: obj_id} }});
        const artworkName = await Artwork.findOne({ _id: obj_id });
        const userRating = await currentUser.updateOne({ $set: { ratingReview: {review: newReview.reviewForm, rating: newReview.rating, name: artworkName.name, artist: artworkName.artist, _id: obj_id} } });
        res.render("pages/artwork", {session: req.session, artwork: searchResult1})
    }
});


// make new review
app.get("/artwork/:id/reviews", async (req, res) => {
    let obj_id = Types.ObjectId(req.params.id);
    const searchResult = await Artwork.findOne({ _id: obj_id });
    //console.log(searchResult.name);
    res.render("pages/reviews", { session: req.session, artwork: searchResult.userRating});
});


// see user ratings
app.get("/userRating/:id", async (req, res) => {
    const searchResult = await User.findOne({ username: username});
    //console.log(searchResult);
    res.render("pages/userRating", { session: req.session, userRatingReview: searchResult.ratingReview});

});

// add new user rating
app.post("/userRating/:id/:uID", async (req, res) => {
    let obj_id = Types.ObjectId(req.params.id);
    let compare_id = Types.ObjectId(req.params.uID);
    compare_id = compare_id.toString();
    const userRating = await User.findOne({ _id: obj_id });
    const artwork = await Artwork.find({});
    for(let i = 0; i < userRating.ratingReview.length; i++) {
        //console.log("Top: "+ userRating.ratingReview[i]._id);
        for(let j = 0; j < artwork.length; j++) {
            for(let k = 0; k < artwork[j].userRating.length; k++) {
                
                if(userRating.ratingReview[i]._id.equals(artwork[j]._id) && userRating.username === artwork[j].userRating[k].username && compare_id === artwork[j]._id.toString()) {
                    const artwork1 = await Artwork.findOne({ _id: artwork[j]._id });
                    //console.log(artwork1);
                    
                    const userRating1 = await User.findOne({
                        _id: obj_id
                    });
                    const deleteUserRating = await userRating1.updateOne({ $pull: { ratingReview: { _id: artwork[j]._id} } });
                    
                    const deleteArtworkRating = await artwork1.updateOne({ $pull: { userRating: { username: userRating.username} } });
                }
            }
        }
    }

    res.render("pages/home", { session: req.session});
    
});


// get user follows
app.get("/userFollow/:id", async (req, res) => {
    let obj_id = Types.ObjectId(req.params.id);
    res.render("/pages/userFollow", { session: req.session});
});

// view artists
app.get("/viewingArtistProfiles", async (req, res) => {
    const searchResult = await Artwork.find({});
    res.render("pages/artistView", { session: req.session, artists: searchResult});
});

// view artist profile
app.get("/artistProfile/:id/:artist", async (req, res) => {
    let obj_id = Types.ObjectId(req.params.id);
    let artistName = req.params.artist;
    const finallAll = await Artwork.find({ artist: artistName });
    const searchResult = await Artwork.findOne({ _id: obj_id });
    const currentUser = await User.findOne({ username: req.session.username});
    res.render("pages/artistProfile", { userWork: currentUser, session: req.session, artist: searchResult, following: currentUser.following, allArtwork: finallAll});
    
});

// follow an artist
app.post("/follow/:id/:uID", async (req, res) => {
    let obj_id = Types.ObjectId(req.params.id);
    let artist_id = Types.ObjectId(req.params.uID);
    const currentUser = await User.findOne({ username: req.session.username });
    const searchResult = await Artwork.findOne({ _id: artist_id });
    let condition = 0;
    if(currentUser.following.length === 0) {
        const follow = await currentUser.updateOne({ $push: { following: { username: searchResult.artist, _id: artist_id} } });
        res.render("pages/home", { session: req.session});
    } else {
        for(let i = 0; i < currentUser.following.length; i++) {
            if((currentUser.following[i]._id.equals(artist_id))) {
                
                const unfollow = await currentUser.updateOne({ $pull: { following: { _id: artist_id} } });
                res.render("pages/home", { session: req.session});
                
                condition = 1;
                break;
            }
        }
        if(condition === 0) {
            
            const follow = await currentUser.updateOne({ $push: { following: { username: searchResult.artist, _id: artist_id} } });
            res.render("pages/home", { session: req.session});
        }
    }
});

//


// get artists username
app.get("/artists/:id/:username", async (req, res) => {
    let obj_id = Types.ObjectId(req.params.id);
    const currentUser = await User.findOne({ _id: obj_id });
    if(currentUser.accountType === "Artist") {
        res.render("pages/artists", { session: req.session});
    } else {
        res.render("pages/invalidType", { session: req.session});
    }
});

// get artwork
app.get("/addArtwork/:username/:id", async (req, res) => {
    let obj_id = Types.ObjectId(req.params.id);
    const currentUser = await User.findOne({ _id: obj_id });
    res.render("pages/addArtwork", { session: req.session});
});

// get workshop
app.get("/addWorkshop/:username/:id", async (req, res) => {
    let obj_id = Types.ObjectId(req.params.id);
    const currentUser = await User.findOne({ _id: obj_id });
    res.render("pages/addWorkshop", { session: req.session});
});


// add new artwork
app.post("/artwork/:username/:id", async (req, res) => {
    let obj_id = Types.ObjectId(req.params.id);
    const currentUser = await User.findOne({ _id: obj_id });
    const addArtwork = await Artwork.create({
        name: req.body.name,
        artist: req.session.username,
        year: req.body.year,
        category: req.body.category,
        medium: req.body.medium,
        description: req.body.description,
        image: req.body.image,
        userRating: [],
        workshops: []
    });

    const allUsers = await User.find({});
    for(let i = 0; i < allUsers.length; i++) {
        for(let j = 0; j < allUsers[i].following.length; j++) {
            if(allUsers[i].following[j].username === currentUser.username) {
                const addNotification = await allUsers[i].updateOne({ $push: { notifications: { notification: "New artwork done by: " + currentUser.username, _id: addArtwork._id} } });
            }
        }
    }
    const addArtworkToUser = await currentUser.updateOne({ $push: { artwork: { name: req.body.name, _id: addArtwork._id} } });

    res.render("pages/home", { session: req.session});
});

// add new workshop
app.post("/workshop/:username/:id", async (req, res) => {
    let obj_id = Types.ObjectId(req.params.id);
    const currentUser = await User.findOne({ username: req.session.username });
    const addWorkshopToUser = await currentUser.updateOne({$push: {workshops: {workShopName: req.body.workshopName} }});
    res.render("pages/home", { session: req.session});
});

// enroll in workshop
app.post("/workshop", async (req, res) => {
    res.render("pages/sucess", { session: req.session});
});

// get workshop
app.get("/workshop/:username/:shopName", async (req, res) => {
    //let obj_id = Types.ObjectId(req.params.username);
    const currentUser = await User.findOne({ name: req.params.username });
    res.render("pages/workshop", { session: req.session, shops: currentUser.workshops});
});

// get notifications
app.get("/notifications/:id", async(req, res)=> {
    const currentUser = await User.findOne({ username: req.session.username });
    res.render("pages/notifications", { session: req.session, notifications: currentUser.notifications});
});


// add new workshop
app.post("/workshop/:username/:shopName", async (req, res) => {
    //let obj_id = Types.ObjectId(req.params.id);
    let workshopName = req.params.shopName;
    let userName = req.params.username;
    const currentUser1 = await User.findOne({ username: req.session.username });
    const enrollWorkshop = await currentUser1.updateOne({$push: {workshops: {workShopName: {owner: userName}} }});
    res.render("pages/sucess", {session: req.session});
});


        
const loadData = async () => {
	
	
  	const result = await connect('mongodb://localhost:27017/FinalProject');
    return result;

};


loadData()
  .then(() => {

    app.listen(PORT);
    console.log("Listen on port:", PORT);

  })
  .catch(err => console.log(err));