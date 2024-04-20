const LocalStrategy = require("passport-local").Strategy;
const { pool } = require("./dBconfig");
const bcrypt = require("bcrypt");



function initializeSuperuser(passport) {
    console.log("Initialized superuser");
  
    const authenticateUser = (email, password, done) => {
      console.log(email, password);
      pool.query(
        `SELECT * FROM superuser WHERE email = $1 AND password = $2`,
        [email, password],
        (err, results) => {
          if (err) {
            throw err;
          }
          console.log(results.rows);
  
          if (results.rows.length > 0) {
            const user = results.rows[0];
            return done(null, user);
          } else {
            // No user or password is incorrect
            return done(null, false, { message: "Invalid email or password" });
          }
        }
      );
    };
  
    passport.use(
      new LocalStrategy(
        { usernameField: "email", passwordField: "password" },
        authenticateUser
      )
    );
  
    passport.serializeUser((user, done) => done(null, user.id));
  
    passport.deserializeUser((id, done) => {
      pool.query(`SELECT * FROM superuser WHERE id = $1`, [id], (err, results) => {
        if (err) {
          return done(err);
        }
        console.log(`ID is ${results.rows[0].id}`);
        return done(null, results.rows[0]);
      });
    });
  }
  
  module.exports = initializeSuperuser;
  