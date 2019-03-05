// http://player.radiomeuh.com/rtdata/tracks10.xml

const express = require('express');
const serverless = require('serverless-http')
var cheerio = require('cheerio');
var request = require('request');
const app = express();
const port = 3000;
var tracks = [];
const regex = new RegExp('^([0-1][0-9]|[2][0-3]):([0-5][0-9])', 'g');
const meuhRL = 'http://player.radiomeuh.com/rtdata/tracks10.xml';

const router = express.Router();

const getTracks = (cb) => {
  request(
    {
      method: 'GET',
      url: meuhRL
    },
    function(err, response, body, callback) {
      if (err) return cb(err);
      
      $ = cheerio.load(body);

      $('table td').each(function(i, el) {
        const track = $(el).text();
        console.log($(el).html())
        if (track.match(regex)){
          let title = track.substr(8)
          if (title.indexOf('temps restant: ') >= 0){
            title = title.substring(0,title.indexOf('temps restant: '))
          }

          const time = track.substr(0,8)
          console.log({title,time});
          tracks.push({title,time});
        }
      });
      if (tracks.length <= 0){
        cb('no tracks found')
      } else{
        const tracksJSON = JSON.stringify(tracks, null, 4)
        cb(null, tracksJSON);
      }
    }
  );
}

router.get('/', function(req, res) {
  getTracks(function(err,tracks){
    if (err) return console.error(err);
    console.log('tracks:', tracks);
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    res.send(tracks);
  })
});

// router.get('/checkfile/:fileName', function(req, res) {
//   checkFile(req.params.fileName)
//     .then(data => {
//       const url = data;
//       // const html = `<!DOCTYPE html><html lang="en"><head> <meta charset="utf-8"> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <title>Upload to S3 test</title></head><body> <h1>video exists! :)</h1> <video src="${url}" controls autoplay="true"></video> <a href="/">go again</a></body></html>`;
//       // res.send(html);
//       // res.end();
//       res.setHeader('Content-Type', 'application/json');
//       res.end(JSON.stringify({
//         "success": true,
//         "data": {
//           "url": data
//         }
//       }, null, 3));
//     })
//     .catch(() => {
//       // console.log('failed');
//       // res.sendFile(__dirname + '/error.html');
//       res.setHeader('Content-Type', 'application/json');
//       res.end(JSON.stringify({
//         "success": false,
//         "error": {
//           "code": 404,
//           "message": "File not found"
//         }
//       }, null, 3));
//     });
// });

// router.post('/upload', fetcher);

// router.get('/error', function(req, res) {
//   res.sendFile(__dirname + '/error.html');
// });

// router.get('/success', function(req, res) {
  //   res.sendFile(__dirname + '/success.html');
  // });
  
  app.listen(port, () => console.log(`Example app listening on port ${port}!`));
  app.use('/', router);

  module.exports = app
  module.exports.handler = serverless(app)