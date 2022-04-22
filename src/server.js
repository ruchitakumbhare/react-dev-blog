const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require("mongodb").MongoClient;
import path from 'path';

const app = express();
app.use(express.static(path.join(__dirname, './build')))
app.use(bodyParser.json());

const withDB = async (operations, res) => {
    try{
        const client =  await MongoClient.connect('mongodb://localhost:27017', {useNewUrlParser: true});
        const db = client.db('my-blog');
        await operations(db);
        client.close();

    } catch(error){
        res.status(500).json({message: 'Error connecting to db' + error});
    } 
}

app.get('/api/articles/:name', async (req, res)=>{
        withDB(async (db) =>{
            const articleName = req.params.name;
            const articlesInfo = await db.collection('articles').findOne({name: articleName})

            res.status(200).json(articlesInfo);
        }, res);      
})

app.post('/api/articles/:name/upvote', async (req, res)=>{
    withDB(async(db)=>{
        const articleName = req.params.name;
        
        const articlesInfo = await db.collection('articles').findOne({name: articleName});
        await db.collection('articles').updateOne({name: articleName},{ 
            '$set': {
                upvotes: articlesInfo.upvotes + 1,
            },
        });
        const updateArticleInfo = await db.collection('articles').findOne({name: articleName});
        res.status(200).json(updateArticleInfo);
    }, res);
        
    
});

app.post('/api/articles/:name/add-comment', async (req, res)=>{
        const {username, text} = req.body;
        const articleName = req.params.name;
       withDB(async (db)=>{
        const articlesInfo = await db.collection('articles').findOne({name: articleName});
        await db.collection('articles').updateOne({name: articleName},{ 
            '$set': {
                comments : articlesInfo.comments.concat({username, text})
            },
        });
        const updateArticleInfo = await db.collection('articles').findOne({name: articleName});
        res.status(200).json(updateArticleInfo);
       }, res);    
});

const PORT = 8000;
/*
app.get('/hello', (req, res) => {
    res.send('Hello!')
});
app.get('/hello/:name', (req, res) => {
    res.send(`Hello ${req.params.name}`)
});
app.post('/hello', (req, res)=>{
    res.send(`Hello ${req.body.name}`);
}) */
/*
app.post('/api/articles/:name/upvote', (req, res)=>{
    const articleName = req.params.name;
    articlesInfo[articleName].upvotes +=1;

    res.status(200).send(`${articleName} now has ${articlesInfo[articleName].upvotes} upvotes.`)
});

app.post('/api/articles/:name/add-comment', (req, res)=>{
    const {username, text} = req.body;
    const articleName = req.params.name;

    articlesInfo[articleName].comments.push({username, text});
    res.status(200).send(articlesInfo[articleName]);
})
*/
app.get('*', (req, res)=>{
    res.sendFile(path.join(__dirname + '/build/index.html'));
})
app.listen(PORT, () => console.log("Listening on " + PORT));
