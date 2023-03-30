const express = require("express");
var router = express.Router();
const Sentry = require("@sentry/node");
const dbConnection = require('../config/dbConnection');
const verifyAccessToken = require('../config/jwtHelper').verifyAccessToken

/* Health check */
exports.health = (req,res) => {
    return res.json({ hello: 'Hello from the backend!' })
};

/* Get all students */
exports.all = (req, res) => { 
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!verifyAccessToken(token)) return res.sendStatus(401)
    dbConnection.query("SELECT * FROM students",
    (err, results, fields) => {
      if (!err) {
        res.send(results);
      } else {
        Sentry.captureException(new Error("Something went wrong :/"));
      }
    });
};

/* Get student info */
exports.info = (req, res) => { 
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!verifyAccessToken(token)) return res.sendStatus(401)
    dbConnection.query("SELECT * FROM students WHERE student_id = " + req.body.student_id,
    (err, results, fields) => {
      if (!err) {
        res.send(results);
      } else {
        Sentry.captureException(new Error("Something went wrong :/"));
      }
    });
};

/* Get student incidents and activities */
exports.history = (req, res) => { 
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!verifyAccessToken(token)) return res.sendStatus(401)
    const results = [];
    dbConnection.query("SELECT * FROM `student_incidents` JOIN incidents ON student_incidents.incident_id = incidents.incident_id WHERE student_id = " + req.body.student_id,
    (err, incidents, fields) => {
      if (!err) {
        for (var i = 0; i < incidents.length; i++) {
            incidents[i]["type"] = "incident";
            results.push(incidents[i]);
        }
      } else {
        Sentry.captureException(new Error("Something went wrong :/"));
      }
    });
    dbConnection.query("SELECT * FROM activities WHERE student_id = " + req.body.student_id,
    (err, activities, fields) => {
      if (!err) {
        for (var i = 0; i < activities.length; i++) {
            activities[i]["type"] = "activity";
            results.push(activities[i]);
        }
        res.send(results);
      } else {
        Sentry.captureException(new Error("Something went wrong :/"));
      }
    });
    
};
