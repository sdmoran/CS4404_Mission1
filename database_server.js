const { Sequelize, Model, DataTypes } = require('sequelize');
const { uuid } = require('uuidv4')
const sequelize = new Sequelize('sqlite::memory:')

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

function createTestUsers() {
    for(let i = 0; i < 5; i++) {
        const id = uuid();
        console.log("UUID: ", id)
        User.create({id: id})
    }
}

// Express server
const express = require('express')
const app = express()
const port = 5000

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

// Attempt to add vote to DB
app.post('/vote', (req, res) => {
    const id = req.param('id')
    const candidate = req.param('candidate').toLowerCase()
    console.log(`ID: ${id}, Candidate: ${candidate}`)

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