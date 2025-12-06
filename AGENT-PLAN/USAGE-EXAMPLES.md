# Agent Plan Usage Examples

## 🚀 Real Examples for Common Scenarios

### Example 1: Starting Fresh on a Frontend Task

```
You: I need to work on the Eatsential project. Please read /docs/AGENT-PLAN/00-QUICK-START.md and help me with task FE-S1-001

Agent: I've read the quick start guide. Task FE-S1-001 is about fixing password validation in SignupField.tsx. Let me check the current implementation...

You: Yes, please analyze the current code and show me what needs to be changed.
```

### Example 2: Working on Backend API

```
You: I'm implementing the user registration API for Eatsential. Read /docs/AGENT-PLAN/08-SPRINT-TASKS.md and find task BE-S1-001.

Agent: I found task BE-S1-001. It requires creating the /api/auth/register endpoint with email validation, password hashing, and proper error handling. Should I start by creating the necessary files?

You: Yes, and make sure to follow the patterns in /docs/AGENT-PLAN/06-BACKEND-PATTERNS.md
```

### Example 3: Quick Bug Fix

```
You: There's an issue with password validation not matching our requirements. Check /docs/AGENT-PLAN/08-SPRINT-TASKS.md for the GitHub issue #41 fix.

Agent: I see issue #41 corresponds to task FE-S1-001. The password needs to be 8+ characters with uppercase, lowercase, number, and special character. Currently it only checks for 6+ characters. Let me fix this...
```

### Example 4: Understanding Architecture Before Coding

```
You: I need to understand how the health profile system works before implementing. Read /docs/AGENT-PLAN/02-ARCHITECTURE.md and explain the data flow for health profile creation.

Agent: Based on the architecture document, the health profile creation flow is...
```

### Example 5: Writing Tests

```
You: I finished implementing the allergy input component. Help me write tests following /docs/AGENT-PLAN/07-TESTING-STRATEGY.md

Agent: I'll help you write tests. Based on the testing strategy, we need unit tests for the component, especially focusing on allergen validation since it's safety-critical...
```

## 💡 Pro Tips

### DO:

- Always start with the task ID from `08-SPRINT-TASKS.md`
- Reference specific pattern documents when implementing
- Ask the agent to check existing code for similar patterns
- Request tests alongside implementation

### DON'T:

- Don't ask the agent to read all documents at once
- Don't skip the task definition and jump to coding
- Don't ignore the acceptance criteria

## 🎯 Quick Commands

### For Copy-Paste:

**Frontend Developer:**

```
Read /docs/AGENT-PLAN/08-SPRINT-TASKS.md and help me with task FE-S1-[NUMBER]. Check /docs/AGENT-PLAN/05-FRONTEND-PATTERNS.md for implementation patterns.
```

**Backend Developer:**

```
Read /docs/AGENT-PLAN/08-SPRINT-TASKS.md and help me with task BE-S1-[NUMBER]. Follow the patterns in /docs/AGENT-PLAN/06-BACKEND-PATTERNS.md.
```

**Full Stack:**

```
I'm working on both frontend and backend for [FEATURE]. Start with /docs/AGENT-PLAN/00-QUICK-START.md and then check tasks FE-S1-[NUMBER] and BE-S1-[NUMBER].
```

**Debugging:**

```
I have an error [ERROR MESSAGE]. Read /docs/AGENT-PLAN/09-AGENT-INSTRUCTIONS.md section on debugging and help me fix it.
```

---

Remember: The agent works best when given specific tasks and reference documents, not when asked to read everything!
