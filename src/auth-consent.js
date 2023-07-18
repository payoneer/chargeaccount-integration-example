import { authorize } from './payoneer-service.js';
import config from './config.js';

// Create the url which the user will be redirected to in order to login and consent.
const consent_url = authorize(config.clientId, config.redirectUrl);
console.log(`navigating to ${consent_url}`);

// Send the user (us during development) to the consent page to consent.
window.open(consent_url);
