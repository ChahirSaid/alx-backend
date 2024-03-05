import { createQueue } from 'kue';
import { createClient } from 'redis';
import { promisify } from 'util';
import express from 'express';

const app = express();
const rdClient = createClient();
const queue = createQueue();

rdClient.on('connect', function() {
  console.log('Redis client connected to the server');
});

rdClient.on('error', function (error) {
  console.log(`Redis client not connected to the server: ${error}`);
});

const get = promisify(rdClient.get).bind(rdClient);

function reserveSeat(number) {
  rdClient.set('available_seats', number);
}

async function getCurrentAvailableSeats() {
  const seats = await get('available_seats');
  return seats;
}

let reservationEnabled = true;

app.get('/available_seats', async function (req, res) {
  const availableSeats = await getCurrentAvailableSeats();
  res.json({"numberOfAvailableSeats": availableSeats});
});

app.get('/reserve_seat', function (req, res) {
  if (!reservationEnabled) {
    res.json({"status": "Reservation are blocked"});
    return;
  }
  const job = queue.create('reserve_seat', {'seat': 1}).save((error) => {
    if (error) {
      res.json({"status": "Reservation failed"});
      return;
    } else {
      res.json({"status": "Reservation in process"});
      job.on('complete', function () {
        console.log(`Seat reservation job ${job.id} completed`);
      });
      job.on('failed', function(error) {
        console.log(`Seat reservation job ${job.id} failed: ${error}`);
      });
    }
  });
});

app.get('/process', function (req, res) {
  res.json({"status": "Queue processing"});
  queue.process('reserve_seat', async function(job, done) {
    const seat = Number(await getCurrentAvailableSeats());
    if (seat === 0) {
      reservationEnabled = false;
      done(Error('Not enough seats available'));
    } else {
      reserveSeat(seat - 1);
      done();
    }
  });
});

const port = 1245;
app.listen(port, () => {
  console.log(`app is listening http://localhost:${port}`);
});

reserveSeat(50);
