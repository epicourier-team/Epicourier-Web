## GitHub Issue Editing Guidelines (using gh with a temporary Markdown file)

Goal: keep web rendering correct, content traceable, and the workflow reusable.

Operational notes:

- Store the issue body in a temporary Markdown file to avoid `\n` escape issues.
- Update issues with `--body-file`; include `--title` if you also rename the issue.
- Reference concrete paths in the body (router/service/schemas/function names).
- Choose the correct label from the template.
- Cross-link related issues and task identifiers (for example `#106`, `BE-04-001`).
- Confirm milestone and state before editing:
  - `gh issue list --state all --milestone "<milestone name>"`
  - `gh issue list --state open --milestone "<milestone name>"`

Recommended workflow (temporary file):

```bash
BODY=$(mktemp)
cat > "$BODY" << 'MD'
<issue body using template>
MD

gh issue edit <number> --title "<new title>" --body-file "$BODY"
rm -f "$BODY"
```

Do / Don’t:

- Do: use `--body-file`, include concrete paths, add cross-links.
- Don’t: write multi-line content directly inside `--body` with embedded `\n`.

---

## Templates (for issue bodies)

See `.github/ISSUE_TEMPLATE`.
