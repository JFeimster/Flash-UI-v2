# Firebase Security Specification (`security_spec.md`)

This security specification establishes the Attribute-Based Access Control (ABAC) and Zero-Trust architecture for our Firestore structure.

## 1. Data Invariants

1. **User Ownership Boundaries**: No user can read, create, update, or delete profiles, sessions, or saved artifacts belonging to another user. Everything is nested under `/users/{userId}` where `{userId}` must strictly match `request.auth.uid`.
2. **Immutable Identity Integrity**: On creation, UIDs and user identifiers are frozen.
3. **Strict Schema Constraints**: No undocumented fields (shadow writes) are permitted. All writes must pass size and structural validations.
4. **Time Fidelity**: Creation and update timestamps must rely on system clock evaluation (`request.time` matches database transaction times).
5. **No Blind Global Exposure**: General query reads require strict relational alignment; broad scans or blanket lists index lookups are fully rejected.

---

## 2. The "Dirty Dozen" Payloads

Here are 12 specific payloads crafted to breach security, which our security rules and schema validations are engineered to block (`PERMISSION_DENIED` outcomes).

### Pillar 1: User Profile Attacks
1. **The Profiler Impersonator**: Writing to a different user's `/users/{otherUserId}` document with arbitrary values.
2. **The Key Poisoner**: Writing a massive string (>5000 chars) as a `userApiKey` to cause resource exhaustion.
3. **The Creation Time Manipulator**: Setting `createdAt` of a profile to a historic or future date instead of `request.time`.

### Pillar 2: Session Entity Attacks
4. **The Ghost Session Write**: Creating a session where `userId` is spoofed and does not match `request.auth.uid`.
5. **The Massive ID Hijacker**: Forcing creation of a session using a 2KB garbage string for a Document ID, bypassing alphanumeric guards.
6. **The Status State-Machinist**: Updating a finished artifact state back to "streaming" using an unvalidated shadow payload.
7. **The Rogue Field Injector**: Appending a shadow key `isSystemAdmin: true` to bypass administrative limits in session records.
8. **The Timewarp Exploit**: Submitting a pre-baked static number for the session `timestamp` field during creation to bypass real-time clocks.
9. **The Unauthenticated Lurker**: Attempting to list or fetch sessions without an active, verified Session Ticket (no token).

### Pillar 3: Saved Artifact Attacks
10. **The Library Pirate**: Accessing and reading another user's saved artifacts directly.
11. **The Empty Vessel Write**: Attempting to save an artifact missing `html` or with empty string limits.
12. **The Type Poisoning Attempt**: Saving an artifact where `isFavorite` is passed as a string (`"yes"`) or a giant array, exploiting weak type enforcement.

---

## 3. The Test Cases Description

We will verify all interactions below through strict rule definitions. Let's build our robust firebase security rules to enforce these parameters exactly.
