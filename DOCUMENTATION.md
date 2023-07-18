# Overview

This page documents the use of the Payoneer charge account library from your Node.js (Javascript) applications. The functions provided include four functions for authorization:

* authorize
* getApplicationToken
* getAccessTokenByCode
* getAccessTokenByRefreshToken

And functions for managing charges:

* getBalances
* createDebit
* commitCharge
* commitAfterChallenge
* getChargeStatus

If a call is successful, the function returns a string in JSON form representing the result. If a call fails, a JSON string with details about the error is returned.

# Authorization

The functions in this group manage tokens, which provide authorization for the use of the remaining functions.

## authorize

Returns a URI that should be called to provide a consent page
where your customer can grant or deny consent for account access.

```authorize(client_id, redirect_uri);```


| Parameter | Type | Description |
| --- | --- | --- |
| client_id | string | your client ID provided by Payoneer
| redirect_uri | string | the page to which your customer should be directed after giving or denying consent

If successful, returns the URI for the consent page.

## getApplicationToken

Gets an authorization token that can be used for some of the other functions of the Charge Account API. This does *not* include functions that access an individual customer's account.

This function requires your client credentials obtained from Payoneer.

```getApplicationToken(client_id, client_secret);```

| Parameter | Type | Description |
| --- | --- | --- |
| client_id | string | your client ID provided by Payoneer
| client_secret | string | your client secret provided by Payoneer

If successful, the call returns a JSON object containing an Oauth2 bearer token with details. For example:

```
{    
      "token_type":"Bearer",
      "access_token":"XXXXXXXXXXXXXX",
      "expires_in":2592000,
      "consented_on":1681935177,
      "scope":"read write",
      "refresh_token":null,
      "refresh_token_expires_in":0,
      "id_token":null,
      "error":null,
      "error_description":null
}
```

## getAccessTokenByCode

This function obtains an access token, indicating a customer's consent to access their account.


```
getAccessTokenByCode(client_id, client_secret, code, redirect_uri);
```

| Parameter | Type | Description |
| --- | --- | --- |
| client_id | string | your client ID provided by Payoneer
| client_secret | string | your client secret provided by Payoneer.
| code | string | The consent code from the body of the consent callback initiated with **authorize
| grant_type | string | "authorization_code"
| redirect_uri | string | The redirect uri for your application 

If successful, the call returns a JSON object containing an Oauth2 bearer token with details. For example:

```
{
      "token_type":"Bearer",
      "access_token":"XXXXXXX",
      "expires_in":2592000,
      "consented_on":1681936514,
      "scope":"read write",
      "refresh_token":XXXXXX,
      "refresh_token_expires_in":0,
      "id_token":XXXXXXXX,
      "error":null,
      "error_description":null
}
```


## getAccessTokenByRefreshToken

Create a new access token when the original token expires. Skips the need for the accountHolder to re-authenticate

```getAccessTokenByRefreshToken (client_id, client_secret, refresh_token);```

| Parameter | Type | Description |
| --- | --- | --- |
| client_id | string | your client ID provided by Payoneer
| client_secret | string | your client secret provided by Payoneer.
| refresh_token | string | the refresh token provided when your current access token was created

If successful, the call returns a JSON object that is a subset of that returned by getAccessToken. This object includes a new access token *and* a new refresh token. For example:

```
{
   "token_type": "Bearer",
   "access_token": "XXXXXXXXX",
   "expires_in": 2592000,
   "consented_on": 1548782022,
   "scope": "read write openid",
   "refresh_token": "XXXXXXXXXXXXXX",
   "refresh_token_expires_in": 2592005
}
```

# Charge Management

The functions in this group manage the charge process. All require account access. They are authorized by an access token that represents a customer's consent.

## getBalances

Gets the balances available in a specified account for each available currency.

```getBalances(account_id, token);```


| Parameter | Type | Description |
| --- | --- | --- |
| account_id | string | account ID
| token | string | access token

If successful, the call returns a JSON object containing a list of item objects. Each item describes a balance in a specific currency. For example:

```
{
   "result": {
   "items": [
     {
       "id": "4366181865108056",
       "type": "BALANCE",
       "currency": "GBP",
       "status": "2",
       "status_name": "Active",
       "available_balance": "20.00",
       "update_time": "2018-03-30T19:28:17Z"
      },
      // additional currencies ...
    ],
    "total": 3
   }
}
```
 



## createDebit

Create a debit for a specified amount and currency, using a specified balance. The amount specified does not include fees.

The debit is initially pending. The customer will be notified of the final amount, including fees, and asked to commit the transaction.

```createDebit( account_id, balance_id, amount, currency, client_reference_id, token, description, partner);```

| Parameter | Type | Description |
| --- | --- | --- |
| account_id | string | account ID
| balance_id | string | ID for the balance to be used
| amount | number | amount of the charge in the specified currency
| currency | string | 3-letter code for the currency to be used for the charge. If the balance is in a different currency it will be converted.
| client_reference_id | string | ID you provide to identify this transaction
| token | string | access token for this account
| description | string | brief description of the transaction (less than 200 char.)
| partner | string | your partner ID 

If successful, the call returns a JSON object that describes the debit, for example:

```
{
 "result": {
     "type": "debit",
     "commit_id": "<Guid>",
     "client_reference_id": "XXXXX",
     "last_status": "2022-03-07T15:25:41.406397Z",
     "created_at": "2022-03-07T15:25:41.406397Z",
     "request_details": {
         "client_reference_id": "XXXXX",
         "amount": 110.01,
         "description": "XXXXX",
         "currency": "USD",
         "to": {
             "id": 123456,
             "type": "partner"
         },
         "limit_level": "1"
     },
     "fees": [
         {
             "type": "charge_fee",
             "amount": 1,
             "currency": "USD"
         }
     ],
     "amounts": {
         "charged": {
             "amount": 109.01,
             "currency": "USD"
         },
         "target": {
             "amount": 109.01,
             "currency": "USD"
         }
     },
     "expires_at": "2022-03-07T15:30:41.406397Z"
  }
}
```

The (top level) elements in this object are:

| Name | Value | 
| --- | --- |
| type | "debit" | yes
| commit_id | ID to be passed to the commit function |
| client_reference_id | ID given in request |
| last_status | date/time of last status change |
| created_at | date/time debit was created |
| request_details | details of the debit |
| fees | fees to be charged |
| amounts | amount to be charged and target amount (currencies may be different)
| expires_at | date/time by which debit must be committed



The result describes the amount and currency of the original charge as requested; the amount in the target currency, which may be different; plus any fees involved.

## getChargeDisclosure

Get summary information for a pending charge, including fees, to be presented to the customer. The customer should then have the opportunity to approve or disapprove the charge.

```getChargeDisclosure(pending_charge);```

| Parameter | Type | Description |
| --- | --- | --- |
| pending_charge | object | The result object returned by createDebit

If successful, the call returns a JSON object as in the following example:

```
{
  "Order amount": "EUR 7000",
  "Payment amount": "USD 7653.52",
  "FX Rate": "EUR 1.00 = USD 1.0934"
}
```

The elements of this object are:

| Name | Value | 
| --- | --- |
| Order amount | currency + amount of original order |
| Payment amount | currency + amount to be charge, including fees |
| FX Rate | expression giving the currency conversion rate, if any |

## commitCharge

Attempt to commit a pending charge. This function must be called before the expiry_time given in the result of createDebit. If a commit fails it will be retried only once.

```commitCharge(account_id, commit_id, token, retry);```

| Parameter | Type | Description |
| --- | --- | --- |
| account_id | string | ID for the account
| commit_id |	string | The client_reference_id used for the createDebit call
| token | string | access token for the account
| retry | boolean | true if this is a retry

If the commit succeeds, the result will be a descriptor of the debit including the status code (see getChargeStatus):

```
{
   "result": {
     "payment_id": "XXXXXXXXXXXXXXXX",
     "status": 2,
     "status_description": "completed",
     "last_status": "2023-05-04T13:54:08.2121171Z",
     "created_at": "2023-05-04T13:54:14.8276538Z",
     "client_reference_id": "XXXXXXXXXXXXXXXXXXX",
     "request_details": {
         "url": "/accounts/{AccountHolderId}/balances/{BalanceId}/payments/debit",
         "body": {
             "client_reference_id": "XXXXXXXXXXXXXXX",
             "amount": 150,
             "description": "Sample Description",
             "currency": "USD",
             "target_amount": true,
             "to": {
                 "id": {partnerId},
                 "type": "partner"
             }
         }
     },
     "to": {
         "type": "partner",
         "id": "{partnerId}"
     },
     "fees": [
         {
             "type": "charge_fee",
             "amount": 4.16,
             "currency": "CAD"
         },
         {
             "type": "partner_fee",
             "amount": 10,
             "currency": "USD"
         }
     ],
     "fx": {
         "quote": "{QuoteId}",
         "rate": 0.7212925563,
         "source_currency": "CAD",
         "target_currency": "USD"
     },
     "amounts": {
         "charged": {
             "amount": 203.8,
             "currency": "CAD"
         },
         "target": {
             "amount": 150,
             "currency": "USD"
         }
     }
   }
}
```

If the commit times out, it will be automatically retried (once) after a short delay. If it times out again the call will return with a timeout error.

If Multifactor Authorization (MFA) is enabled, this commit will fail. The result will include a URL; the customer should be directed to this URL for a challenge. If the challenge is passed, a challengeResponse is returned. You should then call commitAfterChallenge to complete the transaction.



## commitAfterChallenge

Try a commit again after a challenge has been passed.

```commitAfterChallenge(challenge_response);```

| Parameter | Type | Description |
| --- | --- | --- |
| challenge_response | object | object returned after challenge

If successful, return a JSON object the same as would be returned by getCommit.


## getChargeStatus

Get the status of a charge which is being processed. The possible status values are:

* 0 -- unknown
* 1 -- in progress
* 2 -- completed
* 3 -- cancelled

```getChargeStatus(account_id, client_reference_id, token);```

| Parameter | Type | Description |
| --- | --- | --- |
| account_id | string | ID for the account
| client_reference_id | string | ID used in createDebit
| token | string | access token for the account

If successful, the call returns a JSON object such as the following:

```
{
   "result": {
      "status": 2,
      "status_description": "completed",
      "payment_id": "4366181902103355"
   } 
}
```
