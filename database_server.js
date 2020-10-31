const { Sequelize, Model, DataTypes } = require('sequelize')
const { v4: uuidv4 } = require('uuid')
const fs = require('fs')
const numTestUsers = 100
const sequelize = new Sequelize('sqlite::memory:')
const candidates = ["Reebok Obama", "Mittens Rhombus", "Vermin Supreme", "Sheev Palpatine", "John McCain"]


class User extends Model {}
User.init({
    id: {
        type: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    }
}, {sequelize, modelName: 'user'})

class Vote extends Model {}
Vote.init({
    id: {
        type: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    candidate: {
        type: DataTypes.STRING
    }
}, { sequelize, modelName: 'vote'});

sequelize.sync({ force: true})
    .then(() => {
        createTestUsers();
    })
    .catch((e) => {
        console.log(e)
    })

// Create test users
function createTestUsers() {
    // Clear file so we don't have UUIDs from previous runs
    fs.truncate('userIDs.txt', 0, function(){console.log('Cleared userIDs.txt')})
    let writeStream = fs.createWriteStream('userIDs.txt', {
        flags: 'a'
    });
    for(let i = 0; i < numTestUsers; i++) {
        const id = uuidv4();
        writeStream.write(`${id}\n`)
        User.create({id: id})
    }
    writeStream.end();
}

// Express server
const express = require('express')
const bodyParser = require('body-parser')
var corsMiddleware = require('cors')
const app = express()

// Parse application/json
app.use(bodyParser.json())

const port = 5000

const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200
}

// Get results, grouped by candidate
app.get('/results', (req, res) => {
    Vote.findAll({
        group: 'candidate',
        attributes: [
            'candidate',
            [sequelize.fn('COUNT', sequelize.col('id')), 'votes']
        ]
    })
    .then((votes) => {
        res.send(JSON.stringify(votes))
    })
})

// Send list of candidates
app.get('/candidates', corsMiddleware(corsOptions), (req, res) => {
    res.send(JSON.stringify(candidates))
})

// Post requests needs options
app.options('/vote', corsMiddleware(corsOptions))

// Attempt to add vote to DB
app.post('/vote', corsMiddleware(corsOptions), (req, res) => {
    const id = req.param('id')
    var candidate = req.param('candidate')

    console.log(`ID: ${id}, Candidate: ${candidate}`)

    if(!candidate || !id) {
        res.status(403).send("Vote failed")
        return
    }
    candidate = candidate.toLowerCase()

    User.findByPk(id)
    .then((rec) => {
        if(rec) {
            // If id exists in users, try to create vote
            Vote.create({ id: id, candidate: candidate})
            .then(() => {
                res.status(200).send("OK")
            })
            .catch(() => { // If this id has already voted, let client know vote failed
                res.status(403).send("Vote failed")
            })
        }
        else {
            res.status(404).send(`Couldn't find record for voter id: ${id}`)
        }
    })
})

app.listen(port, () => {
  console.log(`Database server listening at http://localhost:${port}`)
})