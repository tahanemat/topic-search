const express = require('express')
const MongoClient = require('mongodb').MongoClient;
const app = express()
const port = 3000
const user = process.env.APPUSER || "taha";
const password = process.env.PASSWORD || "taha";

const uri = `mongodb+srv://${user}:${password}@cluster0.txwml.mongodb.net/pencil?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect((err, res) => {
  if (!err) {
    console.log('Connection to database established')
  }
  console.log('Connection to database could not be established')
});

app.get('/', (req, res) => {
  res.send('Health check!')
})

app.get('/search', async (req, res) => {
    const query = req.query.q
    if (!query) {
        res.send('Please enter query')
        return
    }
    const database = client.db("pencil");
    const topics = database.collection("topics");
    const questions = database.collection("questions");
    const myQuery = {name: query}
    const topic = await topics.findOne(myQuery);
    if (!topic) {
      res.send('none found')
      return
    }
    let listOfTopics = [topic._id]
    if (topic.subtopics) {
      listOfTopics = listOfTopics.concat(topic.subtopics)
    }
    const cursor = await questions.find({ "topics": { $in: listOfTopics }})
    let listOfQuestions = [] 
    await cursor.forEach(question => {
      listOfQuestions.push(question._id)
    })
    res.send(listOfQuestions)
})

app.get('/textsearch', async (req, res) => {
    const query = req.query.q
    if (!query) {
        res.send('Please enter query')
        return
    }
    const database = client.db("pencil");
    const topics = database.collection("topics");
    const questions = database.collection("questions");
    const topic_cursor = await topics.find({ $text: { $search: query } });
    const possible_matches = []
    await topic_cursor.forEach(doc => possible_matches.push(doc));
    let listOfTopics = []
    possible_matches.forEach(possible_match => {
      listOfTopics.push(possible_match._id);
      if (possible_match.subtopics) {
        listOfTopics = listOfTopics.concat(possible_match.subtopics);
      }
    })
    const cursor = await questions.find({ "topics": { $in: listOfTopics }})
    let listOfQuestions = [] 
    await cursor.forEach(question => {
      listOfQuestions.push(question._id)
    })
    res.send(listOfQuestions)
})

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`)
})
