const express = require('express')
const app=express();
const cors=require('cors');
const MongoStore = require('connect-mongo').default;
const session = require('express-session');
const authRoute = require('./route/auth');
const thumbnailRoute = require('./route/thumbnail');
const userRoute = require('./route/user');


app.use(express.json())



app.use(cors({
    origin:[process.env.CLIENT_URL],
    methods:['GET','POST','PUT','DELETE'],
    allowedHeaders:[
        'Content-Type',
        'Authorization',
        'Cache-Control',
        'Expires',
        'Pragma'
    ],
    credentials:true
}))



app.use(session({
    name:"sessionId", // cookie name
    secret: process.env.SESSION_SECRET, // should be in .env
    resave: false, // don’t save session if unmodified
    saveUninitialized: false, // don’t create empty sessions
    store: MongoStore.create({
        mongoUrl: process.env.CONN_STR,
        collectionName: 'sessions', // optional
    }),
    cookie: {
        httpOnly: true, // client-side JS cannot access cookie
        secure: true, // HTTPS only in prod
        sameSite:'none',
        maxAge: 24 * 60 * 60 * 1000 // 1 day in ms
    }
}));


app.use('/api/auth',authRoute)
app.use('/api/thumbnail',thumbnailRoute)
app.use('/api/user',userRoute)

module.exports=app