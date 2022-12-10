//Import the mongoose module
import pkg from 'mongoose';

//mongoose modules -- you will need to add type": "module" to your package.json
const { Schema, model} = pkg;

//Define the Schema for a citizen
const userSchema = Schema({
    password: String,
    username: String,
    accountType: String,
    following: Array,
    followers: Array,
    ratingReview: Array,
    notifications: Array,
    workshops: Array,
    artwork: Array
});

//Export the default so it can be imported
export default model("userinfos", userSchema);