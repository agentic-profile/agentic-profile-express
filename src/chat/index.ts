import { ClientAgentSession } from "@agentic-profile/auth";
import { ChatMessageEnvelope } from "./models.js";
import { UserId } from "../storage/models.js";

export async function handleAgentChatMessage( uid: UserId, envelope: ChatMessageEnvelope, agentSession: ClientAgentSession ) {
    //const { profileUri } = agentSession;
    const reply = { content: "Are you sure?", created: new Date() };
    console.log( "handleAgentChatMessage", uid, envelope, agentSession, reply );
    return { reply };
}