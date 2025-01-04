require('dotenv').config();

const express = require('express');
const app = express();
const cron = require('node-cron');
const { fork } = require('child_process');

const cors = require('cors');
const bodyParser = require('body-parser');
let Profiles;

const port = process.env.PORT || 3000;
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
const mongoUri = process.env.MONGODB_URI;

/*****************************************Socket.io***************************************************/

const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.SOCKET_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Store socket connections with user identifiers
const userSockets = new Map();

// Socket.IO connection handling
io.on('connection', socket => {
  console.log('User connected:', socket.id);

  // Handle user identification
  socket.on('identify', userId => {
    try {
      console.log('User identified:', userId);
      userSockets.set(userId, socket);

      // Acknowledge successful identification
      socket.emit('identified', { success: true });
    } catch (error) {
      console.error('Error during user identification:', error);
      socket.emit('error', { message: 'Failed to identify user' });
    }
  });

  socket.on('disconnect', () => {
    try {
      // Remove socket from map when user disconnects
      for (const [userId, userSocket] of userSockets.entries()) {
        if (userSocket === socket) {
          console.log('User disconnected:', userId);
          userSockets.delete(userId);
          break;
        }
      }
    } catch (error) {
      console.error('Error during disconnect:', error);
    }
  });

  // Handle errors
  socket.on('error', error => {
    console.error('Socket error:', error);
  });
});

/*****************************************MongoDB***************************************************/

const { MongoClient, ServerApiVersion } = require('mongodb');

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(mongoUri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!',
    );
  } finally {
    // // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

/*****************************************Main Page***************************************************/

app.use(express.static('public'));
app.use(express.json());
app.use(
  cors({
    origin: [allowedOrigins],
    credentials: true,
  }),
);

app.post('/initialBalance', async (req, res) => {
  const { parcel } = req.body;

  const profile = parcel;

  const memberName = profile.memberName;

  let checkingTransAmounts = [];
  let savingsTransAmounts = [];

  let checkingBalance;

  profile.checkingAccount.transactions.forEach(transaction => {
    checkingTransAmounts.push(transaction.amount);
  });

  profile.savingsAccount.transactions.forEach(transaction => {
    savingsTransAmounts.push(transaction.amount);
  });

  checkingBalance = checkingTransAmounts.reduce((acc, mov) => acc + mov, 0);
  savingsBalance = savingsTransAmounts.reduce((acc, mov) => acc + mov, 0);

  await client
    .db('TrinityCapital')
    .collection('User Profiles')
    .updateOne(
      { 'checkingAccount.accountHolder': memberName },
      {
        $set: { 'checkingAccount.balanceTotal': checkingBalance },
      },
    );

  await client
    .db('TrinityCapital')
    .collection('User Profiles')
    .updateOne(
      { 'savingsAccount.accountHolder': memberName },
      {
        $set: { 'savingsAccount.balanceTotal': savingsBalance },
      },
    );

  const updatedUserProfile = await client
    .db('TrinityCapital')
    .collection('User Profiles')
    .findOne({ 'checkingAccount.accountHolder': memberName });

  const updatedChecking = updatedUserProfile.checkingAccount;

  // Send update only to specific user
  const userSocket = userSockets.get(memberName);
  if (userSocket) {
    userSocket.emit('checkingAccountUpdate', updatedChecking);
  }
});

app.get('/profiles', async (req, res) => {
  try {
    const profiles = await client
      .db('TrinityCapital')
      .collection('User Profiles')
      .find()
      .toArray();

    // Send profiles only to the requesting user
    const userSocket = userSockets.get(req.query.userId);
    if (userSocket) {
      userSocket.emit('profiles', profiles);
    }

    res.status(200).send(profiles);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/loans', async (req, res) => {
  const { parcel } = req.body;
  const profile = parcel[0];
  const amount = parcel[1];
  let name = profile.checkingAccount.accountHolder;

  try {
    const UserProfile = await client
      .db('TrinityCapital')
      .collection('User Profiles')
      .findOne({ 'checkingAccount.accountHolder': name });

    // Update the transactions in the user profile
    const balance = UserProfile.checkingAccount.transactions.reduce(
      (acc, mov) => acc + mov,
      0,
    );
    await client
      .db('TrinityCapital')
      .collection('User Profiles')
      .updateOne(
        { 'checkingAccount.accountHolder': name },
        {
          $push: { 'checkingAccount.transactions': amount },
          $set: { 'checkingAccount.balanceTotal': balance },
        },
      );
    let newDate = new Date().toISOString();
    await client
      .db('TrinityCapital')
      .collection('User Profiles')
      .updateOne(
        { 'checkingAccount.accountHolder': name },
        { $push: { 'checkingAccount.movementsDates': newDate } },
      );
    const updatedUserProfile = await client
      .db('TrinityCapital')
      .collection('User Profiles')
      .findOne({ 'checkingAccount.accountHolder': name });

    const updatedChecking = updatedUserProfile.checkingAccount;

    // Send update only to specific user
    const userSocket = userSockets.get(name);
    if (userSocket) {
      userSocket.emit('checkingAccountUpdate', updatedChecking);
    }

    res.status(200).json({ message: 'Transaction successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

/*****************************************Transfers***************************************************/

app.post('/transfer', async (req, res) => {
  const { parcel } = req.body;

  const currentProfile = parcel[0];
  const accountFromPg = parcel[1];
  const accountToPg = parcel[2];
  const amount = parcel[3];
  const memberNamePg = parcel[4];

  let fromBalanceField = [];
  let toBalanceField = [];

  let newDate = new Date().toISOString();

  if (
    accountFromPg.accountType === 'Checking' &&
    accountToPg.accountType === 'Savings'
  ) {
    await client
      .db('TrinityCapital')
      .collection('User Profiles')
      .updateOne(
        { 'checkingAccount.accountHolder': memberNamePg },
        {
          $push: {
            'checkingAccount.transactions': {
              amount: -amount,
              interval: 'once',
              Name: ` ${accountFromPg.accountType} ---> ${accountToPg.accountType}`,
              Category: 'Transfer',
            },
          },
        },
      );

    let newDate = new Date().toISOString();
    await client
      .db('TrinityCapital')
      .collection('User Profiles')
      .updateOne(
        { 'checkingAccount.accountHolder': memberNamePg },
        { $push: { 'checkingAccount.movementsDates': newDate } },
      );

    await client
      .db('TrinityCapital')
      .collection('User Profiles')
      .updateOne(
        { 'savingsAccount.accountHolder': memberNamePg },
        {
          $push: {
            'savingsAccount.transactions': {
              amount: amount,
              interval: 'once',
              Name: ` ${accountFromPg.accountType} ---> ${accountToPg.accountType}`,
              Category: 'Transfer',
            },
          },
        },
      );

    await client
      .db('TrinityCapital')
      .collection('User Profiles')
      .updateOne(
        { 'savingsAccount.accountHolder': memberNamePg },
        { $push: { 'savingsAccount.movementsDates': newDate } },
      );

    const updatedUserProfile = await client
      .db('TrinityCapital')
      .collection('User Profiles')
      .findOne({ 'checkingAccount.accountHolder': memberNamePg });

    const upCheck = updatedUserProfile.checkingAccount;
    const upSav = updatedUserProfile.savingsAccount;

    balanceCalc(memberNamePg, upCheck, upCheck.accountType);
    balanceCalc(memberNamePg, upSav, upSav.accountType);
  }

  if (
    accountFromPg.accountType === 'Savings' &&
    accountToPg.accountType === 'Checking'
  ) {
    await client
      .db('TrinityCapital')
      .collection('User Profiles')
      .updateOne(
        { 'savingsAccount.accountHolder': memberNamePg },
        {
          $push: {
            'savingsAccount.transactions': {
              amount: -amount,
              interval: 'once',
              Name: ` ${accountFromPg.accountType} ---> ${accountToPg.accountType}`,
              Category: 'Transfer',
            },
          },
        },
      );

    let newDate = new Date().toISOString();
    await client
      .db('TrinityCapital')
      .collection('User Profiles')
      .updateOne(
        { 'savingsAccount.accountHolder': memberNamePg },
        { $push: { 'savingsAccount.movementsDates': newDate } },
      );

    await client
      .db('TrinityCapital')
      .collection('User Profiles')
      .updateOne(
        { 'checkingAccount.accountHolder': memberNamePg },
        {
          $push: {
            'checkingAccount.transactions': {
              amount: amount,
              interval: 'once',
              Name: ` ${accountFromPg.accountType} ---> ${accountToPg.accountType}`,
              Category: 'Transfer',
            },
          },
        },
      );

    await client
      .db('TrinityCapital')
      .collection('User Profiles')
      .updateOne(
        { 'checkingAccount.accountHolder': memberNamePg },
        { $push: { 'checkingAccount.movementsDates': newDate } },
      );

    const updatedUserProfile = await client
      .db('TrinityCapital')
      .collection('User Profiles')
      .findOne({ 'checkingAccount.accountHolder': memberNamePg });

    const upCheck = updatedUserProfile.checkingAccount;
    const upSav = updatedUserProfile.savingsAccount;

    balanceCalc(memberNamePg, upCheck, upCheck.accountType);
    balanceCalc(memberNamePg, upSav, upSav.accountType);
  }
});

const balanceCalc = async function (memberName, acc, type) {
  console.log(
    `Starting balanceCalc for member: ${memberName}, account type: ${type}`,
  );

  let amounts = [];
  let balance;

  // Collecting transaction amounts
  try {
    acc.transactions.forEach(transaction => {
      amounts.push(transaction.amount);
    });
    console.log(`Collected transaction amounts: ${amounts}`);
  } catch (error) {
    console.error(
      `Error collecting transaction amounts for ${memberName}:`,
      error,
    );
    return; // Exit early if there's an error
  }

  // Calculating balance
  try {
    balance = amounts.reduce((acc, mov) => acc + mov, 0);
    console.log(`Calculated balance for ${type} account: ${balance}`);
  } catch (error) {
    console.error(`Error calculating balance for ${memberName}:`, error);
    return;
  }

  // Updating database with new balance
  try {
    if (type === 'Checking') {
      console.log(`Updating Checking account balance for ${memberName}`);
      await client
        .db('TrinityCapital')
        .collection('User Profiles')
        .updateOne(
          { 'checkingAccount.accountHolder': memberName },
          { $set: { 'checkingAccount.balanceTotal': balance } },
        );
    } else if (type === 'Savings') {
      console.log(`Updating Savings account balance for ${memberName}`);
      await client
        .db('TrinityCapital')
        .collection('User Profiles')
        .updateOne(
          { 'savingsAccount.accountHolder': memberName },
          { $set: { 'savingsAccount.balanceTotal': balance } },
        );
    }
  } catch (error) {
    console.error(`Error updating database for ${memberName}:`, error);
    return;
  }

  // Fetching updated user profile
  let updatedUserProfile;
  try {
    updatedUserProfile = await client
      .db('TrinityCapital')
      .collection('User Profiles')
      .findOne({ 'checkingAccount.accountHolder': memberName });

    if (!updatedUserProfile) {
      console.error(`No user profile found for ${memberName}`);
      return;
    }

    console.log(
      `Fetched updated profile for ${memberName}:`,
      updatedUserProfile,
    );
  } catch (error) {
    console.error(`Error fetching updated profile for ${memberName}:`, error);
    return;
  }

  // Extracting updated checking account
  const updatedChecking = updatedUserProfile.checkingAccount;
  console.log(`Updated Checking account data:`, updatedChecking);

  // Emitting socket event
  try {
    const userSocket = userSockets.get(memberName);
    if (userSocket) {
      console.log(
        `Emitting 'checkingAccountUpdate' event to socket for ${memberName}`,
      );
      userSocket.emit('checkingAccountUpdate', updatedChecking);
    } else {
      console.warn(`No socket found for ${memberName}`);
    }
  } catch (error) {
    console.error(`Error emitting socket event for ${memberName}:`, error);
  }
};

app.post('/bills', async (req, res) => {
  const { parcel } = req.body;

  const profile = parcel[0];
  const type = parcel[1];
  const amount = parcel[2];
  const interval = parcel[3];
  const billName = parcel[4];
  const cat = parcel[5];
  const date = parcel[6];

  console.log(date, 387);
  const prfName = profile.memberName;

  const newTrans = {
    amount: amount,
    interval: interval,
    Name: billName,
    Category: cat,
    Date: date,
  };

  const billSetter = async function (type, name, newTrans) {
    if (type === 'bill') {
      await client
        .db('TrinityCapital')
        .collection('User Profiles')
        .updateOne(
          { 'checkingAccount.accountHolder': name },
          { $push: { 'checkingAccount.bills': newTrans } },
        );
    } else if (type === 'payment') {
      await client
        .db('TrinityCapital')
        .collection('User Profiles')
        .updateOne(
          { 'checkingAccount.accountHolder': name },
          { $push: { 'checkingAccount.payments': newTrans } },
        );
    }

    billManager(name);
    paymentManager(name);
  };

  billSetter(type, prfName, newTrans);

  const billManager = async function (name) {
    const newProfile = await client
      .db('TrinityCapital')
      .collection('User Profiles')
      .findOne({ 'checkingAccount.accountHolder': name });

    let bills = newProfile.checkingAccount.bills;

    for (let i = 0; i < bills.length; i++) {
      let time = bills[i].interval;

      const now = new Date();
      let delay;

      if (time === 'weekly') {
        // Map weekly schedules based on the current day of the week
        const weeklySchedules = {
          0: '0 0 * * 0', // Sunday
          1: '0 0 * * 1', // Monday
          2: '0 0 * * 2', // Tuesday
          3: '0 0 * * 3', // Wednesday
          4: '0 0 * * 4', // Thursday
          5: '0 0 * * 5', // Friday
          6: '0 0 * * 6', // Saturday
        };

        delay = weeklySchedules[now.getDay()];
        console.log(delay, 472);
      } else if (time === 'bi-weekly') {
        // Run on the 1st and 15th of each month at midnight
        delay = `0 0 1,15 * *`;
      } else if (time === 'monthly') {
        // Map monthly schedules based on the current month
        const monthlySchedules = {
          0: '0 0 1 1 *', // January
          1: '0 0 1 2 *', // February
          2: '0 0 1 3 *', // March
          3: '0 0 1 4 *', // April
          4: '0 0 1 5 *', // May
          5: '0 0 1 6 *', // June
          6: '0 0 1 7 *', // July
          7: '0 0 1 8 *', // August
          8: '0 0 1 9 *', // September
          9: '0 0 1 10 *', // October
          10: '0 0 1 11 *', // November
          11: '0 0 1 12 *', // December
        };
        delay = monthlySchedules[now.getMonth()];
      } else if (time === 'yearly') {
        // Run yearly on January 1st at midnight
        delay = `0 0 1 1 *`;
      }

      const billSet = async () => {
        console.log(`Executing bill for ${name} with interval: ${time}`);
        let newDate = new Date().toISOString();
        await client
          .db('TrinityCapital')
          .collection('User Profiles')
          .updateOne(
            { 'checkingAccount.accountHolder': name },
            {
              $push: { 'checkingAccount.transactions': bills[i] },
            },
          );

        await client
          .db('TrinityCapital')
          .collection('User Profiles')
          .updateOne(
            { 'checkingAccount.accountHolder': name },
            {
              $push: { 'checkingAccount.movementsDates': newDate },
            },
          );

        balanceCalc(name);
        const updatedProfile = await client
          .db('TrinityCapital')
          .collection('User Profiles')
          .findOne({ 'checkingAccount.accountHolder': name });

        const updatedChecking = updatedProfile.checkingAccount;

        // Send update only to specific user
        const userSocket = userSockets.get(name);
        if (userSocket) {
          userSocket.emit('checkingAccountUpdate', updatedChecking);
        }
      };

      console.log(`Scheduling bill for ${name} with delay: ${delay}`);
      cron.schedule(delay, billSet);
    }
  };

  const paymentManager = async function (name) {
    let interval;
    const newProfile = await client
      .db('TrinityCapital')
      .collection('User Profiles')
      .findOne({ 'checkingAccount.accountHolder': name });

    let payments = newProfile.checkingAccount.payments;

    for (let i = 0; i < payments.length; i++) {
      let time = payments[i].interval;

      const now = new Date();
      const currentDay = now.getDate();
      let delay;

      if (time === 'weekly') {
        // Map weekly schedules based on the current day of the week
        const weeklySchedules = {
          0: '0 0 * * 0', // Sunday
          1: '0 0 * * 1', // Monday
          2: '0 0 * * 2', // Tuesday
          3: '0 0 * * 3', // Wednesday
          4: '0 0 * * 4', // Thursday
          5: '0 0 * * 5', // Friday
          6: '0 0 * * 6', // Saturday
        };

        delay = weeklySchedules[now.getDay()];
        console.log(delay, 558);
      } else if (time === 'bi-weekly') {
        delay = `0 0 1,15 * *`;
      } else if (time === 'monthly') {
        // Map monthly schedules based on the current month
        const monthlySchedules = {
          0: '0 0 1 1 *', // January
          1: '0 0 1 2 *', // February
          2: '0 0 1 3 *', // March
          3: '0 0 1 4 *', // April
          4: '0 0 1 5 *', // May
          5: '0 0 1 6 *', // June
          6: '0 0 1 7 *', // July
          7: '0 0 1 8 *', // August
          8: '0 0 1 9 *', // September
          9: '0 0 1 10 *', // October
          10: '0 0 1 11 *', // November
          11: '0 0 1 12 *', // December
        };
        delay = monthlySchedules[now.getMonth()];
      } else if (time === 'yearly') {
        delay = `0 0 1 1 *`;
      }

      const paymentSet = async () => {
        let newDate = new Date().toISOString();
        await client
          .db('TrinityCapital')
          .collection('User Profiles')
          .updateOne(
            { 'checkingAccount.accountHolder': name },
            {
              $push: { 'checkingAccount.transactions': payments[i] },
            },
          );

        await client
          .db('TrinityCapital')
          .collection('User Profiles')
          .updateOne(
            { 'checkingAccount.accountHolder': name },
            {
              $push: { 'checkingAccount.movementsDates': newDate },
            },
          );

        balanceCalc(name);

        const updatedProfile = await client
          .db('TrinityCapital')
          .collection('User Profiles')
          .findOne({ 'checkingAccount.accountHolder': name });

        const updatedChecking = updatedProfile.checkingAccount;

        // Send update only to specific user
        const userSocket = userSockets.get(name);
        if (userSocket) {
          userSocket.emit('checkingAccountUpdate', updatedChecking);
        }
      };
      cron.schedule(delay, paymentSet);
      console.log(delay, 339);
    }
  };

  const balanceCalc = async function (name) {
    let balanceArray = [];
    let balance;
    let profile = await client
      .db('TrinityCapital')
      .collection('User Profiles')
      .findOne({ 'checkingAccount.accountHolder': name });

    if (profile.checkingAccount.transactions.length <= 0) {
      balance = 0;
    } else if (profile.checkingAccount.transactions.length > 0) {
      for (let i = 0; i < profile.checkingAccount.transactions.length; i++) {
        let transAmounts = profile.checkingAccount.transactions[i].amount;

        balanceArray.push(transAmounts);
        balance = balanceArray.reduce((acc, mov) => acc + mov, 0);
      }
    }
    await client
      .db('TrinityCapital')
      .collection('User Profiles')
      .updateOne(
        { 'checkingAccount.accountHolder': name },
        {
          $set: { 'checkingAccount.balanceTotal': balance },
        },
      );
  };
  const updatedUserProfile = await client
    .db('TrinityCapital')
    .collection('User Profiles')
    .findOne({ 'checkingAccount.accountHolder': prfName });

  const updatedChecking = updatedUserProfile.checkingAccount;

  console.log(process.pid, 265);

  // Send update only to specific user
  const userSocket = userSockets.get(prfName);
  if (userSocket) {
    userSocket.emit('checkingAccountUpdate', updatedChecking);
  }
});

/********************************************************DEPOSITS***********************************************/

app.post('/deposits', async (req, res) => {
  let newDate = new Date().toISOString();
  const { parcel } = req.body;

  const amount = parcel[0];
  const destination = parcel[1];
  const memberName = parcel[2];

  await client
    .db('TrinityCapital')
    .collection('User Profiles')
    .updateOne(
      { 'checkingAccount.accountHolder': memberName },
      {
        $push: {
          'checkingAccount.transactions': {
            amount: -amount,
            interval: 'once',
            Name: `${destination}`,
            Category: 'Check Deposit',
          },
        },
      },
    );

  await client
    .db('TrinityCapital')
    .collection('User Profiles')
    .updateOne(
      { 'checkingAccount.accountHolder': memberName },
      { $push: { 'checkingAccount.movementsDates': newDate } },
    );

  const updatedUserProfile = await client
    .db('TrinityCapital')
    .collection('User Profiles')
    .findOne({ 'checkingAccount.accountHolder': memberName });

  const updatedChecking = updatedUserProfile.checkingAccount;

  console.log(process.pid, 265);
  balanceCalc(memberName, updatedChecking, updatedChecking.accountType);

  // Send update only to specific user
  const userSocket = userSockets.get(memberName);
  if (userSocket) {
    userSocket.emit('checkingAccountUpdate', updatedChecking);
  }
});

app.post('/sendFunds', async (req, res) => {
  const { parcel } = req.body;

  const destinationProfile = parcel[0];
  const sender = parcel[1];
  const destinationAmount = parcel[2];

  console.log(destinationProfile, 470);

  let destinationDate = new Date();

  await client
    .db('TrinityCapital')
    .collection('User Profiles')
    .updateOne(
      { 'checkingAccount.accountHolder': destinationProfile },
      {
        $push: {
          'checkingAccount.transactions': {
            amount: destinationAmount,
            interval: 'once',
            Name: `Deposit from ${sender}`,
            Category: 'Money Deposit',
          },
        },
      },
    );

  await client
    .db('TrinityCapital')
    .collection('User Profiles')
    .updateOne(
      { 'checkingAccount.accountHolder': destinationProfile },
      { $push: { 'checkingAccount.movementsDates': destinationDate } },
    );

  //FOR SENDER
  await client
    .db('TrinityCapital')
    .collection('User Profiles')
    .updateOne(
      { 'checkingAccount.accountHolder': sender },
      {
        $push: {
          'checkingAccount.transactions': {
            amount: -destinationAmount,
            interval: 'once',
            Name: `Deposit to ${destinationProfile}`,
            Category: 'Money Deposit',
          },
        },
      },
    );

  await client
    .db('TrinityCapital')
    .collection('User Profiles')
    .updateOne(
      { 'checkingAccount.accountHolder': sender },
      { $push: { 'checkingAccount.movementsDates': destinationDate } },
    );

  const updatedUserProfile = await client
    .db('TrinityCapital')
    .collection('User Profiles')
    .findOne({ 'checkingAccount.accountHolder': sender });

  const updatedChecking = updatedUserProfile.checkingAccount;

  balanceCalc(sender, updatedChecking, updatedChecking.accountType);

  // Send update only to specific user
  const userSocket = userSockets.get(sender);
  if (userSocket) {
    userSocket.emit('checkingAccountUpdate', updatedChecking);
  }
});

app.post('/createAccount', async (req, res) => {
  const db = client.db('TrinityCapital');
  const prfs = db.collection('User Profiles');
  const { parcel } = req.body;

  const firstName = parcel[0];
  const lastName = parcel[1];
  const schoolCode = parcel[2];
  const date = parcel[3];
  const userName = parcel[4];
  const PIN = parseInt(parcel[5]);

  let numMin = 1000000000000000;
  let numMax = 9999999999999999;

  let accountNumCheck =
    Math.floor(Math.random() * (numMax - numMin + 1)) + numMin;
  let accountNumSav =
    Math.floor(Math.random() * (numMax - numMin + 1)) + numMin;

  const memberName = `${firstName} ${lastName}`;

  let newAccount = {
    memberName: memberName,
    pin: PIN,
    numberOfAccounts: 2,
    checkingAccount: {
      routingNumber: 141257185,
      currency: 'USD',
      locale: 'en-US',
      created: `${date}`,
      accountHolder: memberName,

      balanceTotal: 0,
      bills: [],
      payments: [],
      accountType: 'Checking',
      accountNumber: accountNumCheck.toString(),
      movementsDates: [],
      transactions: [],
    },
    savingsAccount: {
      routingNumber: 141257185,
      currency: 'USD',
      locale: 'en-US',
      created: `${date}`,
      accountHolder: memberName,
      username: userName,
      balanceTotal: 0,
      bills: [],
      payments: [],
      accountType: 'Savings',
      accountNumber: accountNumSav.toString(),
      movementsDates: [],
      transactions: [],
    },
    userName: userName,
  };

  const pushAcc = await prfs.insertOne(newAccount);

  console.log(newAccount, 721);

  const modal = ` <dialog open class="baseModal">
<h1>No School Code Found</h1>
<h1>Please Try Again</h1>

<button><a href="#" class="buttonClass">Try Again</a></button>
</dialog>`;

  const userCode = parcel[2];
  console.log(userCode, 713);

  let codes = await client
    .db('TrinityCapital')
    .collection('School Codes')
    .findOne({ code: userCode });

  console.log(codes);

  if (codes === null) {
    // Send modal only to specific user
    const userSocket = userSockets.get(memberName);
    if (userSocket) {
      userSocket.emit('noSchoolCodeFound', modal);
    }
  } else {
    console.log('Operation complete');
  }
});

/**************************************************LESSON SERVER FUNCTIONS*********************************************/

app.post('/lessonArrays', async (req, res) => {
  const { parcel } = req.body;

  const lessonNum = parcel[0];

  let lessonArray = await client
    .db('TrinityCapital')
    .collection('Lesson Arrays')
    .findOne({ lessonNumber: lessonNum });

  io.emit('lessonHtml', lessonArray.htmlCode);
});

app.post('/lessonModals', async (req, res) => {
  const { parcel } = req.body;

  const lessonName = parcel[0];

  let lessonModal = await client
    .db('TrinityCapital')
    .collection('LessonCarousels')
    .findOne({ LessonName: lessonName });

  console.log(lessonModal);

  io.emit('lessonModalHtml', [lessonModal.htmlCode, lessonName]);
});

app.post('/activityModals', async (req, res) => {
  const { parcel } = req.body;

  const activityName = parcel[0];

  console.log(activityName);

  let activityModal = await client
    .db('TrinityCapital')
    .collection('Activites')
    .findOne({ activity: activityName });

  let Q1 = await client
    .db('TrinityCapital')
    .collection('questionAnswerSets')
    .findOne({ setNum: 1 });

  console.log(Q1);

  io.emit('activityModalhtml', [activityModal.carouselHtml, Q1.htmlCode]);
});
// server.js (continued)

/****************************************TEACHER DASHBOARD********************************************/

app.post('/findTeacher', async (req, res) => {
  const { parcel } = req.body;

  const teachUser = parcel[0];
  const teachPin = parcel[1];

  let teacher = await client
    .db('TrinityCapital')
    .collection('Teachers')
    .findOne(({ Username: teachUser }, { PIN: teachPin }));

  if (teacher !== null) {
    io.emit('signOn', [true, teacher.TeacherName]);
  } else if (teacher === null) {
    io.emit('signOn', false);
  }
});

app.post('/retrieveStudents', async (req, res) => {
  const { parcel } = req.body;

  const periodNum = parcel[0];
  const teacherName = parcel[1];

  let students = await client
    .db('TrinityCapital')
    .collection('User Profiles')
    .find(({ Period: periodNum }, { Teacher: teacherName }))
    .toArray();

  io.emit('students', students);
});

app.post('/studentInfo', async (req, res) => {
  const { parcel } = req.body;
  const studentName = parcel[0];
  const teacherName = parcel[1];

  console.log(studentName, teacherName);

  try {
    let student = await client
      .db('TrinityCapital')
      .collection('User Profiles')
      .findOne({ memberName: studentName, Teacher: teacherName });

    if (student) {
      res.json(student);
    } else {
      res.status(404).send('Student not found');
    }

    console.log(student);
  } catch (error) {
    console.error('Error fetching student info:', error);
    res.status(500).send('Internal Server Error');
  }
});
