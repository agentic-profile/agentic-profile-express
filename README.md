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

    $ curl -X PUT http://localhost:3003/users/2/agent-chats

4. Since you did not provide an Agentic authorization token, the server responded with a challenge similar to:

    {
        "type":"agentic-challenge/1.0",
        "challenge":"1:EbC3m7GQA8W+SNXcE5uZRgw6DguCShQGYTAPINCf2YY",
        "login":"/agent-login"
    }

    NOTE: Copy the "challenge" from your server's response for the next step.  In the above example the challenge is "1:EbC3m7GQA8W+SNXcE5uZRgw6DguCShQGYTAPINCf2YY"

5. Sign the challenge and login.  (Make sure to replace the string after "node test/agent-login" with the challenge you got from step 4)

    $ node test/agent-login &lt;challenge-from-step 4&gt;

    For example:

    $ node test/agent-login "1:EbC3m7GQA8W+SNXcE5uZRgw6DguCShQGYTAPINCf2YY"

6. You will get a summary of the login similar to...

    General login...
    Using challenge:  3:w_XZ3q7rrvE2Rgc0DLUOpjYQ2KwU8t35DVzmncsVT6A
    Using private jwk:  {
        "kty": "OKP",
        "alg": "EdDSA",
        "crv": "Ed25519",
        "x": "MOmbGFNlKWZcVZIyp7pMkIuLH5XsxTEbKDCwXFM6p2I",
        "d": "y6zlZMxU_4iPxyD9xe4l_RUghWxWmfeU8u6GtD4SGX0"
    }
    HTTP summary: {
        "request": {
            "method": "post",
            "url": "http://localhost:3003/agent-login",
            "headers": {
                "Accept": "application/json, text/plain, */*",
                "Content-Type": "application/json",
                "User-Agent": "axios/1.8.1",
                "Content-Length": "388",
                "Accept-Encoding": "gzip, compress, deflate, br"
            },
            "data": "{\"jwsSignedChallenge\":\"eyJhbGciOiJFZERTQSJ9.eyJjaGFsbGVuZ2UiOiIzOndfWFozcTdycnZFMlJnYzBETFVPcGpZUTJLd1U4dDM1RFZ6bW5jc1ZUNkEiLCJhdHRlc3QiOnsiYWdlbnREaWQiOiJkaWQ6d2ViOmxvY2FsaG9zdCUzQTMwMDM6aWFtOjcjYWdlbnRpYy1jaGF0IiwidmVyaWZpY2F0aW9uSWQiOiJkaWQ6d2ViOmxvY2FsaG9zdCUzQTMwMDM6aWFtOjcjYWdlbnQta2V5LTAifX0.43VhsCPRisQTzk1uzJidRcZH2W_YnIXkYy7KPqVaTPOnRP_swAFGSnF0P5e32vJ-xuDYuYsxAbVA69REyvTlDA\"}"
        },
        "response": {
            "status": 200,
            "data": {
                "authToken": "eyJpZCI6Mywic2Vzc2lvbktleSI6Im1pN01CX1ZOM3kwR0xHS2xuNXA5WWtUVlBTbVBBOEVNcXJQcEl4MDhicUUifQ"
            }
        }
    }

    Agent authorization token: eyJpZCI6Mywic2Vzc2lvbktleSI6Im1pN01CX1ZOM3kwR0xHS2xuNXA5WWtUVlBTbVBBOEVNcXJQcEl4MDhicUUifQ

7. Use the agent authorization token (session key) to authenticate and generate a chat reply

    $ node test/chat-reply &lt;Agent zuthorization token from step 6&gt;

    For example:

    node test/chat-reply eyJpZCI6MSwic2Vzc2lvbktleSI6IjJYU3h1ZHBXV2lxMStKYlZVa2RhVE1ZL282dGxObDJ0VFFuSFJqN1F5UlkifQ
