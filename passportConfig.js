const LocalStrategy = require("passport-local").Strategy;
const { pool } = require("./dBconfig");
const bcrypt = require("bcrypt");

function initialize(passport) {
    console.log("Initialized");

    const authenticateUser = async (email, password, done) => {
        // Query the database to find the user with the given email
        try {
            const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            if (rows.length === 0) {
                return done(null, false, { message: "No user with that email address" });
            }

            const user = rows[0];

            // Compare the hashed password with the provided password
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return done(null, false, { message: "Password is incorrect" });
            }

            // Authentication successful, return the user
            return done(null, user);
        } catch (error) {
            console.error('Error authenticating user:', error);
            return done(error);
        }
    };

    passport.use(
        new LocalStrategy(
            { usernameField: "email", passwordField: "password" },
            authenticateUser
        )
    );

    passport.serializeUser((user, done) => done(null, user.id));

    passport.deserializeUser((id, done) => {
        pool.query(`SELECT * FROM users WHERE id = $1`, [id], (err, results) => {
            if (err) {
                return done(err);
            }
            return done(null, results.rows[0]);
        });
    });
}

module.exports = initialize;
