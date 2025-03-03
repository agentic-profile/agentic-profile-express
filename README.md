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


## Testing a General Agentic Profile With No Client Agent

1. Make sure the local server is started at http://localhost:3003

    $ yarn dev

2. Create a demo agentic profile with public and private keys, and an account (uid=2) on the server

    $ node test/create-agentic-profile

3. Use CURL to request a chat reply:

    $ curl -X PUT http://localhost:3003/v1/agents/2/agentic-chat

4. Since you did not provide an Agentic authorization token, the server responded with a challenge similar to:

    {
        "type":"agentic-challenge/1.0",
        "challenge":"1:EbC3m7GQA8W+SNXcE5uZRgw6DguCShQGYTAPINCf2YY",
        "login":"/v1/agent-login"
    }

    NOTE: Copy the "challenge" from your server's response for the next step.  In the above example the challenge is "1:EbC3m7GQA8W+SNXcE5uZRgw6DguCShQGYTAPINCf2YY"

5. Sign the challenge and login.  (Make sure to replace the string after "node test/agent-login" with the challenge you got from step 4)

    $ node test/general-login &lt;challenge-from-step 4&gt;

    For example:

    $ node test/general-login "1:EbC3m7GQA8W+SNXcE5uZRgw6DguCShQGYTAPINCf2YY"

6. You will get a summary of the login similar to...

    General login...
    Using challenge:  1:BFfloTjw8WslqaMXkg4p0w5fBsZactY6mde4uhL/4To
    Using keypair:  {
        "type": "ed25519",
        "privateKey": "LMXVpQ4GEwBTiCUprSFETw8ewYCUNnxmB8SN42BHEKQ",
        "publicKey": "9xi+PJz1HMvJJz3TkTj4w2TBSuKi9YgpevjD1w9Exe4"
    }
    HTTP summary: {
        "request": {
            "method": "post",
            "url": "http://localhost:3003/v1/agent-login",
            
            ...
        },
        "response": {
            "status": 200,
            "data": {
                "agentToken": "eyJpZCI6MSwic2Vzc2lvbktleSI6IjJYU3h1ZHBXV2lxMStKYlZVa2RhVE1ZL282dGxObDJ0VFFuSFJqN1F5UlkifQ"
            }
        }
    }

    Agent token: eyJpZCI6MSwic2Vzc2lvbktleSI6IjJYU3h1ZHBXV2lxMStKYlZVa2RhVE1ZL282dGxObDJ0VFFuSFJqN1F5UlkifQ

7. Use the agent token (session key) to authenticate and generate a chat reply

    $ node test/chat-reply &lt;Agent token from step 6&gt;

    For example:

    node test/chat-reply eyJpZCI6MSwic2Vzc2lvbktleSI6IjJYU3h1ZHBXV2lxMStKYlZVa2RhVE1ZL282dGxObDJ0VFFuSFJqN1F5UlkifQ


## Testing an Agentic Profile With Listed Agents With Their Own Public Keys

1. Make sure the local server is started at http://localhost:3003

    $ yarn dev

2. Create a demo agentic profile with public and private keys.

    $ node test/create-agentic-profile

3. Use CURL to request a chat reply:

    $ curl -X PUT http://localhost:3003/v1/agents/1/agentic-chat

4. Since you did not provide an Agentic authorization token, the server responded with a challenge similar to:

    {
        "type":"agentic-challenge/1.0",
        "challenge":"1:EbC3m7GQA8W+SNXcE5uZRgw6DguCShQGYTAPINCf2YY",
        "login":"/v1/agent-login"
    }

    NOTE: Copy the "challenge" from your server's response for the next step.  In this case the challenge is "1:EbC3m7GQA8W+SNXcE5uZRgw6DguCShQGYTAPINCf2YY"

5. Sign the challenge and login.  (Make sure to replace the string after "node test/agent-login" with the challenge you got from step 4)

    $ node test/agent-login &lt;challenge from step 4&gt;

    For example:

    $ node test/agent-login "1:EbC3m7GQA8W+SNXcE5uZRgw6DguCShQGYTAPINCf2YY"

6. The agent login script will return with something similar to:



6. Use the agent token (session key) to authenticate and generate a chat reply

    $ node test/chat-reply "eyJpZCI6MSwic2Vzc2lvbktleSI6IkFJMmtKQ1BqRnBtNEc1W"

