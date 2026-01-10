---
name: pm
description: Project management mode - analyzes GitHub issues for duplicates/obsolete items and suggests next work items from kanban board
---

# Project Manager Mode

Analyze the project's GitHub issues and kanban board to provide project management insights and recommendations.

## Workflow

When user runs `/pm`:

### Step 1: Gather Issue Data

1. **Fetch all open issues** from the current repository:
   ```bash
   gh issue list --limit 100 --json number,title,labels,body,createdAt,updatedAt,state
   ```

2. **Fetch closed issues** (recent ones to check for duplicates):
   ```bash
   gh issue list --state closed --limit 50 --json number,title,labels,body,createdAt,updatedAt,state
   ```

### Step 2: Analyze Issues

**Check for duplicates:**
- Compare issue titles and descriptions
- Look for similar keywords, features, or bug descriptions
- Identify issues that could be merged or closed as duplicates
- Note which issue should be kept (usually the older or more detailed one)

**Identify obsolete issues:**
- Check if issues reference deprecated features or old architecture
- Look for issues that have been inactive for extended periods
- Identify issues that may have been resolved but not closed
- Check if issue requirements conflict with current project direction

**Create analysis summary:**
```
## Issue Analysis

### Duplicates Found:
- Issue #X and #Y: [brief description of overlap]
  Recommendation: Close #Y in favor of #X (more detailed)

### Potentially Obsolete:
- Issue #Z: [reason why it might be obsolete]
  Last updated: [date]
  Recommendation: [close/update/clarify]

### Issues Needing Attention:
- Issue #A: [why it needs attention]
```

### Step 3: Access Kanban Board

1. **Fetch project data:**
   ```bash
   gh project list --owner aleph-garden --limit 10 --format json
   ```

2. **Get project items** (if project number is found):
   ```bash
   gh project item-list [PROJECT_NUMBER] --owner aleph-garden --format json --limit 100
   ```

3. **Analyze board state:**
   - Count items in each column (Backlog, Todo, In Progress, Done)
   - Identify high-priority items not yet started
   - Check for blockers or stalled items in "In Progress"
   - Look for items that have been in progress too long

### Step 4: Prioritization Recommendations

**Analyze and recommend next work items based on:**
1. **Priority labels** (priority:high, priority:medium, priority:low)
2. **Dependencies** (what needs to be done first)
3. **Current board state** (what's blocked, what's ready)
4. **Project coherence** (related features that should be done together)
5. **Technical foundation** (infrastructure needed for other features)

**Create recommendation:**
```
## Recommended Next Work Items

### Ready to Start (Priority Order):
1. Issue #X: [title]
   - Priority: [high/medium/low]
   - Why: [business value, unblocks other work, etc.]
   - Status: [current column on board]
   - Estimated complexity: [simple/moderate/complex based on description]

2. Issue #Y: [title]
   - Priority: [high/medium/low]
   - Why: [reasoning]
   - Status: [current column]
   - Estimated complexity: [complexity]

### Blocked/Needs Clarification:
- Issue #Z: [title]
  Blocker: [what's blocking it]
  Action: [what needs to happen]

### Suggested Groupings:
- [Feature area]: Issues #A, #B, #C should be implemented together
  Reason: [why they're related]
```

### Step 5: Interactive Discussion

**Ask user:**
```
Based on this analysis:

1. Should I close any duplicate/obsolete issues?
   - Duplicates: [list issue numbers to close]
   - Obsolete: [list issue numbers to close or update]

2. Which work item would you like to tackle next?
   [Show top 3-5 recommendations with brief context]

3. Any issues that need more discussion or clarification?
```

**Wait for user input** before taking any actions.

## Actions You Can Take

After user confirms:

- **Close duplicate issues**: Use `gh issue close` with appropriate comment
- **Update obsolete issues**: Add clarifying comments or close them
- **Move board items**: Update project status if needed
- **Start implementation**: Launch into /tdd or direct implementation of chosen item

## Example Output

```
# Project Status Analysis

## Repository: aleph-garden/mcp-server

### Open Issues: 15
### In Progress: 2
### Recently Closed: 8

## Duplicate Issues Found

🔄 Issue #45 and #52 both request "SPARQL query optimization"
   - #45 is more detailed with specific use cases
   - **Recommend**: Close #52, reference #45

## Potentially Obsolete Issues

⚠️  Issue #23: "Add REST API endpoints"
   - Last updated: 3 months ago
   - Current architecture uses MCP tools (not REST)
   - **Recommend**: Close as out of scope, or clarify if still needed

## Kanban Board Status

📊 Project: Aleph Wiki Development
- Backlog: 8 items
- Todo: 5 items
- In Progress: 2 items (⚠️ Issue #34 has been in progress for 2 weeks)
- Done: 47 items

## Recommended Next Work

### 🔴 High Priority - Ready to Start:

1. **Issue #56: Add WAC (Web Access Control) integration**
   - Label: priority:high, feature, auth
   - Why: Core security feature, blocks several other features
   - Status: In "Todo" column
   - Complexity: Moderate (requires auth flow changes)

2. **Issue #48: Implement resource creation with PUT**
   - Label: priority:high, feature, mcp-server
   - Why: Critical missing functionality for write operations
   - Status: In "Todo" column
   - Complexity: Simple (extends existing code)

### 🟡 Medium Priority:

3. **Issue #61: Add federated SPARQL queries**
   - Label: priority:medium, feature, sparql
   - Why: Enables cross-pod queries, good after #56 is done
   - Status: In "Backlog"
   - Complexity: Complex (requires multi-endpoint coordination)

### ⏸️  Blocked/Stalled:

- **Issue #34: Implement notification system**
  - In progress for 2 weeks
  - May be blocked or abandoned
  - **Action**: Check status, move back to todo if needed

---

What would you like to do?
1. Start on Issue #56 (WAC integration)
2. Start on Issue #48 (PUT resource creation)
3. Address the stalled Issue #34
4. Close duplicate/obsolete issues first
5. Something else
```

## Important Notes

- **Never close issues automatically** - always confirm with user first
- **Be conservative** with obsolete detection - when in doubt, ask
- **Consider dependencies** - don't recommend work that's blocked
- **Check labels** - respect priority labels user has set
- **Look at recent activity** - active discussions indicate importance
- **Reference file paths** - when mentioning code, use `file:line` format

## Error Handling

If GitHub CLI fails:
- Check authentication: `gh auth status`
- Verify repository access
- Fall back to manual analysis if needed
- Inform user of limitations

If project board isn't accessible:
- Continue with issue analysis only
- Ask user for project number or URL
- Suggest manual board review
