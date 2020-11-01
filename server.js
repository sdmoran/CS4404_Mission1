const express = require('express')
const http = require('http')
const bodyParser = require('body-parser')
const app = express()
const port = 3000

const secret = process.env.DATA_SECRET || "default_secret"

app.use(express.static('public'))
app.use(bodyParser.json())


app.get('/', (req, res) => {
  res.sendFile('index.html')
})

app.get('/candidates', (req, res) => {
  options = {
    hostname: process.env.DATABASE_HOST || "localhost",
    port: 5000,
    path: '/candidates',
    method: "GET"
  }
  const r = http.request(options, resData => {
    resData.on('data', d => {
      res.send(d)
    })
  })
  r.end()
})

app.post('/vote', (req, res) => {
  const id = req.param('id')
  var candidate = req.param('candidate')

  const data = JSON.stringify({
    id: id,
    candidate: candidate,
    secret: secret
  })

  console.log(`ID: ${id}, Candidate: ${candidate}`)

  const options = {
    hostname: process.env.DATABASE_HOST || "localhost",
    port: 5000,
    path: '/vote',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    },
  }

  const r = http.request(options, dataRes => {
    console.log(res.statusCode)
    dataRes.on('data', d => {
      res.status(200).send(d)
    })
  })


  r.on('error', e => {
    res.status(400).send(e)
  })

  r.write(data)
  r.end()

})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})