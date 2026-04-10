class ChatParticipant {
  const ChatParticipant({
    required this.id,
    required this.name,
    this.profileImage,
  });

  final String id;
  final String name;
  final String? profileImage;

  factory ChatParticipant.fromJson(Map<String, dynamic> json) {
    return ChatParticipant(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Conversation',
      profileImage: json['profileImage']?.toString(),
    );
  }
}

class ChatConversation {
  const ChatConversation({
    required this.partnerId,
    required this.partnerName,
    required this.lastMessage,
    required this.timestamp,
    this.partnerImage,
    this.unread = 0,
  });

  final String partnerId;
  final String partnerName;
  final String? partnerImage;
  final String lastMessage;
  final DateTime timestamp;
  final int unread;

  factory ChatConversation.fromJson(Map<String, dynamic> json) {
    return ChatConversation(
      partnerId: json['partnerId']?.toString() ?? '',
      partnerName: json['partnerName']?.toString() ?? 'Conversation',
      partnerImage: json['partnerImage']?.toString(),
      lastMessage: json['lastMessage']?.toString() ?? '',
      timestamp: _parseDateTime(json['timestamp']),
      unread: (json['unread'] as num?)?.toInt() ?? 0,
    );
  }
}

class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.senderId,
    required this.receiverId,
    required this.content,
    required this.timestamp,
    this.isRead = false,
    this.sender,
  });

  final String id;
  final String senderId;
  final String receiverId;
  final String content;
  final DateTime timestamp;
  final bool isRead;
  final ChatParticipant? sender;

  bool isFrom(String userId) => senderId == userId;

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id']?.toString() ?? '',
      senderId: json['senderId']?.toString() ?? '',
      receiverId: json['receiverId']?.toString() ?? '',
      content: json['content']?.toString() ?? '',
      timestamp: _parseDateTime(json['createdAt']),
      isRead: json['read'] == true,
      sender: json['sender'] is Map
          ? ChatParticipant.fromJson(
              Map<String, dynamic>.from(json['sender'] as Map),
            )
          : null,
    );
  }

  factory ChatMessage.local({
    required String senderId,
    required String receiverId,
    required String content,
  }) {
    return ChatMessage(
      id: 'local-${DateTime.now().microsecondsSinceEpoch}',
      senderId: senderId,
      receiverId: receiverId,
      content: content,
      timestamp: DateTime.now(),
      isRead: true,
    );
  }
}

class ChatThread {
  const ChatThread({required this.partner, required this.messages});

  final ChatParticipant partner;
  final List<ChatMessage> messages;
}

DateTime _parseDateTime(dynamic value) {
  if (value is String) {
    final parsed = DateTime.tryParse(value);
    if (parsed != null) {
      return parsed.toLocal();
    }
  }

  return DateTime.now();
}
