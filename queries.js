const { model } = require("mongoose")
const Pool = require('pg').Pool
const sgMail = require('@sendgrid/mail');
require('dotenv').config()

const tokenManager = require('./tokenmanager.js')

const pool = new Pool({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: 5432
})

//SQL

async function getAllUsers(req, res) {

    await pool.query('SELECT * FROM users', (error, results) => {
        if (error) {
            throw error
        }

        res.status(200).json(results.rows)
    })
}

// async function getUserInfo(req, res) {

//     await pool.query('SELECT * FROM users WHERE userid = ', (error, results) => {
//         if (error) {
//             throw error
//         }

//         res.status(200).json(results.rows)
//     })
// }


async function registerUser(req, res) {
    const username = req.body.username
    const password = req.body.password
    const email = req.body.email

    await pool.query('INSERT INTO users (username, password, email) VALUES ($1, $2, $3)', [username, password, email], (error, results) => {

        if (error) {
            throw error
        }

        res.status(201).send('user added')
    })

}

async function deleteUser(req, res) {
    const userid = req.user
    await pool.query("DELETE FROM time WHERE userid = $1", [userid], (error, results) => {
        if (error) {
            throw error
        }
    })
    await pool.query("DELETE FROM users WHERE id = $1", [userid], (error, results) => {
        if (error) {
            throw error
        }
    })
    res.status(200).send(`User ID: ${userid} has been deleted`)
}


async function updateUser(req, res) {

    const userid = req.user

    const username = req.body.name
    const email = req.body.email
    const password = req.body.password


    await pool.query('UPDATE users SET username = $1, email = $2, password $3 WHERE id = $4', [username, email, password, userid], (error, results) => {
        if (error) {
            throw error
        }
    })
    res.status(200).send(`User ID: ${userid} was modified`)

}

async function login(req, res) {
    const email = req.body.email
    const password = req.body.password

    console.log(email, password)

    await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password], (error, results) => {
        if (error) {
            throw error
        }

        const token = tokenManager.generateToken(results.rows[0].id)

        const user = results.rows
        res.status(200).json({
            "token": token,
            "user": user
        })
    })





}

async function clockin(req, res) {

    await pool.query('INSERT INTO time(userid, clockin) VALUES ($1, NOW()) RETURNING id', [req.user], (error, results) => {
        if (error) {
            throw error
        }
        console.log(results.rows)
        res.status(200).json(results.rows)

    })
}


async function clockout(req, res) {
    const clockid = req.body.clockid
    await pool.query(`UPDATE time SET clockout = NOW() WHERE id = ${clockid}`, (error, results) => {
        if (error) {
            throw error
        }
        console.log(results.rows)
        res.status(200).send(results.rows)

    })
}


async function gettime(req, res) {

    const userid = req.user
    await pool.query("SELECT to_char(clockin, 'DAY, DD MONTH YYYY HH:MM:SS') as clockin, to_char(clockout, 'DAY, DD MONTH YYYY HH:MM:SS') as clockout FROM TIME WHERE userid = $1", [userid], (error, results) => {
        if (error) {
            throw error

        }
        res.status(200).json(results.rows)
    })
}


async function postPic(req, res) {

    let profilepic = req.body.profilepic
    let userid = req.user

    await pool.query('UPDATE users SET profilepic = $1 WHERE id = $2', [profilepic, userid], (error, results) => {
        if (error) {
            throw error
        }
        console.log(results.rows)
        res.status(200).json(results.rows)

    })
}

async function getPic(req, res) {

    let userid = req.user

    await pool.query('SELECT profilepic FROM users WHERE id = $1', [userid], (error, results) => {
        if (error) {
            throw error
        }
        console.log(results.rows)
        res.status(200).json(results.rows)

    })
}


async function updateUser(req, res) {

    let userid = req.user
    let username = req.body.username
    let password = req.body.password
    let email = req.body.email
    // let role = req.body.role

    await pool.query('UPDATE users SET username = $1, password = $2, email = $3 WHERE id = $4 ', [username, password, email, userid], (error, results) => {
        if (error) {
            throw error
        }
        console.log(results.rows)
        res.status(200).json(results.rows)

    })
}



async function email(req, res) {
    let userid = req.user
    let userResults

    await pool.query('SELECT * FROM users WHERE id = $1', [userid], (error, results) => {
        if (error) {
            throw error
        }
        userResults = results
    })
    await pool.query("SELECT to_char(clockin, 'DAY, DD MONTH YYYY HH:MM:SS') as clockin, to_char(clockout, 'DAY, DD MONTH YYYY HH:MM:SS') as clockout  FROM time WHERE userid = $1", [userid], (error, results) => {
        if (error) {
            throw error
        }
        console.log(results)

        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        let htmlForEmail = `<h1> ${userResults.rows[0].username} has submitted their timestamps! </h1>`

        results.rows.forEach((rows) => {
            htmlForEmail += `<p>${rows.clockin} ${rows.clockout}</p>`
        })

        const msg = {
            to: 'abrown312@humana.com',
            from: 'abrown.humana312@gmail.com',
            subject: 'Timestamps',
            text: `${userResults.rows[0].username} has submitted their timestamps`,
            html: htmlForEmail,
        };

        sgMail.send(msg);


        res.status(200).json(results.rows)
    })



}




module.exports = {

    registerUser,
    deleteUser,
    updateUser,
    login,
    getAllUsers,
    clockin,
    clockout,
    gettime,
    postPic,
    getPic,
    email


}