import requests, random, json

url = "http://localhost:3000"

candidates = requests.get(url + '/candidates').json()

with open('userIDs.txt', 'r') as f:
    for line in f:
        vote = {'id': line.strip(), 'candidate': random.choice(candidates)}
        print(vote)
        x = requests.post(url + '/vote', headers={'content-type': 'application/json'}, data=json.dumps(vote))
        print(x.text)