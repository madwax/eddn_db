const zlib = require('zlib');
const zmq = require('zeromq');
const MongoClient = require('mongodb').MongoClient;
const Raven = require('raven');
const moment = require('moment');
const {connectDB} = require('./utils');
const sock = zmq.socket('sub');
const config = require('./config');
Raven.config('https://7c3174b16e384349bbf294978a65fb0c:c61b0700a2894a03a46343a02cf8b724@sentry.io/187248', {
	autoBreadcrumbs: true,
	captureUnhandledRejections: true
}).install();

sock.connect('tcp://eddn.edcd.io:9500');
console.log('Worker connected to port 9500');

sock.subscribe('');

sock.on('message', topic => {
	zlib.inflate(topic, (err, res) => {
		if (err) {
			Raven.context(() => {
				Raven.captureBreadcrumb({
					message: 'zlib insertion failed',
					file: 'eddn.js'
				});
				Raven.captureException(err);
				console.error(err);
			})
		}
		let message = JSON.parse(res);
		if (message.message.event) {
			connectDB()
				.then(db => {
					message.message.uploader = message.header.uploaderID.toString().toLowerCase();
					message.message.unixTimestamp = moment(message.message.timestamp).valueOf();
					message.message.software = `${message.header.softwareName}@${message.header.softwareVersion}`;
					const collection = db.collection('eddnHistory');
					collection.insertOne(message.message).then(() => {
						console.log('inserted ' + message.message.event + ' from: ' + message.message.uploader);
						message = null;
						db.close();
					}).catch(err => {
						Raven.context(() => {
							Raven.captureBreadcrumb({
								message: "Insert failed",
								file: "eddn.js",
								data: message
							});
							Raven.captureException(err);
							console.error(err);
							message = null;
							db.close();
						});
					});
				}).catch(err => {
				Raven.captureException(err);
				message = null;
				console.error(err);
			});
		}
	});
});
