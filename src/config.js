
// In a production environment, your service will listen through a publically 
// accessible domain. ex : www.yourdomain.com/oauth/authorize

// ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
// ⚠️⚠️⚠️ Do not use redirectmeto.com in prod. ⚠️⚠️⚠️
// ⚠️⚠️⚠️ We use it in sandbox so we can       ⚠️⚠️⚠️
// ⚠️⚠️⚠️ develop our service on localhost     ⚠️⚠️⚠️
// ⚠️⚠️⚠️ while providing a public domain for  ⚠️⚠️⚠️
// ⚠️⚠️⚠️ Payoneer login to redirect to.       ⚠️⚠️⚠️
// ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️



const config = {

    // The domain and route of the webservice listening for the callback after consent.
    // in this case, we're using a domain that will redirect us to localhost where we're 
    // hosting our test service.
    // ⚠️ Do not use redirectmeto.com in prod ⚠️
    redirectUrl: `https://redirectmeto.com/http://localhost:4000/oauth/authorize`,

    // enter in your own clientId, partnerId, clientSecret as provided by Payoneer
    clientId: "YOUR_CLIENT_ID",
    partnerId: "YOUR_PARTNER_NUMBER",
    clientSecret: "YOUR_CLIENT_SECRET"
    
};

export default config;