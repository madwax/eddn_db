const MongoClient = require('mongodb').MongoClient;
const config = require('./config');
function connectDB() {
	return new Promise((resolve, reject) => {
		MongoClient.connect(config.url, (err, db) => {
			if (err) {
				reject(err);
			} else {
				resolve(db);
			}
		});
	});
}
module.exports = {
	connectDB
};
