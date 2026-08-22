# Vortex GOS3 Security Specification (Firestore ABAC & Zero-Trust)

## Data Invariants
1. **User Profiles (`/users/{userId}`)**: Can be viewed publicly, but only updated/created by the authenticated owner (`request.auth.uid == userId`) or admin.
2. **Private User Data (`/users/{userId}/private/{docId}`)**: Strict Split Collection. Only accessible by the owner (`request.auth.uid == userId`) or admin. Blanket reads strictly denied.
3. **Posts (`/posts/{postId}`)**: Publicly readable. Can only be created/updated by the authenticated author (`request.auth.uid == incoming().authorId`). `authorId` and `createdAt` are immutable after creation.
4. **Post Likes (`/posts/{postId}/likes/{likeId}`)**: Created by authenticated user whose `request.auth.uid == incoming().userId`. Verified via Master Gate parent check.
5. **Post Comments (`/posts/{postId}/comments/{commentId}`)**: Created by authenticated author matching `incoming().authorId`.
6. **Chat Messages (`/chat_messages/{messageId}`)**: Authenticated reads. Created only by sender matching `request.auth.uid == incoming().senderId`.
7. **Connectors (`/connectors/{connectorId}`)**: Private to the user (`request.auth.uid == resource.data.userId`).

## Dirty Dozen Payloads Audit
1. **Ghost Field on Profile**: Attempting to inject `isAdmin: true` into `/users/{uid}` -> **DENIED** (keys strictly constrained).
2. **Impersonated Post Creation**: Setting `authorId: 'victim_uid'` while logged in as `attacker_uid` -> **DENIED** (`incoming().authorId == request.auth.uid`).
3. **Immutable Field Mutate**: Changing `authorId` on update -> **DENIED** (`incoming().authorId == existing().authorId`).
4. **Massive Payload Denial of Wallet**: Sending 10MB string into `content` -> **DENIED** (`content.size() <= 5000`).
5. **ID Path Injection**: Requesting `/users/../../evil` or non-regex IDs -> **DENIED** (`isValidId()`).
6. **Unauthenticated Read on Private Info**: Querying `/users/{userId}/private/info` as guest -> **DENIED** (`isSignedIn() && request.auth.uid == userId`).
7. **PII Snooping**: Querying another user's private document -> **DENIED** (`request.auth.uid == userId`).
8. **Client Query Delegation Exploit**: Listing all connectors without `userId` check -> **DENIED** (`resource.data.userId == request.auth.uid`).
9. **Fake Email Verified Spoof**: Admin bypass with unverified email -> **DENIED** (`request.auth.token.email_verified == true`).
10. **Terminal State Tampering**: Changing immutable audit logs -> **DENIED**.
11. **Direct Like Tampering**: Modifying another user's like -> **DENIED**.
12. **Comment Impersonation**: Posting comment under another user's ID -> **DENIED**.
