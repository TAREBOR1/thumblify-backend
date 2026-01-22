const express = require('express')
const app=express();
const cors=require('cors');
const MongoStore = require('connect-mongo').default;
const session = require('express-session');
const cookieParser = require('cookie-parser');
const authRoute = require('./route/auth');
const thumbnailRoute = require('./route/thumbnail');
const userRoute = require('./route/user');


app.use(express.json())
app.use(express.urlencoded({ extended: true })); 



app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    exposedHeaders: ['set-cookie']
}));

app.set('trust proxy',1)
app.use(cookieParser());;





app.use('/api/auth',authRoute)
app.use('/api/thumbnail',thumbnailRoute)
app.use('/api/user',userRoute)

module.exports=app