const express = require('express')
var bodyParser = require('body-parser')
const app = express()
const plaid = require('plaid')
const moment = require('moment')
const cors = require('cors')
const dotenv = require('dotenv')
dotenv.config();
const port = process.env.PORT;

const publicKey = process.env.PLAID_PUBLIC_KEY;
const clientId = process.env.PLAID_CLIENT_ID;
const clientSecret = process.env.PLAID_CLIENT_SECRET;
const plaidEnv = process.env.PLAID_ENVIRONMENT;
const client = new plaid.Client(
    clientId,
    clientSecret,
    publicKey,
    plaid.environments[plaidEnv],
)

app.use(bodyParser.json({
    strict: true
}))
app.use(express.static('public'))
app.use(cors());

app.post('/retrieve_transactions', function (req, res) {
    console.log(req);
    const publicToken = req.body.public_token;
    client.exchangePublicToken(publicToken, function(error, accessTokenResponse) {
        if (error) {
            console.log(error);
        }
        const accessToken = accessTokenResponse.access_token;
        const itemId = accessTokenResponse.item_id;
        const dayOffset = req.body.dayOffset || 10;
        client.getTransactions(
            accessToken,
            moment().subtract(dayOffset, 'days').format('YYYY-MM-DD'),
            moment().format('YYYY-MM-DD'),
            function(error, transactionResponse) {
                if (error) {
                    console.log(error);
                }

                res.json({
                    transactions: transactionResponse.transactions
                        .map((transaction) => {
                            return {
                                name: transaction.name,
                                amount: transaction.amount,
                                date: transaction.date,
                                pending: transaction.pending,
                                accountName: transactionResponse.accounts
                                    .find((account) => transaction.account_id === account.account_id).official_name,
                            }
                        })
                        .sort((a, b) => {
                            return Date.parse(a.date) - Date.parse(b.date);
                        })
                })
            }
        )
    });
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))