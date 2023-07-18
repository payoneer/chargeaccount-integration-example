# Introduction 

Welcome to the Payoneer charge account API Library on GitHub! This library provides a convenient way to interface with the Payoneer API for charge accounts using Node.js. Whether you're looking to acquire tokens, retrieve account balances, perform debit transactions, commit transactions, or check charge status, this library has got you covered.

Compatibility: Please note that this library requires Node.js version 17.5 or higher due to its usage of the node-fetch module. Make sure you have the appropriate version installed before getting started.

To help you get started quickly, we have provided example code snippets and instructions for using the various functionalities of the Payoneer API. You can find these examples in the documentation section of this repository.

# Setup

*TL;DR*

Start a node service locally on port 4000 by running:
`node .\src\charge-app.js`. 
Or hit F5 to debug in VS Code
This is the callback endpoint after authentication to then "do stuff"

Host `auth-consent.html` on live server (or any web host of your choosing)
This is the Payoneer login page for the given clientId + redirect Uri
(if you're using VS Code, install/use the "Live Server" VS Code Extension, right-click on the html file, and select "Open With Live Server")  

login with your account credentials
(could be configured as requiring MFA or not)

Skip 2FA verification - "Not Now"
Allow access to your Payoneer account - "Agree"
Connection successful - "Ok"
Redirect will now hit the oauth/authorize endpoint in `.\srv\charge-app.js`

-----------

These instructions are based on the use of Visual Studio Code, which runs on most popular development environments including Windows, MacOS, and Linux. If you don't have VS Code it can be downloaded at [https://code.visualstudio.com](https://code.visualstudio.com).

We will make use of the `Live Server` extension. This allows changes in your server code to take effect immediately without reloading. If you do not have Live Server you can install it from the Extensions window. When Live Server is running you should see a button labeled **Go Live** near the right end of the status bar. 

# Example

Once you've been redirected to the account holder login screen from auth-consent.html: login, consent, then click OK. A callback is sent to the redirectUri and received by charge-app webservice. In this case, we've configured the redirectUri to `https://redirectmeto.com/http://localhost:4000/oauth/authorize`, which will redirect our callback from a public domain (https://redirectmeto.com/) to our running node webserver (http://localhost:4000/oauth/authorize). You'll want to replace this redirect uri with your own site that handles the callback.

The local host webserver (charge-app.js) will then receive that callback and send a request to Payoneer to exchange that code for a bearer token and the account holder details. With that information, the node client fetches the balances from Payoneer for that accountholder with `getBalances`.

Given one of those balances (we take an arbitrary index in our example), you can then use `createDebit` to create a charge against the given balance. If this request is successful, display the result of the call to the end user for their consideration with `getChargeDisclosure` which will return json which represents what should be shown to the end user to approve the debit.

Once the user accepts the charge, you can `commitCharge` which will start the charge process for the requested debit. If the response to the commit call is success, the charge was successful. You can then call `getChargeStatus` to check the status of the charge. If 403 is returned, the user should be redirected to the returned url to complete MFA.

# Documentation

The documentation section of this repository provides detailed information on the available methods, their parameters, and usage examples. It covers the following functionalities:

Acquiring Tokens: Learn how to obtain authentication tokens for accessing the Payoneer API.
GetAccountBalance: Retrieve the account balance associated with your Payoneer account.
Debit: Initiate a charge to be paid from an account holder's Payoneer account to a partner's Payoneer account. This calculates
Commit: Commit a transaction that has been initiated but not yet completed.
GetChargeStatus: Check the status of a previously initiated charge.

# Contributions

We welcome contributions from the community to improve this library. If you have any suggestions, bug reports, or feature requests, please open an issue or submit a pull request. Together, we can make this library even better!

Thank you for choosing the Payoneer API Library. We hope it simplifies your integration with the Payoneer API and enhances your development experience. Happy coding!