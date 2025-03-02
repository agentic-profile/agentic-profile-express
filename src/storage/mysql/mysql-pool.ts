import mysql from 'mysql2/promise'

const {
	MYSQL_HOSTNAME: host,
	MYSQL_PASSWORD: password,
	MYSQL_USER: user
} = process.env;
if( !host )
    console.error( "ERROR: process.env missing MYSQL_HOSTNAME" );
if( !password )
    console.error( "ERROR: process.env missing MYSQL_PASSWORD" );
if( !user )
    console.error( "ERROR: process.env missing MYSQL_USER" );

var options = {
    connectionLimit : 10,   // TODO is there a better number?
    host,
    user,
    database : 'agentic', 
    port     : resolvePort(),
    timezone : '+00:00',
    charset  : 'utf8mb4',
    password : ''
};

console.log( new Date(), 'Creating MySQL2 pool with', JSON.stringify(options,null,4));
options.password = password!;

const pool = mysql.createPool(options);
export default pool;

function resolvePort() {
    return parseInt(process.env.MYSQL_PORT || '3306');
}