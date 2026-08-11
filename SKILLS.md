# AI Agent Skills & Tool Execution Protocol

## 1. Allowed Terminal Commands
When operating in Agent Mode, you are authorized to run these exact npm scripts from the monorepo root:

- **Type Check & Linting**: `npm run lint` or `npx tsc --noEmit`
- **Build Verification**: `npm run build`
- **Package Installation**: `npm install <package-name> --save` (must specify package scope, e.g., inside `apps/web` or `packages/core`)
- **Development Server**: `npm run dev`

## 2. Autonomous Verification Loop
Before marking any task as "complete" or asking the developer for feedback, you **must** execute this sequence:

1. **Format Code**: Ensure formatting complies with `.prettierrc`.
2. **Type Check**: Run `npx tsc --noEmit` across the affected workspace package.
3. **Build Check**: Verify that `npm run build` passes without errors or warnings.
4. **Self-Correction**: If type errors or build failures occur, inspect the error output, fix the code, and re-run verification up to 3 times before stopping.
5. **Commit Message Rule**: Use a task-specific commit message such as `feat(web): complete TASK-204 - read-only client reviewer view`.
6. **Do not stop**: After a successful commit and push, immediately read the next unchecked task in `/TASKS.md` and continue without prompting the user.
7. **Task description requirement**: The commit message MUST contain the actual task ID and a real description of the task, not a generic label like "update" or "fix".

## 3. Package Management Rules
- Never install global npm packages.
- Always add dependencies to the specific application or package `package.json` where they are consumed.
- Do not modify `package-lock.json` manually; always use `npm install`.

## 4. Git Auto-Commit & Push Protocol
After successfully passing `npx tsc --noEmit` and `npm run build`, execute these terminal commands autonomously:

1. `git add .`
2. `git commit -m "feat(<scope>): complete <TASK-ID> - <task description>"`
3. `git push origin main`