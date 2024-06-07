const express = require('express');
const app = express();
const cron = require('node-cron');
const { fork } = require('child_process');

const cors = require('cors');
const bodyParser = require('body-parser');
let Profiles;

const port = process.env.PORT || 3000;

/*****************************************Socket.io***************************************************/

const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: 'http://127.0.0.1:8080',
  },
});

io.on('connection', socket => {
  console.log('User connected:' + socket.id);
});

/*****************************************MongoDB***************************************************/
const { MongoClient, ObjectId } = require('mongodb');

const uri =
  'mongodb+srv://JakobFerguson:XbdHM2FJsjg4ajiO@trinitycapitaltesting.1yr5eaa.mongodb.net/?retryWrites=true&w=majority';

const client = new MongoClient(uri);

async function main(client) {
  try {
    await client.connect();
    console.log('Connected, 20');
  } catch (e) {
    console.error(e);
  }
}

main(client).catch(console.error);

/*****************************************Main Page***************************************************/

app.use(express.static('public'));
app.use(express.json());
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:8080'],
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

  io.emit('checkingAccountUpdate', updatedChecking);
});

app.get('/profiles', async (req, res) => {
  try {
    const profiles = await client
      .db('TrinityCapital')
      .collection('User Profiles')
      .find()
      .toArray();

    // Emit the profiles data to all connected clients

    const Profiles = await client
      .db('TrinityCapital')
      .collection('User Profiles')
      .find()
      .toArray();

    io.emit('profiles', Profiles);

    res.status(200).send(Profiles);
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

    io.emit('checkingAccountUpdate', updatedChecking);

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
  let amounts = [];
  let balance;

  acc.transactions.forEach(transaction => {
    amounts.push(transaction.amount);
  });

  balance = amounts.reduce((acc, mov) => acc + mov, 0);

  if (type === 'Checking') {
    await client
      .db('TrinityCapital')
      .collection('User Profiles')
      .updateOne(
        { 'checkingAccount.accountHolder': memberName },
        { $set: { 'checkingAccount.balanceTotal': balance } },
      );
  } else if (type === 'Savings') {
    await client
      .db('TrinityCapital')
      .collection('User Profiles')
      .updateOne(
        { 'savingsAccount.accountHolder': memberName },
        { $set: { 'savingsAccount.balanceTotal': balance } },
      );
  }

  const updatedUserProfile = await client
    .db('TrinityCapital')
    .collection('User Profiles')
    .findOne({ 'checkingAccount.accountHolder': memberName });

  const updatedChecking = updatedUserProfile.checkingAccount;

  io.emit('checkingAccountUpdate', updatedChecking);
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
    let interval;
    const newProfile = await client
      .db('TrinityCapital')
      .collection('User Profiles')
      .findOne({ 'checkingAccount.accountHolder': name });

    let bills = newProfile.checkingAccount.bills;

    for (let i = 0; i < bills.length; i++) {
      let time = bills[i].interval;

      const now = new Date();
      const currentDay = now.getDate();
      let delay;

      if (time === 'weekly') {
        // Calculate the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
        const dayOfWeek = now.getDay();
        // delay = `0 0 * * ${dayOfWeek}`;
        delay = `* * * * *`;
      } else if (time === 'bi-weekly') {
        delay = `0 0 1,15 * *`;
      } else if (time === 'monthly') {
        delay = `0 0 ${currentDay} * *`;
      } else if (time === 'yearly') {
        delay = `0 0 1 1 *`;
      }

      //Displays the bills using the amount, every interval set above

      const billSet = async () => {
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

        io.emit('checkingAccountUpdate', updatedChecking);
      };
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
        // Calculate the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
        const dayOfWeek = now.getDay();
        console.log(dayOfWeek, 509);
        delay = `0 0 * * ${dayOfWeek}`;
        // delay = `* * * * *`;
      } else if (time === 'bi-weekly') {
        delay = `0 0 1,15 * *`;
      } else if (time === 'monthly') {
        delay = `0 0 ${currentDay} * *`;
      } else if (time === 'yearly') {
        delay = `0 0 1 1 *`;
      }

      //Displays the bills using the amount, every interval set above

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

        io.emit('checkingAccountUpdate', updatedChecking);
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

  io.emit('checkingAccountUpdate', updatedChecking);
});

/********************************************************DEPOSISTS***********************************************/

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
  io.emit('checkingAccountUpdate', updatedChecking);
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
  io.emit('checkingAccountUpdate', updatedChecking);
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
    io.emit('noSchoolCodeFound', modal);
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
