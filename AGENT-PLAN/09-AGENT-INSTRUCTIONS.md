# Agent Instructions

## 🤖 How to Work with This Project

### Starting Your Session

```
I'm working on the Eatsential project.
Please read /docs/AGENT-PLAN/08-SPRINT-TASKS.md
I'll be working on task [TASK-ID]
```

### Understanding Context

1. **First Time**: Read documents in this order:
   - `00-PROJECT-OVERVIEW.md` - Project vision
   - `01-TECH-STACK.md` - Technologies used
   - `08-SPRINT-TASKS.md` - Find your task

2. **Returning**: Just read:
   - `08-SPRINT-TASKS.md` - Check task updates
   - Relevant pattern doc (Frontend/Backend)

### Task Execution

#### Step 1: Understand the Task

```
Please analyze task [TASK-ID] and:
1. List all files I need to create/modify
2. Identify any dependencies
3. Show me the implementation plan
```

#### Step 2: Check Existing Code

```
Before implementing, please:
1. Search for similar patterns in the codebase
2. Check if any utilities already exist
3. Review the test patterns
```

#### Step 3: Implement

```
Now implement [specific part] following:
1. The project patterns
2. The acceptance criteria
3. Include proper error handling
```

#### Step 4: Test

```
Create tests for this implementation:
1. Unit tests for all functions
2. Integration tests for API endpoints
3. Edge cases for health-critical features
```

### Code Quality Rules

#### Always Include:

- Type definitions (TypeScript/Python)
- Error handling
- Input validation
- Logging (backend)
- Comments for complex logic

#### Never Include:

- `console.log` (use proper logging)
- `any` type (be specific)
- Hardcoded values (use config)
- Skipped tests
- Security vulnerabilities

### Health Safety Requirements 🏥

#### For ANY Health-Related Feature:

1. **Validate Everything**

```python
# Always validate health data
if allergen not in APPROVED_ALLERGENS:
    raise ValueError(f"Invalid allergen: {allergen}")
```

2. **Fail Safe**

```typescript
// When uncertain, exclude
if (!canConfirmAllergenFree) {
  return { safe: false, reason: 'Cannot verify allergen status' };
}
```

3. **Prominent Warnings**

```typescript
// Severe allergies need visual emphasis
{severity === 'LIFE_THREATENING' && (
  <Alert className="bg-red-600 text-white animate-pulse">
    ⚠️ LIFE-THREATENING ALLERGY: {allergen}
  </Alert>
)}
```

### Common Patterns

#### API Error Handling

```python
try:
    result = await service_function()
    return {"success": True, "data": result}
except ValidationError as e:
    raise HTTPException(400, detail=str(e))
except NotFoundError as e:
    raise HTTPException(404, detail=str(e))
except Exception as e:
    logger.error(f"Unexpected error: {e}")
    raise HTTPException(500, detail="Internal server error")
```

#### Form Validation

```typescript
const schema = z.object({
  field: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
});

const form = useForm({
  resolver: zodResolver(schema),
});
```

#### Testing Pattern

```python
# Arrange
test_data = {"field": "value"}

# Act
response = await client.post("/endpoint", json=test_data)

# Assert
assert response.status_code == 201
assert response.json()["success"] is True
```

### Git Workflow

#### Branch Naming

```bash
feature/[TASK-ID]-brief-description
bugfix/[TASK-ID]-brief-description
```

#### Commit Messages

```
feat(scope): implement feature per TASK-ID

- Add specific functionality
- Include error handling
- Add comprehensive tests

Resolves: TASK-ID
```

#### PR Description

```markdown
## Task: [TASK-ID]

### Changes

- Implemented [feature]
- Added tests for [scenarios]
- Updated documentation

### Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

### Screenshots

[If UI changes]
```

### Debugging Help

#### When Stuck

```
I'm stuck on [problem]. Can you:
1. Explain what's happening
2. Show me similar code in the project
3. Suggest a solution
```

#### Common Issues

**Import Errors**:

```
Check:
1. Is the module installed? (package.json/pyproject.toml)
2. Is the import path correct?
3. Do you need to run npm install or uv sync?
```

**Type Errors**:

```
Check:
1. Are all types defined?
2. Are you using the correct type?
3. Do the types match between frontend/backend?
```

**Test Failures**:

```
Check:
1. Is the test data valid?
2. Are you mocking external services?
3. Is the database in the correct state?
```

### Performance Considerations

#### Frontend

- Use React.memo for expensive components
- Implement virtual scrolling for long lists
- Lazy load routes and images
- Debounce user input

#### Backend

- Use database indexes on searched fields
- Implement caching for repeated queries
- Paginate large result sets
- Use async operations

### Security Checklist

Before completing any task:

- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] All inputs validated
- [ ] Authentication required where needed
- [ ] Sensitive data not logged
- [ ] Rate limiting on public endpoints

### Final Checklist

Before marking task complete:

- [ ] Code works as expected
- [ ] Tests pass with good coverage
- [ ] No linting errors
- [ ] Documentation updated
- [ ] Security considered
- [ ] Performance acceptable
- [ ] PR created and ready

---

**Remember**: When in doubt, ask for clarification. Better to over-communicate than make wrong assumptions, especially for health-critical features!
