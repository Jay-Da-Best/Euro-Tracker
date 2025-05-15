// Libaries
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const path = require('path');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const session = require('express-session');
const { error, log } = require('console');
const { stringify } = require('querystring');


// Configurations
const app = express();
const port = 3000;

// body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Serve css and other files
app.use(express.static(path.join(__dirname, '/Public')));


// EJS
app.set('views', path.join(__dirname, '/Public/Views'));
app.set('view engine', 'ejs');


// mysql
var connection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'website'
});


// bcrypt
const salt_rounds = 10

// session
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false
    }
}));


// Functions
// random functions
function random_string(length) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
  

// Sign up validation

async function username_validation(username) {
    const results = await connection.query(`SELECT username FROM users WHERE username = '${username}'`);

    try {
        check = results[0][0].username
        return false
    } catch {
        return true
    };
};

async function password_validation(password) {
    regex = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
    err_count = 0;
    err = ''

    if (password.length < 8) {
        err_count++;
        err = 'len';
    } ;

    if (!regex.test(password)) {
        err_count++;
        err = 'spec';
    };

    if (err_count == 2) {
        return 'both';
    } else if (err == 'len') {
        return 'len';
    } else if (err == 'spec') {
        return 'spec';
    } else {
        return true;
    };
};


// POST requests

// sign in
app.post('/signup-auth', async (req, res) => {
    username = req.body.username;
    password = req.body.password;
    confirm_password = req.body.password_confirm;
    email = req.body.email;

    user_check = await username_validation(username)
    if (!user_check) {
        return res.redirect('/signup/user');
    };

    password_check = await password_validation(password);
    if (password_check == true) {
    } else {
        if (password_check == 'both') {
            return res.redirect('/signup/pass-both');
        } else if (password_check == 'len') {
            return res.redirect('/signup/pass-len');
        } else {
            return res.redirect('/signup/pass-spec');
        };
    };

    if (password == confirm_password) {
        return res.redirect('/signup/pass-confirm');
    };

    salt = await bcrypt.genSalt(salt_rounds);
    hashed_pass = await bcrypt.hash(password, salt);
    await connection.query(`INSERT INTO users (username, password, email) VALUES ('${username}', '${hashed_pass}', '${email}')`);
    
    unique_string = random_string(8);
    id = await connection.query(`SELECT id FROM users WHERE username = '${username}'`);
    id = id[0][0].id
    await connection.query(`INSERT INTO email_verification (user_id, email_token) VALUES ('${id}', '${unique_string}')`)

    function send_mail(email, unique_string) {
        var transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'eurothingy@gmail.com',
                pass: 'vtnu tiew adpt zkcp'
            }
        });

        var sender = 'Euro Tracker'
        var mail_options = {
            from: sender,
            to: email,
            subject: 'Email Confirmation',
            html: `Press <a href=http://localhost:3000/verify/${unique_string}> here </a> to verify your email`
        };

        transport.sendMail(mail_options);
    };
    await send_mail(email, unique_string);
    return res.redirect('/email_auth');
});

// login
app.post('/login-auth', async (req,res) => {
    username = req.body.username;
    password = req.body.password;

    const results = await connection.query(`SELECT id, password, is_email_verified FROM users WHERE username = '${username}'`);

    try {
        email_verfied = results[0][0].is_email_verifed;
        hashed_pass = results[0][0].password;
        id = results[0][0].id;
    } catch {
        return res.redirect('/login/both');
    };

    is_pass_correct = await bcrypt.compare(password, hashed_pass)
    if (is_pass_correct == false) {
        return res.redirect('/login/both');
    };

    if (email_verfied == 0) {
        return res.redirect('/email_auth');
    }

    req.session.loggedin = true;
    req.session.userid = String(id);
    return res.redirect(`/account/${id}`);
});

// Add an event
app.post('/admin/add', async (req,res) => {
    const year = new Date().getFullYear();
    await connection.query(`CREATE TABLE country_list_${year} (country_id int auto_increment not null, name varchar(255) not null, primary key (country_id))`);
    await connection.query(`CREATE TABLE country_scores_${year} (country_id int not null, user_id int not null, score int not null, created_at datetime default current_timestamp, foreign key (country_id) referneces country_list_${year}(country_id), foreign key (user_id) references users(id))`);

    for (const i in req.body) {
        await connection.query(`INSERT INTO country_list_${year} (name) VALUES ('${req.body[i]}')`);
    };
    return res.redirect('/admin');
});

// get data for editing
app.post('/admin/edit_select', async (req,res) => {
    value = req.body.edit
    if (value == '1') {
        return 'nuh uh'
    };
    req.session.selected_year = value
    results = await connection.query(`SELECT name FROM ${value}`);
    return res.json({
        data: results[0]
    })
});

// edit an event
app.post('/admin/edit', (req,res) => {
    const len = Object.keys(req.body).length;
    for (i = 0; i < len; i++) {
        connection.query(`UPDATE ${req.session.selected_year} SET name = '${req.body[i + 1]}' WHERE country_id = ${i + 1}`);
    };
    return res.redirect('/admin');
});

// delete an event
app.post('/admin/delete', (req,res) => {
    table = req.body.edit;
    connection.query(`drop table ${table}`);
    connection.query(`drop table country_scores_${table.slice(-4)}`);
    return res.json({
        success: true
    });
});

// Add/Edit score
app.post('/account/add', (req, res) => {
    score = req.body.score;
    country = req.body.country;
    connection.query(`UPDATE country_scores_${new Date().getFullYear()} SET score = ${score} WHERE user_id = ${req.session.userid} AND country_id = ${country}`);
});

// Grab users scores to display
app.post('/account/user_stats', async (req, res) => {
    names = await connection.query(`SELECT name FROM country_list_${new Date().getFullYear()}`);
    scores = await connection.query(`SELECT score FROM country_scores_${new Date().getFullYear()} WHERE user_id = ${req.session.userid}`);
    return res.json({
        names: names,
        scores: scores,
    })
});

// Grab users top three scores
app.post('/account/user_top', async (req, res) => {
    results = await connection.query(`select country_id from country_scores_${new Date().getFullYear()} where user_id = ${req.session.userid} order by score desc limit 3`);
    results = results[0]
    names = await connection.query(`SELECT name FROM country_list_${new Date().getFullYear()} WHERE country_id IN (${results[0].country_id}, ${results[1].country_id}, ${results[2].country_id})`);
    return res.json({
        names: names,
    });
});

app.post('/account/total_top', async (req,res) => {
    // Query the number of countries
    const num = await connection.query(`SELECT COUNT(country_id) AS count FROM country_list_${new Date().getFullYear()}`);
    const total_countries = num[0][0].count;

    // Initialize total_score array
    let total_score = [];

    // Calculate total scores for each country
    for (let i = 0; i < total_countries; i++) {
        const result = await connection.query(`SELECT SUM(score) AS sum FROM country_scores_${new Date().getFullYear()} WHERE country_id = ${[i + 1]}`);
        total_score.push(result[0][0].sum);
    };

    // Sort the total scores in descending order
    const sorted_total = total_score.toSorted((a, b) => b - a);

    // Get the top 3 names
    let top = [];
    for (let i = 0; i < 3; i++) {
        const index = total_score.indexOf(sorted_total[i]);
        const results = await connection.query(`SELECT name FROM country_list_${new Date().getFullYear()} WHERE country_id = ${[index + 1]}`);
        top.push(results[0][0].name);
    };

    // Return the top 3 names
    return res.json({
        names: top,
    });
});

app.post('/account/total_graph', async (req, res) => {
    // Query the number of countries
    const num = await connection.query(`SELECT COUNT(country_id) AS count FROM country_list_${new Date().getFullYear()}`);
    const total_countries = num[0][0].count;

    // Initialize total_score array
    let total_score = [];

    // Calculate average scores for each country
    for (let i = 0; i < total_countries; i++) {
        const average = await connection.query(`SELECT AVG(score) AS average FROM country_scores_${new Date().getFullYear()} WHERE country_id = ${[i + 1]}`)
        total_score.push(average[0][0].average);
    };

    // Grab names of the contries
    let names = await connection.query(`SELECT name FROM country_list_${new Date().getFullYear()}`);
    
    return res.json({
        names: names[0],
        scores: total_score,
    });
});


// GET requests
// email verification
app.get('/verify/:unique_string', async (req,res) => {
    unique_string = req.params.unique_string

    const results = await connection.query(`SELECT user_id FROM email_verification WHERE email_token = '${unique_string}'`);

    try {
        id = results[0][0].user_id
    } catch {
        return res.redirect('/home');
    };

    connection.query(`UPDATE users SET is_email_verified = true WHERE id = ${id}`);
    connection.query(`DELETE FROM email_verification WHERE user_id = ${id}`);
    res.redirect('/account')
});

// account
app.get('/account/:id', async (req,res) => {
    if (req.session.loggedin == true) {
        if (req.session.userid == req.params.id) {
            if (req.session.userid == 2) {
                return res.redirect('/admin');
            };
            const user = await connection.query(`SELECT username FROM users WHERE id = ${req.session.userid}`);
            let names;
            let scores;
            try {
                names = await connection.query(`select name from country_list_${new Date().getFullYear()}`);
                names = names[0]
            } catch {
                names = ''
            } try {

                scores = await connection.query(`select score from country_scores_${new Date().getFullYear()} where user_id = ${req.session.userid}`);
                scores = scores[0]
            } catch {
                try {
                    for (i in names) {
                        await connection.query(`insert into country_scores_${new Date().getFullYear()} (country_id, user_id, score) values (${parseInt(i) + 1}, ${req.session.userid}, 0)`);
                    };
                    scores = await connection.query(`select score from country_scores_${new Date().getFullYear()} where user_id = ${req.session.userid}`);
                    scores = scores[0]
                } catch {
                    scores = ''
                };
            };
            return res.render('account', {user: user[0][0].username, id: req.session.userid, names: names, scores: scores});
        } else {
            return res.redirect('/login');
        };
    } else {
        return res.redirect('/login');
    };
});

app.get('/account/:id/stats', async (req,res) => {
    if (req.session.loggedin) {
        if (req.session.userid == req.params.id) {
            user = await connection.query(`SELECT username FROM users WHERE id = ${req.session.userid}`);
            return res.render('account_stats', {user: user[0][0].username});
        } else {
            return res.redirect('/login');
        };
    } else {
        return res.redirect('/login');
    };
});

app.get('/admin', async (req,res) => {
    if (req.session.loggedin) {
        if(req.session.userid == 2) {
            results = await connection.query('SELECT table_name FROM information_schema.tables WHERE table_name like "%country_list_%"');
            if (results[0][0] == undefined) {
                data = ['']
            } else {
                data = [results[0][0].TABLE_NAME]
            }
            res.render('admin', {data: data});
        } else {
            res.redirect('/login');
        }
    } else {
        res.redirect('/login');
    };
});

// login
app.get('/login/:error', (req,res) => {
    res.render('login', {error: req.params.error});
});

// sign up
app.get('/signup/:error', (req, res) => {
    res.render('signup', {error: req.params.error});
});

// none specific requests
app.get('/:page', (req,res) => {
    res.render(`${req.params.page}`, {error: ''});
});

// redirect to the home page
app.get('/', (req, res) => {
    res.redirect('/home');
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});