const {createConnection} = require("typeorm");

createConnection({
    type: 'postgres',
    host: 'postgres',
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
}).then(async connection => {
    connection.query('CREATE DATABASE IF NOT EXISTS "vinted_bot"');
});
