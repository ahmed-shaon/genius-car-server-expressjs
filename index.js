const express = require('express');
const cors = require('cors');
const jwt= require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

//middle wares
app.use(cors());
app.use(express.json());


//db connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.4dokkij.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    console.log(authHeader);
    if(!authHeader){
        return res.status(401).send({message:'unauthorized access'})
    }
    const token = authHeader.split(' ')[1];
    console.log(token)
    jwt.verify(token, process.env.JWT_TOKEN_SECRET, function(err, decoded){
        if(err){
            return res.status(401).send({message:'unauthorized access'})
        }
        req.decoded = decoded;
        next();
    })
}

async function run(){
    try{
        const serviceCollection = client.db("geniuscarDB").collection('services');
        const orderCollection = client.db('geniuscarDB').collection('orders');
        app.get('/services', async(req, res) => {
            const query = {};
            const cursore = serviceCollection.find(query);
            const services = await cursore.toArray();
            res.send(services);
        })

        app.get('/services/:id', async (req, res) =>{
            const id = req.params.id;
            const query = {_id:ObjectId(id)};
            const service = await serviceCollection.findOne(query);
            res.send(service);
        })

        //get orders by query
        app.get('/orders',verifyJWT, async(req, res) => {
            
            const decoded = req.decoded;
            // console.log(decoded);
            if(decoded.email !== req.query.email){
                return res.send({message:'unauthorized access'})
            }
            let query = {};
            // console.log(req.query)
            if(req.query.email){
                query = {
                    email:req.query.email
                }
            }
            const cusore = orderCollection.find(query);
            const orders = await cusore.toArray();
            res.send(orders);
        })

        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
            console.log(result);
        })

        app.patch('/orders/:id', async(req, res) => {
            const status = req.body.status;
            const id = req.params.id;
            const query = {_id:ObjectId(id)};
            const doc = {
                $set:{
                    status:status
                }
            }
            const result = await orderCollection.updateOne(query, doc);
            res.send(result);
        })

        app.delete('/orders/:id', async (req,res) => {
            const id = req.params.id;
            const query = {_id:ObjectId(id)}
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        })

        //json web-token
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.JWT_TOKEN_SECRET, {expiresIn:'1h'});
            res.send({token});
        })
    }
    finally{

    }
}
run().catch(err => console.log(err))


app.get('/', (req, res) => {
    res.send('Genius car server is running');
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})