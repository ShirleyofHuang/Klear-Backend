const Sentry = require('@sentry/node')
const dbConnection = require('../config/dbConnection')
const mysql = require('mysql2')
const { resolve } = require('@sentry/utils')

exports.fetchAll = async (req, res) => {
    console.log("reached")
    const sqlQuery = 'SELECT * FROM incidents where status = 0 OR status = 1'
    dbConnection.query(sqlQuery, (err, result) => {
        if (err) Sentry.captureException(new Error(err))
        console.log(result)
        return res.json(result)
    })
}

exports.fetchOne = async (req, res) => {
    console.log("fetch one",req.params)
    const { incidentId } = req.params 
    const sqlQuery = 'SELECT * FROM incidents where incident_id = ?'
    const query = mysql.format(sqlQuery, [incidentId])
    dbConnection.query(query, async (err, result) => {
        if (err) Sentry.captureException(new Error(err))
        const students = await findRelatedStudents(incidentId)
        console.log(students)
        result[0].students = students
        console.log("returning result", result[0])
        return res.json(result[0])
    })
}

exports.add = async (req, res) => {
    const { event, date, imageUrl } = req.body
    console.log(event, date, imageUrl)
    if (event == null || date == null || imageUrl == null) {
        return res.sendStatus(400)
    }

    const incidentId = await addIncident(event, date, imageUrl)
    const studentId = await getRandomStudent()

    const result = await addStudentIncident(studentId, incidentId)
    console.log(incidentId, studentId, result)
    if (result > 0) {
        return res.send("Incident added successfully")
    } else {
        return res.send(400)
    }
}

function addIncident(event, date, imageUrl) {
    const sqlQuery = 'INSERT INTO incidents VALUES (NULL, ?, ?, NULL, NULL, ?)'
    const insertQuery = mysql.format(sqlQuery, [event, date, imageUrl])
    return new Promise((resolve, reject) => {
        dbConnection.query(insertQuery, (err, result) => {
            if (err) Sentry.captureException(new Error(err))
            console.log("Successfully created a new incident!")
            resolve(result.insertId)
        })
    }) 
}

function getRandomStudent() {
    const studentQuery = 'SELECT student_id FROM students ORDER BY RAND() LIMIT 1'
    const randomStudent = mysql.format(studentQuery)
    return new Promise((resolve, reject) => {
        dbConnection.query(randomStudent, async (err, result) => {
        if (err) Sentry.captureException(new Error(err))
        console.log("Found the student!")
        resolve(result[0].student_id)
        })
    })
}

function addStudentIncident(studentId, incidentId) {
    const sqlQuery = 'INSERT INTO student_incidents VALUES(?, ?)'
    const query = mysql.format(sqlQuery, [studentId, incidentId])
    return new Promise((resolve, reject) => {
        dbConnection.query(query, (err, result) => {
        if (err) Sentry.captureException(new Error(err))
        console.log("Successfully attached student to the incident")
        resolve(1)
        })
    })
}

function findRelatedStudents(incidentId) {
    const sqlQuery = 'SELECT student_id FROM student_incidents WHERE incident_id = ?'
    const query = mysql.format(sqlQuery, [incidentId])
    return new Promise((resolve, reject) => {
        dbConnection.query(query, (err, result) => {
            if (err) Sentry.captureException(new Error(err))
            console.log(result)
            if (result.length > 0) {
                console.log("running in query to find student name")
                console.log(result[0].student_id)
                const student = 'SELECT first_name, last_name FROM students WHERE student_id=?'
                const studentQuery = mysql.format(student, [result[0].student_id])
                console.log("studnet query", studentQuery)
                dbConnection.query(studentQuery, (err, result) => {
                    if (err) Sentry.captureException(new Error(err))
                    console.log(result)
                    resolve(result)
                })
            } else {
                resolve([])
            }
        })
    });
}