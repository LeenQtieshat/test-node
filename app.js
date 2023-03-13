const express = require('express');
const app = express();
const request = require('request');

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Define a middleware function that checks the incoming request's URL
const allowListMiddleware = (req, res, next) => {
  const allowedUrls = ['https://payment-testing-v2.vercel.app', 'http://localhost:8081'];

  if (allowedUrls.includes(req.headers.origin)) {
    // Allow the request to proceed if the URL is on the allow list
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  } else {
    // Deny the request if the URL is not on the allow list
    res.status(403).send('Forbidden');
  }
};

// Use the middleware function for all routes
app.use(allowListMiddleware);
app.get('/', async (req, res) => {
  res.send('welcome');
});
app.post('/payfort/one-time-payment', async (req, res) => {
  console.log(req.body);
  const options = {
    method: 'POST',
    url: 'https://sbpaymentservices.payfort.com/FortAPI/paymentApi',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(req.body)
  };

  const purchaseResponse = await new Promise((resolve, reject) => {
    // eslint-disable-next-line consistent-return
    request(options, (error, res, body) => {
      if (error) {
        reject(new Error('Error processing payment'));
      } else {
        // Check Payfort API response for successful payment status
        const payfortResponse = JSON.parse(body);
        // eslint-disable-next-line default-case
        switch (payfortResponse.status) {
          case '00':
            resolve({ msg: payfortResponse.response_message, status: payfortResponse.status });
            break;
          case '14':
            resolve({ msg: payfortResponse.response_message, status: payfortResponse.status });
            break;
          case '20':
            resolve({
              msg: payfortResponse.response_message,
              status: payfortResponse.status,
              secureUrl: payfortResponse['3ds_url']
            });
            break;
          case '13':
            resolve({ msg: payfortResponse.response_message, status: payfortResponse.status });
            break;
          default:
            resolve('test endpoint');
        }
      }
    });
  });
  res.send(purchaseResponse);
});

app.listen(3001, () => {
  console.log('Server listening on port 3001');
});
