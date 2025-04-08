CREATE DATABASE agentic_service
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE USER 'agenticworker'@'%' IDENTIFIED BY '<choose-a-password>';
GRANT SELECT,INSERT,UPDATE,DELETE,EXECUTE
    ON agentic_service.*
    TO 'agenticworker'@'%';
FLUSH Privileges;

USE agentic_service;

CREATE TABLE users(
    uid INT PRIMARY KEY AUTO_INCREMENT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    source TINYTEXT NOT NULL, # Track who created user accounts
    password_hash JSON, # { hash: base64_string, salt: salt.toString('base64'), options }
    session_key TINYTEXT,
    roles JSON, # ARRAY as 'admin','mod','qa','dev' 
    name VARCHAR(80),
    alias VARCHAR(40),
    media JSON,   # { images: [512,'256x256',...] }
    birthday DATE,
    disabled_by INT, # UID of moderator or admin that disabled this account from ugc
    eula TIMESTAMP,  # Date the user agreed to a EULA, enables posting, comments, etc.
    credit NUMERIC(15,4) NOT NULL DEFAULT 0,
    coords POINT,
    coords_updated TIMESTAMP,
    intro TEXT,
    social JSON,
    preferences JSON,
    UNIQUE INDEX unique_handle_idx (alias)
);


CREATE TABLE agent_chats(
    # agent chat key
    uid INT NOT NULL,                        # user that agent is representing
    user_agent_did VARCHAR(255) NOT NULL,  # uid's agent on this system
    peer_agent_did VARCHAR(255) NOT NULL,  # DID (partial of full with fragment) uri of other person/actor/agent (may be on different/remote system)

    UNIQUE INDEX agent_key (uid, user_agent_did, peer_agent_did),

    # state JSON, # current subject, etc.
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_message TIMESTAMP,
    message_count INT DEFAULT 0,
    cost NUMERIC(13,4) DEFAULT 0,
    aimodel TINYTEXT,     # e.g. openai:gpt-4-preview
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,

    history JSON # format of JSON is { messages:[ { from: "did:web:iamagentic.ai/7", contents: "Hello", created: <ISO8601 string> }, ... ] }
);

# sessions created by agent server side, and session key given to client agent
CREATE TABLE client_agent_sessions(
    id INT PRIMARY KEY AUTO_INCREMENT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    challenge TINYTEXT NOT NULL,
    agent_did VARCHAR(255),    -- client agent that authenticated with us
    auth_token TEXT
);

CREATE TABLE agentic_profile_cache(
    profile_did VARCHAR(255) NOT NULL,
    agentic_profile JSON NOT NULL,      -- cached profile
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE(profile_did)
);

# on client side, session token for communicating with remote/server agentUrl
CREATE TABLE remote_agent_sessions(
    uid INT NOT NULL,
    user_agent_did VARCHAR(255) NOT NULL,   -- my user agent, matches uid
    peer_agent_did VARCHAR(255),            -- OPTIONAL server agent we are communicating with
    peer_service_url VARCHAR(255),          -- OPTIONAL service endpoint
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    auth_token TEXT NOT NULL,
    UNIQUE(uid,user_agent_did,peer_agent_did,peer_service_url)
);