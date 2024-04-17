const express = require("express");

const app =  express();
const PORT = process.env.PORT ||3000

app.set("view engine", "ejs");
app.get("/", (req, res)=>{

    res.render("home")
})

app.get("/users/register", (req,res)=>{
    res.render("register")
})

app.get("/users/login", (req, res)=>{
    res.render("login")
})


app.get("/users/dashboard", (req, res)=>[
    res.render("dashboard")
])

app.get("/users/logout", (req, res)=>{

    res.render("home")
})

app.listen(PORT)