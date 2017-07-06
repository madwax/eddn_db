const zlib = require('zlib');
const {connectDB} = require('./utils');
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const Raven = require('raven');
const moment = require('moment');
const paginate = require('paginate-array');
const RateLimit = require('express-rate-limit');
const isDev = require('is-dev');

require('./eddn');
const app = express();

const apiLimiter = new RateLimit({
	windowMs: 15 * 60 * 1000,
	max: 75,
	delayMs: 0,
	headers: true
});
if (!isDev) {
	app.use('/api/', apiLimiter);
}
Raven.config('https://7c3174b16e384349bbf294978a65fb0c:c61b0700a2894a03a46343a02cf8b724@sentry.io/187248', {
	autoBreadcrumbs: true,
	captureUnhandledRejections: true
}).install();

app.get('/', (req, res) => {
	res.send('hello');
});

app.get('/api/cmdr/:cmdr', (req, res) => {
	const cmdr = req.params.cmdr.toLowerCase();
	const page = parseInt(req.query.page) || 1;
	if (!page) {
		console.log('No page query, sending first 25');
	}
	connectDB()
		.then(db => {
			const collection = db.collection('eddnHistory');
			collection.find({uploader: cmdr}).skip((page - 1) * 10).limit(25).sort({unixTimestamp: -1}).toArray((err, docs) => {
				if (err) {
					console.error(err);
					Raven.captureException(err);
				}
				let newdocs = {};
				newdocs.currentPage = page;
				newdocs.perPage = 25;
				newdocs.data = docs;
				docs = null;
				res.json(newdocs);
				newdocs = null;
				db.close();
			});
		}).catch(err => {
		Raven.captureException(err);
		console.error(err);
	});
});

app.get('/api/system/:system', (req, res) => {
	const system = req.params.system;
	const page = parseInt(req.query.page) || 1;
	if (!page) {
		console.log('No page query, sending first 25');
	}
	connectDB()
		.then(db => {
			const collection = db.collection('eddnHistory');
			collection.find({StarSystem: system}).skip((page - 1) * 10).limit(25).sort({unixTimestamp: -1}).toArray((err, docs) => {
				if (err) {
					console.error(err);
					Raven.captureException(err);
				}
				let newdocs = {};
				newdocs.currentPage = page;
				newdocs.perPage = 25;
				newdocs.data = docs;
				docs = null;
				res.json(newdocs);
				newdocs = null;
				db.close();
			});
		}).catch(err => {
		Raven.captureException(err);
		console.error(err);
	});
});

app.get('/api/station/:station', (req, res) => {
	const station = req.params.station;
	const page = parseInt(req.query.page) || 1;
	if (!page) {
		console.log('No page query, sending first 25');
	}
	connectDB()
		.then(db => {
			const collection = db.collection('eddnHistory');
			collection.find({StationName: station}).skip((page - 1) * 25).limit(25).sort({unixTimestamp: -1}).toArray((err, docs) => {
				if (err) {
					console.error(err);
					Raven.captureException(err);
				}
				let newdocs = {};
				newdocs.currentPage = page;
				newdocs.perPage = 25;
				newdocs.data = docs;
				docs = null;
				res.json(newdocs);
				newdocs = null;
				db.close();
			});
		}).catch(err => {
		Raven.captureException(err);
		console.error(err);
	});
});

app.get('/api/recent', (req, res) => {
	connectDB()
		.then(db => {
			const collection = db.collection('eddnHistory');
			collection.find().limit(25).sort({_id: -1}).toArray((err, docs) => {
				if (err) {
					console.error(err);
					Raven.captureException(err);
				}
				let newdocs = {};
				newdocs.currentPage = 1;
				newdocs.perPage = 25;
				newdocs.total = docs.length;
				newdocs.totaPages = 1;
				newdocs.data = docs;
				docs = null;
				res.json(newdocs);
				newdocs = null;
				db.close();
			});
		}).catch(err => {
		Raven.captureException(err);
		console.error(err);
	});
});

app.listen(3000, () => {
	console.log('Server listening on 5125');
});
