const express = require("express");

const { pool } = require("./dBconfig");
const { name } = require("ejs");
const { url } = require("inspector");

const bcrypt = require("bcrypt");
const session = require("express-session")
const flash = require("express-flash");
const passport = require("passport");
const initializePassport= require("./passportConfig");
//const initializePassportSuperuser= require("./passConfigSuperuser");


initializePassport(passport);
//initializePassportSuperuser(passport);


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


app.get("/users/dashboard/buyMembership", (req, res)=>{
    res.render("buyMembership")})






    app.post("/users/dashboard/buyMembership", async (req, res) => {
        try {
            // Assuming you have authenticated users and can access the user's email from req.user.email
            const userEmail = req.user.email;
    
            // Retrieve user ID from the database based on the email
            const userQuery = 'SELECT id FROM users WHERE email = $1';
            const userResult = await pool.query(userQuery, [userEmail]);
    
            if (userResult.rows.length === 0) {
                // User not found
                return res.status(404).send("User not found");
            }
    
            const userId = userResult.rows[0].id;
    
            // Check if the user already has a membership
            const membershipQuery = 'SELECT * FROM membership WHERE user_id = $1';
            const membershipResult = await pool.query(membershipQuery, [userId]);
    
            if (membershipResult.rows.length > 0) {
                // User already has a membership, show details
                const membershipDetails = membershipResult.rows[0];
                return res.render("membershipDetails", { membershipDetails });
            }
    
            // User doesn't have a membership, proceed with purchasing a new one
            const paymentMethod = req.body.paymentMethod;
    
            // Extract start and end dates from the request body
            const { startDate, endDate } = req.body;
    
            // Calculate the number of weeks between start and end dates
            const start = new Date(startDate);
            const end = new Date(endDate);
            const millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
            const numberOfWeeks = Math.ceil((end - start) / millisecondsPerWeek);
    
            // Calculate the price based on the number of weeks
            const price = numberOfWeeks * 400;
    
            // Insert membership details into the membership table
            const query = `
                INSERT INTO membership (user_id, start_date, end_date, price, payment_method)
                VALUES ($1, $2, $3, $4, $5)
            `;
            const values = [userId, startDate, endDate, price, paymentMethod];
    
            await pool.query(query, values);
    
            // Redirect the user to the dashboard or a confirmation page
            res.redirect("/users/dashboard/buyMembership/confirmation");
        } catch (error) {
            console.error("Error purchasing membership:", error);
            res.status(500).send("Error purchasing membership");
        }
    });
    



    app.get("/users/dashboard/buyMembership/confirmation", (req, res)=>{
        res.render("confirmation")
    })
    



// Admin route handling

app.get("/users/admin/login", (req, res)=>{
    res.render("adminLogin")
})

app.post("/users/admin/login", async(req, res) => {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
        return res.status(400).send("Email and password are required");
    }

    // Query the database to find the admin with the provided email
    pool.query('SELECT * FROM admins WHERE email = $1', [email], (err, result) => {
        if (err) {
            console.error('Error retrieving admin:', err);
            return res.status(500).send('Internal Server Error');
        }

        // If no admin found with the provided email
        if (result.rows.length === 0) {
            return res.status(401).send('Invalid email or password');
        }

        const admin = result.rows[0];

        // Compare the provided password with the hashed password stored in the database
        bcrypt.compare(password, admin.password, (bcryptErr, bcryptResult) => {
            if (bcryptErr) {
                console.error('Error comparing passwords:', bcryptErr);
                return res.status(500).send('Internal Server Error');
            }

            if (!bcryptResult) {
                // Passwords don't match
                return res.status(401).send('Invalid email or password');
            }
           // const query = 'SELECT * FROM users';
            //const { rows: users } = await pool.query(query);
            // Passwords match, redirect to admin home
            res.redirect("/users/admin/adminHome")
            //res.render("adminHome",);
        });
    });
});


app.get("/users/admin/adminHome", async (req, res) => {
    try {
        // Query to fetch all users from the database
        const query = 'SELECT * FROM users';
        const { rows: users } = await pool.query(query);

        // Render the admin home page with the fetched user data
        res.render("adminHome", { users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Error fetching users');
    }
});

// Express route to handle user deletion
// Express route to handle user deletion
app.post("/users/admin/userDelete/:id", async (req, res) => {
    try {
        const userId = req.params.id;

        // Delete associated records from the membership table
        await pool.query('DELETE FROM membership WHERE user_id = $1', [userId]);

        // Now, delete the user from the users table
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);

        res.status(200).send('User deleted successfully.');
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Error deleting user');
    }
});



// Express route to render admin home page with user data
app.get("/users/admin/adminHome", async (req, res) => {
    try {
        // Query to fetch all users from the database
        const query = 'SELECT * FROM users';
        const { rows: users } = await pool.query(query);

        // Render the admin home page with the fetched user data
        res.render("adminHome", { users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Error fetching users');
    }
});
app.post("/users/admin/logout", (req, res) => {
    req.logOut(function(err) {
        if (err) {
            console.error("Error logging out:", err);
            res.status(500).send("Error logging out");
            return;
        }
        req.flash("success_msg", "You have successfully logged out.");
        res.redirect("/users/admin/login");
    });
});



app.get("/users/admin/superuser", (req, res)=>{
    res.render("superuser")
})

// Modify the route to handle user authentication
app.post("/users/admin/superuser", async (req, res) => {
    const { email, password } = req.body;

    // Query the database to find the user with the provided email
    try {
        const query = 'SELECT * FROM superuser WHERE email = $1';
        const { rows } = await pool.query(query, [email]);

        // If no user found with the provided email
        if (rows.length === 0) {
            req.flash("error", "Invalid email or password");
            res.redirect("/users/admin/superuser");
            return;
        }

        const user = rows[0];

        // Compare the provided password with the password stored in the database
        if (password !== user.password) {
            req.flash("error", "Invalid email or password");
            res.redirect("/users/admin/superuser");
            return;
        }

        // Authentication successful, redirect to the user's home page
        res.redirect("/superuser/home");
    } catch (error) {
        console.error('Error authenticating user:', error);
        req.flash("error", "Internal Server Error");
        res.redirect("/users/admin/superuser");
    }
});





app.get("/superuser/home", (req, res)=>{
    res.render("homeSuper")
})

app.post("/superuser/home/logout", (req, res)=>{
    req.logOut(function(err) {
        if (err) {
            console.error("Error logging out:", err);
            res.status(500).send("Error logging out");
            return;
        }
        req.flash("success_msg", "You have successfully logged out.");
        res.redirect("/users/admin/superuser");
    });
})


app.get("/superuser/adminRegister", (req, res)=>{
    res.render("adminRegister")
})

app.post("/superuser/adminRegister", async (req, res)=>{
    let{name, age, email, password, password2, shift} = req.body;
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
    res.render("adminRegister",{errors})
}
else{
    // form validation complete

    let hashedPassword= await bcrypt.hash(password, 10)
    console.log(hashedPassword)

    pool.query(
        'SELECT * FROM admins  WHERE email = $1', [email], (err, result)=>{              //result is defined in "pg" lib.

            if (err){
                throw err;
            }

            console.log(result.rows)

            if(result.rows.length>0){
                errors.push({message:"email already registered"})
                res.render("adminRegister", {errors})
            }
            else{
                pool.query(
                    `INSERT INTO admins (name, age, email, password, shift)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING id, password`,[name, age, email, hashedPassword, shift],(err, result)=>{

                        if(err){
                            throw err;
                        }
                        console.log(result.rows);
                        
                        req.flash("success_msg", "You are now registered. Please log in");
                        res.render("adminRegister",)
                        //res.status(200).send('Admin created successfully.');
                    }
                    
                )
            }

        }
    )
}

})


app.get("/superuser/adminDelete", async (req, res) => {
    try {
        const query = 'SELECT * FROM admins';
        const { rows } = await pool.query(query);
        res.render("adminDelete", { admins: rows });
    } catch (error) {
        console.error('Error fetching admins:', error);
        res.status(500).send('Error fetching admins');
    }
});

app.post("/superuser/adminDelete/:id", async (req, res) => {
    try {
        const adminId = req.params.id;

        // SQL query to delete the admin based on ID
        const query = 'DELETE FROM admins WHERE id = $1';
        const values = [adminId];

        // Execute delete query
        const result = await pool.query(query, values);

        res.status(200).send('Admin deleted successfully.');
    } catch (error) {
        console.error('Error deleting admin:', error);
        res.status(500).send('Error deleting admin');
    }
});

app.listen(PORT)