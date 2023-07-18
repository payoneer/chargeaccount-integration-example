
const baseURL = {
    oauth: "/api/v2/oauth2",
    apiUrl: "https://api.sandbox.payoneer.com", //sandbox, production is: https://api.payoneer.com
    loginUrl: "https://login.sandbox.payoneer.com" //sandbox, production is: https://login.payoneer.com
}

/**
 * @description Given your clientId and the configured redirect url, 
 * return a consent page for the AccountHolder to grant consent.
 *
 * @param   {string}  client_id ClientId
 * @param   {string}  redirect_uri The configured redirect domain for your application
 * @returns {string}  Url which the AccountHolder should be redirected to in 
 *                    order to give consent.
 */
export function authorize(client_id, redirect_uri) {
    const scope = "read%20write%20openid"
    return `${baseURL.loginUrl}${baseURL.oauth}/authorize?client_id=` +
        `${client_id}&redirect_uri=${redirect_uri}&scope=${scope}` +
        `&response_type=code`;
}

/**
 * @description Given client credentials, create an application token
 * 
 * @param {string} client_id 
 * @param {string} client_secret 
 * @returns A bearer token with details
 * @example 
 * {    
 *      "token_type":"Bearer",
 *      "access_token":"XXXXXXXXXXXXXX",
 *      "expires_in":2592000,
 *      "consented_on":1681935177,
 *      "scope":"read write",
 *      "refresh_token":null,
 *      "refresh_token_expires_in":0,
 *      "id_token":null,
 *      "error":null,
 *      "error_description":null
 * }
 */
export async function getApplicationToken(client_id, client_secret) {
    var url = `${baseURL.loginUrl}${baseURL.oauth}/token`

    const req = {
        method: "POST",
        headers: new Headers({
            "Authorization": `Basic ${encodeCredentials(client_id, client_secret)}`,
            "Content-Type": "application/json",
        }),
        body: "grant_type=client_credentials&scope=read write"
    };

    try {
        const response = await fetch(url, req);
        return response.text();
    } catch (error) {
        console.log(error)
        return error;
    }
}


/**
 * @description Given that the '/authorize' endpoint was called, 
 * the AccountHolder consented, and the callback was received : 
 * generate a bearer token and a refresh token. You can use
 * the refresh token to regenerate a bearer token with 
 * `refreshToken()` when the bearer token expires.
 * 
 * @param {string} client_id        Your client id
 * @param {string} client_secret    Your client secret
 * @param {string} code             The consent code from the body of the 
 *                                     consent callback initiated with authorize
 * @param {string} redirect_uri     The configured redirect domain for your 
 *                                     application
 * 
 * @returns {string} BearerToken + token details
 * 
 * @example
 * {
 *      "token_type":"Bearer",
 *      "access_token":"XXXXXXX",
 *      "expires_in":2592000,
 *      "consented_on":1681936514,
 *      "scope":"read write",
 *      "refresh_token":XXXXXX,
 *      "refresh_token_expires_in":0,
 *      "id_token":XXXXXXXX,
 *      "error":null,
 *      "error_description":null
 * }
 */
export async function getAccessTokenByCode(client_id, client_secret, code, redirect_uri) {
    var url = `${baseURL.loginUrl}${baseURL.oauth}/token`

    const req = {
        method: "POST",
        headers: new Headers({
            "Authorization": `Basic ${encodeCredentials(client_id, client_secret)}`,
            "Content-Type": "application/json",
        }),
        body: JSON.stringify(
            {
                code: code,
                grant_type: "authorization_code",
                redirect_uri: redirect_uri
            }
        )
    };

    try {
        const response = await fetch(url, req);

        return response.json();
    } catch (error) {
        console.log(`Error retrieving bearer token : ${error}`);
    }
}

export function encodeCredentials(client_id, client_secret) {
    return Buffer.from(`${client_id}:${client_secret}`).toString("base64");
}

/**
 * @description 
 *  Create a refresh token when the original token expires.
 *  If you're using an expired token, call this to get a new token. 
 * 
 * @param {*} client_id 
 * @param {*} client_secret 
 * @param {*} refresh_token 
 * @returns 
 * @example
 * {
 *   "token_type": "Bearer",
 *   "access_token": "XXXXXXXXX",
 *   "expires_in": 2592000,
 *   "consented_on": 1548782022,
 *   "scope": "read write openid",
 *   "refresh_token": "XXXXXXXXXXXXXX",
 *   "refresh_token_expires_in": 2592005
 * }
 * 
 */
export async function getAccessTokenByRefreshToken(client_id, client_secret, refresh_token) {
    const url = `${baseURL.loginUrl}${baseURL.oauth}/token`

    const requestOptions = {
        method: 'POST',
        headers: new Headers({
            "Authorization": `Basic ${encodeCredentials(client_id, client_secret)}`,
            "Content-Type": "application/json",
        }),
        body: JSON.stringify({
            "grant_type": "refresh_token",
            "refresh_token": refresh_token
        })
    };

    try {
        const response = await fetch(url, requestOptions);

        return response.json();
    } catch (error) {
        console.log(`Error refreshing bearer token : ${error}`);
    }
}

/**
 * Get Account Balances
 *
 * @async
 * @param {int}         accountHolderId The AccountHolderId to check the 
 *                                          balances of 
 * @param {string}      token           The OAuth2 bearer token from 
 *                                          getAccessToken
 * 
 * @returns 
 * @example
 * {
 *  "result": {
 *  "items": [
 *    {
 *      "id": "4366181865108056",
 *      "type": "BALANCE",
 *      "currency": "GBP",
 *      "status": "2",
 *      "status_name": "Active",
 *      "available_balance": "20.00",
 *      "update_time": "2018-03-30T19:28:17Z"
 *     },
 *     //...
 *   ],
 *   "total": 3
 *  }
 * }
 * 
 * 
 * 
 * @example When the token is expired, the response will be:
 * 
 * {
 *      "error":"Unauthorized",
 *      "error_description":"Access token is invalid (expired)",
 *      "error_details":
 *      {
 *          "code":401,
 *          "sub_code":4016
 *      }
 * }
 * 
 *  */
export async function getBalances(account_id, token) {
    const url = baseURL.apiUrl + `/v4/accounts/${account_id}/balances`;
    const options =
    {
        method: "GET",
        headers:
        {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
        }
    };

    try {
        const response = await fetch(url, options);
        return response.json();
    } catch (error) {
        console.error("Error retrieving balances", error);
    }
}


/** 
 * Charge Disclosure
 * 
 * @param {object}  pending_charge the response returned from debit
 * @returns {string} json that represents the charge disclosure which should be 
 *                      shown to the user
 * 
 * @Example
 * {
 *  "Order amount": "EUR 7000",
 *  "FX Rate": "EUR 1.00 = USD 1.0934",
 *  "Payment amount": "USD 7653.52"
 * }
 */
export function getChargeDisclosure(pending_charge) {
    let orderAmount = pending_charge.result.amounts.charged.amount;
    let orderCurrency = pending_charge.result.amounts.charged.currency;

    let paymentAmount = pending_charge.result.amounts.target.amount;
    let paymentCurrency = pending_charge.result.amounts.target.currency;

    let orderCurrencyAmount = orderCurrency + " " + orderAmount;
    let targetCurrencyAmount = paymentCurrency + " " + paymentAmount;

    let disclosure = {
        "OrderAmount": orderCurrencyAmount,
        "PaymentAmount": targetCurrencyAmount
    };

    if (pending_charge.result.fx) {
        disclosure.FxRate = pending_charge.result.fx.source_currency + " 1.00 = " +
            pending_charge.result.fx.target_currency + " " + pending_charge.result.fx.rate;
    }
    return disclosure;
}

/**
 * @description Creates a debit request for account holder review. Can then complete 
 *              the debit by calling the commit Charge.
 * 
 * @param {int}         accountHolderId   The accountHolder to debit
 * @param {int}         balanceId         The balance account of the @accountHolderId 
 *                                        to withdraw from. You can look up available 
 *                                        balances via the getBalances call.
 * @param {string}      clientReferenceId Any unique string provided by the partner 
 *                                        to reference this transaction
 * @param {money}       amount            The amount to be debited
 * @param {string}      currency          The target currency (ex: USD), 3-char string
 * @param {boolean}     targetAmount      true - means target/partner will get the exact specified amount. AccountHolder may be charged more after fees and fx costs
 *                                        false - means source/accountHolder is paying a total of the specified amount. Partner will get whatever that translates to after fees and fx costs
 * @param {string}      description       A brief description (<200 character) 
 * @param {object}      to                
 * @param {string}         type           'partner', there's only this value. I don't know what we were thinking.
 * @param {int}            id             ProgramId / PartnerId
 * @param {string}      token             The bearer token from consent flow
 * 
 * @returns 
 * @example
 * 
 * {
 * "result": {
 *     "type": "debit",
 *     "commit_id": "<Guid>",
 *     "client_reference_id": "XXXXX",
 *     "last_status": "2022-03-07T15:25:41.406397Z",
 *     "created_at": "2022-03-07T15:25:41.406397Z",
 *     "request_details": {
 *         "client_reference_id": "XXXXX",
 *         "amount": 110.01,
 *         "description": "XXXXX",
 *         "currency": "USD",
 *         "to": {
 *             "id": 123456,
 *             "type": "partner"
 *         },
 *         "limit_level": "1"
 *     },
 *     "fees": [
 *         {
 *             "type": "charge_fee",
 *             "amount": 1,
 *             "currency": "USD"
 *         }
 *     ],
 *     "amounts": {
 *         "charged": {
 *             "amount": 109.01,
 *             "currency": "USD"
 *         },
 *         "target": {
 *             "amount": 109.01,
 *             "currency": "USD"
 *         }
 *     },
 *     "expires_at": "2022-03-07T15:30:41.406397Z"
 *  }
 * }
 * 
 * */
export async function createDebit(accountHolderId, balanceId, amount, currency, targetAmount, clientReferenceId, token, description, partner) {
    
    const url = baseURL.apiUrl + `/v4/accounts/${accountHolderId}` +
        `/balances/${balanceId}/payments/debit`;

    const options = {
        method: "POST",
        headers: {
            "Accept": "*/*",
            "Content-Type": "Application/json",
            "Authorization": `Bearer ${token}`
        },
        body:
            `{ 
            "client_reference_id":"${clientReferenceId}", 
            "amount":${amount},
            "currency":"${currency}", 
            "target_amount":${targetAmount},
            "description":"${description}", 
            "to":
            { 
                "type":"partner", 
                "id":"${partner}"
            } 
        }`
    };

    try {
        const response = await fetch(url, options);
        return response.json();
    } catch (error) {
        console.error("Error creating debit:", error);
    }
}

/**
 * @description Commits an outstanding debit from a balance for an accountholder
 * 
 * @param {int}     accountHolderId     The id of the accountholder
 * @param {string}  commitId            The ClientReferenceId used for the 
 *                                          corresponding debit call
 * @param {string}  token               Beaerer token for the AccountHolder
 * 
 * @returns
 * @example
  * 
  * {
 * "result": {
 *     "payment_id": "XXXXXXXXXXXXXXXX",
 *     "status": 2,
 *     "status_description": "completed",
 *     "last_status": "2023-05-04T13:54:08.2121171Z",
 *     "created_at": "2023-05-04T13:54:14.8276538Z",
 *     "client_reference_id": "XXXXXXXXXXXXXXXXXXX",
 *     "request_details": {
 *         "url": "/accounts/{AccountHolderId}/balances/{BalanceId}/payments/debit",
 *         "body": {
 *             "client_reference_id": "XXXXXXXXXXXXXXX",
 *             "amount": 150,
 *             "description": "Sample Description",
 *             "currency": "USD",
 *             "target_amount": true,
 *             "to": {
 *                 "id": {partnerId},
 *                 "type": "partner"
 *             }
 *         }
 *     },
 *     "to": {
 *         "type": "partner",
 *         "id": "{partnerId}"
 *     },
 *     "fees": [
 *         {
 *             "type": "charge_fee",
 *             "amount": 4.16,
 *             "currency": "CAD"
 *         },
 *         {
 *             "type": "partner_fee",
 *             "amount": 10,
 *             "currency": "USD"
 *         }
 *     ],
 *     "fx": {
 *         "quote": "{QuoteId}",
 *         "rate": 0.7212925563,
 *         "source_currency": "CAD",
 *         "target_currency": "USD"
 *     },
 *     "amounts": {
 *         "charged": {
 *             "amount": 203.8,
 *             "currency": "CAD"
 *         },
 *         "target": {
 *             "amount": 150,
 *             "currency": "USD"
 *         }
 *     }
 *   }
 * }
 * @example
 * // When MFA is required, redirect user to challenge url for additional verification
 * { 
 *      "error":"challenge_required",
 *      "error_description":"Challenge authentication required. Please see 'challenge' in response for more details.",
 *      "error_details":
 *      {
 *          "code":1803
 *      },
 *      "challenge":
 *      {
 *          "type":"mfa",
 *          "expires_at":"2023-05-03T19:20:18.637Z",
 *          "session_id":"79dd07b9b1a1430e94b32e42bce617cc",
 *          "url":"https://auth.sandbox.payoneer.com/#?t=79dd07b9b1a1430e94b32e42bce617cc&v=a"
 *      }
 * }
 * 
 * @example
 * // when the commit call times out, the response will be the result of 
 * // getChargeStatus. See getChargeStatus for more details.
 * {
 *   "result": {
 *      "status": 2,
 *      "status_description": "completed",
 *      "payment_id": "4366181902103355"
 *   } 
 * }
 * 
 */
export async function commitCharge(accountHolderId, commitId, token, retry) {
    const url = `${baseURL.apiUrl}/v4/accounts/${accountHolderId}/` +
        `payments/${commitId}`;
    const options = {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Accept: "text/plain",
            Authorization: `Bearer ${token}`
        },
        signal: AbortSignal.timeout(30000)
    };

    try {
        const response = await fetch(url, options);
        return response.json();

    } catch (error) {
        if (error.Includes("TimeoutError")) {
            console.log("Requesting status of timed out commit");
            // If payment status is "unknown" or "pending_commit", 
            let chargeStatus = await getChargeStatus(accountHolderId, commitId);
            switch(chargeStatus.status) {
                case 2,3: // completed or cancelled
                    return chargeStatus;
                case 1:
                    // In progress, wait, then retry for completed status
                    await sleep(3000);
                case 0:
                case 1000:
                default:
                    // retry the commit once
                    if(!retry) {
                        return commitCharge(accountHolderId, commitId, token, true);
                    }
              }
        }
    }
    console.error("Error committing charge", error);
}

export async function commitAfterChallenge(challengeResponse, token) {
    const url = `${baseURL.apiUrl}/v4/${challengeResponse}`;
    const options = 
    {
        method: 'GET', 
        headers: 
        {
            Accept: 'text/plain',
            Authorization: `Bearer ${token}`,
        }
    };

    try {
      const response = await fetch(url, options);
      return response.json();
    } catch (error) {
      console.error(error);
    }
}


/**
 * Get the status of an outstanding debit.
 * status : 
 *  > 0 : unknown
 *  > 1 : in progress (please check back later)
 *  > 2 : completed   (success)
 *  > 3 : cancelled   (failure, no retry)
 *
 * @async
 * @param {int} accountId
 * @param {string} commitId
 * @param {string} token
 * @returns {*}
 * 
 * @example
 * {
 *   "result": {
 *      "status": 2,
 *      "status_description": "completed",
 *      "payment_id": "4366181902103355"
 *   } 
 * }
 */
export async function getChargeStatus(accountId, clientReferenceId, token) {
    const url = `${baseURL.apiUrl}/v4/accounts/${accountId}/payments/${clientReferenceId}?type=client_reference_id`;
    const options = 
    {
        method: 'GET', 
        headers: 
        {
            Accept: 'application/json', 
            Authorization: `Bearer ${token}`,
        }
    };
    
    try {
      let response = await fetch(url, options);
      return response.text();
    } catch (error) {
      console.error(error);
    }
}