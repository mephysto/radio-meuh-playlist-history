// http://player.radiomeuh.com/rtdata/tracks10.xml

const express = require('express');
const cheerio = require('cheerio');
const request = require('request');
const app = express();
const port = process.env.PORT || 8080;
const router = express.Router();
const regex = new RegExp('^([0-1][0-9]|[2][0-3]):([0-5][0-9])', 'g'); // for time
const regexbreaks = /<[bB][rR]\s*\/?>/; // to catch <br>'s
const meuhRL = 'http://player.radiomeuh.com/rtdata/tracks10.xml';
let tracks = [];

const getTracks = cb => {
  request(
    {
      method: 'GET',
      url: meuhRL
    },
    function(err, response, body, callback) {
      // return error if error'ed
      if (err) return cb(err);
      // empty global tracks array
      tracks = [];
      // get playlist page content
      $ = cheerio.load(body);
      // scrape page of content
      $('table td').each(function(i, el) {
        const track = $(el).text();
        // filter out only valid content
        if (track.match(regex)) {
          // split out content of the data we need
          const trackInfo = $(el)
            .html() // get html content
            .split(regexbreaks); // split id in author-track by splitting from <br> and <br/>
          const theArtist = trackInfo[1];
          const title = trackInfo[2];
          const albumSplit = theArtist.split(' - '); // albums seem to exist with dashes
          const artist = albumSplit.length >= 2 ? albumSplit[0] : theArtist;
          const album = albumSplit.length >= 2 ? albumSplit[1] : '';

          // we use full element text as an ID (sans timestamp)
          let id = track.substr(8);
          // remove time remaining if it's there
          if (id.indexOf('temps restant: ') >= 0) {
            id = id.substring(0, id.indexOf('temps restant: '));
          }

          // process time from the string
          let time = track.substr(0, 8);
          const timeSplit = time.split(':');
          // convert to datetime (paris time)
          var parisTime = new Date().toLocaleString('en-GB', {
            timeZone: 'Europe/Paris'
          });
          parisTime = new Date(parisTime);
          parisTime.setHours(timeSplit[0]);
          parisTime.setMinutes(timeSplit[1]);
          parisTime.setSeconds(timeSplit[2]);
          time = parisTime.toLocaleString();

          // create a link to find this on spotify
          const searchSpotify = `https://www.google.com.au/search?q=${encodeURI(
            artist
          )}+${encodeURI(title)}+site%3Aspotify.com%2Ftrack`;

          // update the array with the content object
          tracks.push({ id, time, artist, title, album, searchSpotify });
        }
      });
      if (tracks.length <= 0) {
        cb('no tracks found');
      } else {
        // convert to json
        const tracksJSON = JSON.stringify(tracks, null, 4);
        cb(null, tracksJSON);
      }
    }
  );
};

router.get('/', function(req, res) {
  getTracks(function(err, tracks) {
    if (err) return console.error(err);
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    res.setHeader('Content-Type', 'application/json');
    res.send(tracks);
  });
});

app.listen(port, () => console.log(`Radio Meuh! Listening on port ${port}!`));
app.use('/', router);
