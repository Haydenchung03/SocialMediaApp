

//let mongo = require('mongodb');
import mongo from 'mongodb';
let MongoClient = mongo.MongoClient;
let db;
//const express = require('express');
import express from 'express';
const app = express();
//const fs = require('fs');
import fs from 'fs';
//const { type } = require('os');
import type from 'os';

const readVendor = fs.readdirSync('/');
let data = [];
let count2 = -1;

// adding from gallery.json
const initFile = fs.readFileSync(('gallery.json'));
const toStringFile = initFile.toString();
const initJson = JSON.parse(toStringFile);
count2 += 1;
let stringI = count2.toString();
initJson.rating = {};
data[count2] = initJson;
for(let i = 0; i < data[0].length; i++){
    data[0][i].userRating = [];
    data[0][i].workshops = [];
}
// initialize database
MongoClient.connect("mongodb://127.0.0.1:27017/", { useNewUrlParser: true }, function(err, client) {
    if(err) throw err;

    db = client.db('FinalProject');
    db.dropCollection("datas", function(err, result){
        if(err){
            console.log("Error dropping collection. Likely case: collection did not exist (don't worry unless you get other errors...)")
        }else{
            console.log("Cleared collection.");
        }
        
        db.collection("datas").insertMany(data[0], function(err, result){
            if(err) throw err;
            console.log("Successfuly created");
            process.exit();
        })
        
    });

    db.dropCollection("userinfos", function(err, result){
        if(err){
            console.log("Error dropping collection. Likely case: collection did not exist (don't worry unless you get other errors...)")
        }else{
            console.log("Cleared collection.");
        }
        let data1 = [];
        data1[0] = {password: 'ADMIN', username: 'ADMIN', accountType: 'Patron', following: [], followers: [], ratingReview: [], notifications: [], workshops: [], artworks: []};
        for(let i = 1; i < data[0].length; i++){
            data1[i] = {password: 'ADMIN', username: data[0][i].artist, accountType: 'Patron', following: [], followers: [], ratingReview: [], notifications: [], workshops: [], artworks: [data[0][i].name]};

        }
        db.collection("userinfos").insertMany(data1, function(err, result){
            if(err) throw err;
            console.log("Successfuly created");
            process.exit();
        });
    });

});
