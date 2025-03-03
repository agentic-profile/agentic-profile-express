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

	NOTE: Copy the "challenge" from your server's response for the next step...

5. Sign the challenge and login.  (Make sure to replace the string after "node test/agent-login" with the challenge you got from step 4)

	$ node test/general-login "1:EbC3m7GQA8W+SNXcE5uZRgw6DguCShQGYTAPINCf2YY"

6. Use the agent token (session key) to authenticate and generate a chat reply

	$ node test/chat-reply "eyJpZCI6MSwic2Vzc2lvbktleSI6IkFJMmtKQ1BqRnBtNEc1W"


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

	NOTE: Copy the "challenge" from your server's response for the next step...

5. Sign the challenge and login.  (Make sure to replace the string after "node test/agent-login" with the challenge you got from step 4)

	$ node test/agent-login "1:EbC3m7GQA8W+SNXcE5uZRgw6DguCShQGYTAPINCf2YY"

6. Use the agent token (session key) to authenticate and generate a chat reply

	$ node test/chat-reply "eyJpZCI6MSwic2Vzc2lvbktleSI6IkFJMmtKQ1BqRnBtNEc1W"

