# OKTA authorisation
Proof of concept found on - https://github.com/norisalsaadie/oookta-fun-nnn

1. Client side - https://github.com/norisalsaadie/oookta-fun-nnn/blob/master/views/index.html#L7
2. Server side - https://github.com/norisalsaadie/oookta-fun-nnn/blob/master/index.js#L21

## Setup
1. Create OKTA application - via admin url
2. Enable `Implicit` mode and add the required callback URL (make note of the `Client ID` for UI and `Client secret` for API)
3. Assign an admin user under the `Assignments`
4. Enable CORS by navigating to `Security` -> `Trusted Origins` -> `CORS` and add domain

## Authenication flow:
OKTA will be used for logins and password resets.

### Client login flow
1. If no session is found, redirect client to OKTA for authentication (JS SDK makes this simple, request responseType: 'id_token')
2. OKTA will redirect to the redirectUri - use the JS SDK to parse the URL
3. Store the token and expire time in localStorage

### API token verification
1. Decode token
2. Using the OKTA API, grab the keys for the tenant application `[OKTA_APP_URL]/oauth2/v1/keys`
3. Verify the decoded token `kid` is found within the returned keys
4. Verify the following cases:
  - Verify the `id_token`'s signature
  - Verify issuer is OKTA, this can be found in the the decoded `id_token` payload
  - Verify `id_token` was minted for our clientID
  - Verify it's not expired

### Password reset
As far as this project is considered, redirect user to OKTA login page and present password reset.
However, if we wish to use the API to kick start a password reset, this is possible

### User activation and deactivation
Users accounts can be activated and deactivated via the API
- Activate -  `[OKTA_APP_URL]/api/v1/users/:id/lifecycle/activate`
- Deactivate -  `[OKTA_APP_URL]/api/v1/users/:id/lifecycle/deactivate`

### User creation
Users can be created via the API
- Creation endpoints - `[OKTA_APP_URL]/oauth2/v1/users`
- Create User without Credentials - http://developer.okta.com/docs/api/resources/users.html#create-user-without-credentials
- Create User with Recovery Question - http://developer.okta.com/docs/api/resources/users.html#create-user-with-recovery-question
- Create User with Password - http://developer.okta.com/docs/api/resources/users.html#create-user-with-password
- Create User with Password & Recovery Question - http://developer.okta.com/docs/api/resources/users.html#create-user-with-password--recovery-question
- Create User with Authentication Provider - http://developer.okta.com/docs/api/resources/users.html#create-user-with-authentication-provider
- Create User in Group - http://developer.okta.com/docs/api/resources/users.html#create-user-in-group
