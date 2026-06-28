// GET /api/groups/:groupId/chats/:chatId returns the chat with each message's
// `user` populated — but only `_id` + `username` are ever read. `user` can be
// null if the author was deleted (mongoose populate of a missing ref).
//
// POST .../messages returns the *raw* new message (user is just the id string).
// We never read that shape: sends are appended optimistically from the current
// auth user (see useAddMessage), mirroring the web app.

export interface ChatMessageUserDTO {
  _id: string;
  username: string;
}

export interface ChatMessageDTO {
  user: ChatMessageUserDTO | null;
  message: string;
  createdAt: string;
}

export interface ChatDTO {
  _id: string;
  group: string;
  entity: string;
  entityModel: "Question" | "Rally" | "Jukebox";
  messages: ChatMessageDTO[];
  createdAt: string;
}
