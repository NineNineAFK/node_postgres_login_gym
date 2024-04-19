const express = require("express");

const { pool } = require("./dBconfig");
const { name } = require("ejs");
const { url } = require("inspector");

const bcrypt = require("bcrypt");
const session = require("express-session")
const flash = require("express-flash");
const passport = require("passport");
const initializePassport= require("./passportConfig");
initializePassport(passport);

const app =  express();



app.use(express.urlencoded({extended:false}))

app.use(session({
    secret:"secret",
    resave:false,
    saveUninitialized: false,
}))
// Funtion inside passport which initializes passport
app.use(passport.initialize());
// Store our variables to be persisted across the whole session. Works with app.use(Session) above
app.use(passport.session());
app.use(flash());


const PORT = process.env.PORT ||3000

app.set("view engine", "ejs");
app.get("/", (req, res)=>{

    res.render("home")
})

app.get("/users/register", (req,res)=>{
    res.render("register")
})


app.post("/users/register", async (req, res)=>{
    let{name, email, password, password2} = req.body;
    // console.log({
    //     name,
    //     email,
    //     password,
    //     password2,
    // });

    
let errors = [];

if(!name || !email || !password || !password2){
    errors.push({message:"please enter all fields   "});
}
if(password.length< 6){
    errors.push({message:"password must be at least 6 digits"});
}

if (password !=password2){
    errors.push({message:"passwords do not match"})
}

if (errors.length>0){
    res.render("register",{errors})
}
else{
    // form validation complete

    let hashedPassword= await bcrypt.hash(password, 10)
    console.log(hashedPassword)

    pool.query(
        'SELECT * FROM users  WHERE email = $1', [email], (err, result)=>{              //result is defined in "pg" lib.

            if (err){
                throw err;
            }

            console.log(result.rows)

            if(result.rows.length>0){
                errors.push({message:"email already registered"})
                res.render("register", {errors})
            }
            else{
                pool.query(
                    `INSERT INTO users (name, email, password)
                    VALUES ($1, $2, $3)
                    RETURNING id, password`,[name, email, hashedPassword],(err, result)=>{

                        if(err){
                            throw err;
                        }
                        console.log(result.rows);
                        req.flash("success_msg", "You are now registered. Please log in");
                        res.redirect("/users/login",)
                    }
                    
                )
            }

        }
    )
}

})



app.get("/users/login", (req, res)=>{
    res.render("login")
})


app.get("/users/dashboard", (req, res)=>[
    res.render("dashboard")
])

app.get("/users/logout", (req,res) => {
    req.logOut(function(err) {
        if (err) { return next(err); }
        req.flash("success_msg", "You have successfully logged out.");
        res.redirect("/users/login");
    });
})


app.post("/users/login", passport.authenticate('local',{
    successRedirect: "/users/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true, 
}))

app.listen(PORT)