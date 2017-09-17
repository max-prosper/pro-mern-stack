import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import Issue from './issue.js';
import 'babel-polyfill';
import SourceMapSupport from 'source-map-support';

SourceMapSupport.install();

let db;
MongoClient.connect('mongodb://localhost/issuetracker')
.then(connection => {
	db = connection;
	app.listen(3000, () => {
		console.log('App started on port 3000');
	});
}).catch(error => {
	console.log('ERROR:', error);
});

const app = express();
app.use(express.static('static'));
app.use(bodyParser.json());


if (process.env.NODE_ENV !== 'production') {
  const webpack = require('webpack');
  const webpackDevMiddleware = require('webpack-dev-middleware');
  const webpackHotMiddleware = require('webpack-hot-middleware');
  const config = require('../webpack.config');
  config.entry.app.push('webpack-hot-middleware/client',
    'webpack/hot/only-dev-server');
  config.plugins.push(new webpack.HotModuleReplacementPlugin());
  const bundler = webpack(config);
  app.use(webpackDevMiddleware(bundler, { noInfo: true }));
  app.use(webpackHotMiddleware(bundler, { log: console.log }));
}


app.get('/api/issues', (req, res) => {
  db.collection('issues').find().toArray().then(issues => {
    const metadata = { total_count: issues.length };
    res.json({ _metadata: metadata, records: issues })
  }).catch(error => {
    console.log(error);
    res.status(500).json({ message: `Internal Server Error: ${error}` });
  });
});

app.post('/api/issues', (req, res) => {
	const newIssue = req.body;
	newIssue.created = new Date();

	if (!newIssue.status) {
		newIssue.status = 'New';
	}

	const err = Issue.validateIssue(newIssue);
  if (err) {
    res.status(422).json({ message: `Invalid request: ${err}` });
		return; }

db.collection('issues').insertOne(Issue.cleanupIssue(newIssue))
.then(result =>
    db.collection('issues').find({ _id: result.insertedId }).limit(1).next()
  ).then(newIssue => {
    res.json(newIssue);
  }).catch(error => {
    console.log(error);
    res.status(500).json({ message: `Internal Server Error: ${error}` });
	});
});


const validIssueStatus = {
  New: true,
  Open: true,
  Assigned: true,
  Fixed: true,
  Verified: true,
  Closed: true,
};

const issueFieldType = {
  status: 'required',
  owner: 'required',
  effort: 'optional',
  created: 'required',
  completionDate: 'optional',
  title: 'required',
};

function cleanupIssue(issue) {
	const cleanedUpIssue = {};
	Object.keys(issue).forEach(field => {
		if (issueFieldType[field]) cleanedUpIssue[field] = issue[field];
	});
	return cleanedUpIssue;
}

function validateIssue(issue) {
	const errors = [];
	Object.keys(issueFieldType).forEach(field => {
		if (issueFieldType[field] === 'required' && !issue[field]) {
			errors.push(`Missing mandatory field: ${field}`);
		}
	});
	if (!validIssueStatus[issue.status]) {
		errors.push(`${issue.status} is not a valid status.`);
	}
	return errors.length ? errors.join('; ') : null;
}

export default {
	validateIssue,
	cleanupIssue
};


app.post('/api/issues', (req, res) => {
  const newIssue = req.body;
  newIssue.id = issues.length + 1;
  newIssue.created = new Date();
  if (!newIssue.status)
    newIssue.status = 'New';

  const err = validateIssue(newIssue)
  if (err) {
    res.status(422).json({ message: `Invalid requrest: ${err}` });
    return;
    }

  issues.push(newIssue);
  res.json(newIssue);
});
