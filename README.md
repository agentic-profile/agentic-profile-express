# Agentic Profile Chat Using Node Express

This is an example of a Node service that hosts Agentic Profile agents.

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


## Testing A General Agentic Profile With A Client Agent

1. Make sure the local server is started at http://localhost:3003

    $ yarn dev

2. Create a demo agentic profile with public and private keys, and an account (uid=2) on the server

    $ node test/create-agentic-profile

3. Use CURL to request a chat reply:

    $ curl -X PUT http://localhost:3003/users/2/agent-chats

4. Since you did not provide an Agentic authorization token, the server responded with a challenge similar to:

    {
        "type": "agentic-challenge/0.3",
        "challenge": {
            "id": 1,
            "random": "sA3xFXBp-9v8I0syAhcWcglgoRrTmj2UAiRmFpzpzbw"
        }
    }

    NOTE: Copy the "id" and "random" from your server's response for the next step.  In the above example the id is "1" and the random is "sA3xFXBp-9v8I0syAhcWcglgoRrTmj2UAiRmFpzpzbw"

5. Use the agent authorization token (session key) to authenticate and generate a chat reply

    $ node test/chat-reply &lt;id from step 4&gt; &lt;random from step 4&gt;

    For example:

    node test/chat-reply 1 "sA3xFXBp-9v8I0syAhcWcglgoRrTmj2UAiRmFpzpzbw"
