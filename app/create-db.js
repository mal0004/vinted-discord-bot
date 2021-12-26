const {createConnection} = require("typeorm");

createConnection({
    type: 'postgres',
    host: `${process.env.P_NAME}_postgres_1`,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
}).then(async connection => {
    connection.query('CREATE DATABASE IF NOT EXISTS "vinted_bot"');
});
