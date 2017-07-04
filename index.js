const zlib = require('zlib');
const zmq = require('zeromq');
const sock = zmq.socket('sub');
const MongoClient = require('mongodb').MongoClient
const Raven = require('raven');
Raven.config('https://7c3174b16e384349bbf294978a65fb0c:c61b0700a2894a03a46343a02cf8b724@sentry.io/187248').install();

const url = 'mongodb://localhost:54373/eddn';
sock.connect('tcp://eddn.edcd.io:9500');
console.log('Worker connected to port 9500');

sock.subscribe('');

sock.on('message', topic => {
	zlib.inflate(topic, (err, res) => {
		if (err) {
			console.error(err);
			Raven.captureException(err);
		}
		const message = JSON.parse(res);
		if (message.message.event) {
			connectDB()
				.then(db => {
					message.message.uploader = message.header.uploaderID.toString();
					const collection = db.collection('eddnHistory');
					collection.insertOne(message.message).then(result => {
						console.log('inserted ' + message.message.event + ' from: ' + message.message.uploader);
						db.close();
					}).catch(err => {
						console.error(err);
						Raven.captureException(err);
						db.close();
					})
				}).catch(err => {
					Raven.captureException(err);
					console.error(err);
				});
		}
	})
});

function connectDB() {
	return new Promise((resolve, reject) => {
		MongoClient.connect(url, (err, db) => {
			if (err) {
				reject(err);
			} else {
				resolve(db);
			}
		});
	});
}
