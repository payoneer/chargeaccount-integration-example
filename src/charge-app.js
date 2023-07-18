import { createDebit, getAccessTokenByCode, getAccessTokenByRefreshToken, getBalances, getChargeDisclosure, commitCharge, commitAfterChallenge, getChargeStatus } from './payoneer-service.js';
import jwt_decode from "jwt-decode";
import express from "express";
import crypto from "crypto";
import config from './config.js';

/* Setup an endpoint to listen for the callback from the user consent. 
 * Then use the auth token to perform a few actions: 
    decode the bearer token
    get the account balance
    create a debit request
    commit the debit
    check the charge status
    process Multi-Factor Authentication (MFA) challenge response
*/

// TODO : 
    // + Page with disclosure & commit button for user to press
    // + create a sample UI that shows the charge disclosure
    // + IPCNs : way to receive failed / success charge webhooks example

const app = express();

// using on this scope for re-use on MFA confirm. Store this in a more appropriate place when you implement
let bearerToken; 
let accountId;
let clientReferenceId;

app.get('/oauth/authorize', async (request, response) => {
    console.log("Received consent callback");

    if(request.query.error) {
        console.log("Error in callback : " + 
            `${request.query.error} State : ${request.query.state}`);
        return;
    }

    // we're receving the callback from the charge MFA challenge
    // send the challenge back to Payoneer to process the commit
    // assumes you still have access to the user's access_token
    if(request.query.type === "response") {
        console.log("Received challenge response callback");

        await commitAfterChallenge(request.query.response_path, bearerToken.access_token);

        // get the status of the charge after MFA complete
        let chargeStatus = await getChargeStatus(
            accountId, clientReferenceId,
            bearerToken.access_token);

        console.log(`Charge status : ${chargeStatus}`);
        return;
    }

    // we're receiving the callback from the consent flow with a one-time code
    // extract the code and exchange it for a token
    bearerToken = await getAccessTokenByCode(
        config.clientId, 
        config.clientSecret, 
        request.query.code, //one-time code
        config.redirectUrl);

    // decode the bearerToken.id_token.account_id (a jwt) to get AccountHolderId
    let accountHolderDetails = jwt_decode(bearerToken.id_token);
    accountId = accountHolderDetails.account_id; //storing for MFA confirm later
    console.log(`accountHolder details: ${JSON.stringify(accountHolderDetails, null, 2)}`);
    
    // if you want to see how a token refresh works
    // take the bearerToken.refresh_token and plug it back into the token request
    // you might store the refreshToken for later so the account holder doesn't have to re-authenticate
    let refreshToken = bearerToken.refresh_token;

    bearerToken = await getAccessTokenByRefreshToken(
        config.clientId, 
        config.clientSecret,
        refreshToken);

    // use the AccountHolderID & BearerToken to get the AccountHolder balances 
    let balances = await getBalances(accountId, bearerToken.access_token);

    if(balances.result.balances) {

        console.log("balances: " + JSON.stringify(balances.result.balances, null, 2));

        // we'll pick a balance that uses USD
        let balanceId = balances.result.balances.items.find(b => b.currency === "USD").id;

        clientReferenceId = crypto.randomUUID();

        // make a debit request
        let debitResult = await createDebit(
            accountId, 
            balanceId,
            6.12, //amount
            "USD", //currency
            true, //targetAmount
            clientReferenceId, 
            bearerToken.access_token,
            "Sample Description", 
            config.partnerId);
        
        // log the debit response
        // TODO: should implement a page with amount + fee disclosure & "commit" button for user to press
        console.log(`Debit response:`);
        console.log(JSON.stringify(debitResult, null, 2));

        // did we receive a successful debit response?
        if(debitResult.result && 
            debitResult.result.commit_id) {

            // summary of debit charge
            console.log(`Disclosure: ${JSON.stringify(getChargeDisclosure(debitResult))}`);
            
            // commit/complete the debit request
            // may result in a MFA challenge
            // you can also configure a webhook to get notified when this commit is completed
            let commitResult = await commitCharge(
                accountId, debitResult.result.commit_id,
                bearerToken.access_token);          

            console.log(`Commit response:`);
            console.log(JSON.stringify(commitResult, null, 2));

            // if there's a MFA challenge, go to the link in the commit response and approve before continuing 
            // (assuming you have access to the number)
            clientReferenceId = debitResult.result.client_reference_id;

            // get the status of the charge
            let chargeStatus = await getChargeStatus(
                accountId, debitResult.result.client_reference_id,
                bearerToken.access_token);
    
            console.log(`Charge status : ${chargeStatus}`);
        }
        else if(debitResult && debitResult.challenge) { // challenge requested
            console.log(`Send user to ${debitResult.challenge.url} for ` +  
            `${debitResult.challenge.type} challenge`);
        }
    }
});

const server = app.listen(4000, function () {
    console.log("Listening for callback");
 });