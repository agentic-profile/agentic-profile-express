# Agentic Profile Chat Using Node Express

This is an example of a Node service that supports Agentic Profile agent chats.

This service can run locally, on a Node server, or on AWS Lambda.  It supports a simple in-memory database for local testing, and MySQL when running in the cloud.

This simple demo is intended to be extended for more complex use cases.


## Quickstart

The easiest way to run this demo is locally.

1. From the shell, clone this repository

    $ git clone git@github.com:agentic-profile/agentic-profile-express.git

2. Then switch to the project directory

    $ cd agentic-profile-express

3. Download dependencies

    $ yarn

4. Run the server

    $ yarn dev


## Enable Admin access (and other features)

1. Copy the file example.env to .env

    $ cp example.env .env

2. Edit the .env file to enable admin features.  Uncomment ADMIN_TOKEN and choose a password, for example:

    ADMIN_TOKEN=yoursecret

3. Restart the server

    $ yarn dev

4. Make sure an admin feature works.  From the command line try:

    $ curl -H "Authorization: Bearer yoursecret" http://localhost:3003/storage

    Or from the browser:

    http://localhost:3003/storage?auth=yoursecret


## Testing a Local Agentic Profile With A Locally Running Agentic Chat Service

1. Create an .env file to support "admin" features.  See example.env for more information.

    ADMIN_TOKEN=yoursecret

2. Make sure the local server is started at http://localhost:3003

    $ yarn dev

3. Create a demo agentic profile with public and private keys, and an account (uid=2) on the server

    $ node test/create-local-agentic-profile

    You can review the results in the local www/iam/6 directory...

4. Use CURL to (try to) send a chat message:

    $ curl -X PUT http://localhost:3003/users/2/agent-chats

5. Since you did not provide an Agentic authorization token, the server responded with a challenge similar to:

    {
        "type": "agentic-challenge/0.3",
        "challenge": {
            "id": 1,
            "random": "sA3xFXBp-9v8I0syAhcWcglgoRrTmj2UAiRmFpzpzbw"
        }
    }

    NOTE: Copy the "id" and "random" from your server's response for the next step.  In the above example the id is "1" and the random is "sA3xFXBp-9v8I0syAhcWcglgoRrTmj2UAiRmFpzpzbw"

6. Use the agent authorization token (session key) to authenticate and generate a chat reply

    $ node test/local-chat-message &lt;id from step 5&gt; &lt;random from step 4&gt;

    For example:

    node test/local-chat-message 1 "sA3xFXBp-9v8I0syAhcWcglgoRrTmj2UAiRmFpzpzbw"


## Testing a Global Agentic Profile With A Locally Running Agentic Chat Service

A global agentic profile is available from anywhere on the internet.  The "did:web" variant DID documents are
available via HTTPS which is used in the example below.  We use the "test.agenticprofile.ai" domain for
hosting temporary profiles for teating.


1. Create an .env file to support "admin" features.  See example.env for more information.

    ADMIN_TOKEN=yoursecret

2. Make sure the local server is started at http://localhost:3003

    $ yarn dev

3. Create a global demo agentic profile with public and private keys, and a local account (uid=2) on the server

    $ node test/create-global-agentic-profile

    You can review the results in your ~/.agentic/iam/6 directory...

4. Use CURL to (try to) send a chat message:

    $ curl -X PUT http://localhost:3003/users/2/agent-chats

5. Since you did not provide an Agentic authorization token, the server responded with a challenge similar to:

    {
        "type": "agentic-challenge/0.3",
        "challenge": {
            "id": 1,
            "random": "sA3xFXBp-9v8I0syAhcWcglgoRrTmj2UAiRmFpzpzbw"
        }
    }

    NOTE: Copy the "id" and "random" from your server's response for the next step.  In the above example the id is "1" and the random is "sA3xFXBp-9v8I0syAhcWcglgoRrTmj2UAiRmFpzpzbw"

6. Use the agent authorization token (session key) to authenticate and generate a chat reply

    $ node test/global-chat-message &lt;id from step 5&gt; &lt;random from step 4&gt;

    For example:

    $ node test/global-chat-message 1 "sA3xFXBp-9v8I0syAhcWcglgoRrTmj2UAiRmFpzpzbw"


## Testing a Global Agentic Profile with a Cloud Deployment of an Agentic Chat Service 

NOTE: The following instructions assume you have created an agentic service at https://agents.smarterdating.ai  In the following instructions use your name server domain name.


1. Create a demo agentic profile with public and private keys, and an account (uid=2) on the server

    $ node test/create-global-agentic-profile

    You can review the results in the ~/.agentic/iam/6 directory...

4. Use CURL to (try to) send a chat message:

    $ curl -X PUT https://agents.smarterdating.ai/users/2/agent-chats

5. Since you did not provide an Agentic authorization token, the server responded with a challenge similar to:

    {
        "type": "agentic-challenge/0.3",
        "challenge": {
            "id": 1,
            "random": "sA3xFXBp-9v8I0syAhcWcglgoRrTmj2UAiRmFpzpzbw"
        }
    }

    NOTE: Copy the "id" and "random" from your server's response for the next step.  In the above example the id is "1" and the random is "sA3xFXBp-9v8I0syAhcWcglgoRrTmj2UAiRmFpzpzbw"

6. Use the agent authorization token (session key) to authenticate and generate a chat reply

    $ node test/remote-chat-message &lt;id from step 5&gt; &lt;random from step 4&gt;

    For example:

    $ node test/remote-chat-message 1 "sA3xFXBp-9v8I0syAhcWcglgoRrTmj2UAiRmFpzpzbw"
