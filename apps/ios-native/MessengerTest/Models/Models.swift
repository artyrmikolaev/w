import Foundation

struct User: Codable, Identifiable {
    let id: String
    let username: String
    let displayName: String?
    let avatar: String?
    let bio: String?
    let isOnline: Bool?
    let lastSeen: Date?
}

struct AuthResponse: Codable {
    let token: String
    let user: User
}

struct Chat: Codable, Identifiable {
    let id: String
    let isGroup: Bool
    let name: String?
    let avatar: String?
    let lastMessage: Message?
    let unreadCount: Int?
    let updatedAt: Date
    let participants: [ChatParticipant]?
}

struct ChatParticipant: Codable, Identifiable {
    var id: String { user.id }
    let user: User
}

struct Message: Codable, Identifiable {
    let id: String
    let content: String
    let senderId: String
    let chatId: String
    let isRead: Bool
    let createdAt: Date
    let sender: User?
}
