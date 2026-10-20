# Security Specification - THÁM TỬ TOÁN NHÍ

## 1. Data Invariants
1. Students can only read and create their own attempts (`attempt.studentId == request.auth.uid`).
2. Students can only read assignments assigned to their class (`assignment.classId == user.classId`).
3. Lesson content is only readable when published or accessed by authorized teachers/admins.
4. Answer keys and secret solutions are never exposed to students ahead of time.
5. User roles cannot be modified or self-escalated by regular users.
6. Teachers can only access and assign work to their assigned classes.
7. Attempt updates are locked after completion (`status: 'completed'`).
8. All writes must carry valid `dataOrigin` ('simulation' | 'real') and `environmentTag` ('demo' | 'production').

## 2. The "Dirty Dozen" Threat Payloads
1. Student attempts to set `role: 'admin'` in `users/{uid}`.
2. Student attempts to read other students' `attemptAnswers` or `attempts`.
3. Student attempts to modify completed attempt score directly.
4. Unauthenticated user attempts to list `lessons` or `assignments`.
5. Teacher A attempts to modify Teacher B's draft lesson without authorization.
6. Malicious actor injects oversized 1MB string into `questionId` or `studentCode`.
7. Student attempts to delete class or assignment records.
8. Attacker attempts to update an attempt with ghost fields (e.g. `isAdmin: true`).
9. Student attempts to bypass answer validation by reading hidden keys.
10. Attacker attempts to write audit logs as another actor.
11. User attempts to update immutable fields like `createdAt`, `originalOwnerId`.
12. Attempt to write timestamp from client clock rather than server timestamp.

## 3. Defense Implementation
- Strict Attribute-Based Access Control (ABAC) in `firestore.rules`.
- Deny-by-default root rule.
- Helper functions: `isSignedIn()`, `isAdmin()`, `isTeacher()`, `isStudent()`, `isOwner(userId)`.
- Server-side ID token verification for all administrative endpoints.
