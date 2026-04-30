# How we work

1. Pick your assigned issue from the project board
2. Create a branch: `git checkout -b feature/short-description`
3. Do the work. Commit often with clear messages.
4. Push: `git push origin your-branch-name`
5. Open a PR on GitHub — link it to the issue with "Closes #N"
6. Add screenshots for any visual changes
7. Tick the acceptance criteria checklist in the PR body
8. Move the issue to "In Review" on the board
9. Wait for review before merging anything
10. Never push directly to main

__________________________________________________________________________________________________
How CollaboratorS WORK TicketS
___________________________________________________________________________________________________

1. Pick Your assigned issue from the board
##Go to the Project board, find YOUR next task in Todo, read the issue fully.

2. Create a branch from main
git checkout main
git pull origin main
git checkout -b feature/bottom-nav-layout
##Branch name should loosely match the issue title.

3. Do the work, commit regularly
git add .
git commit -m "feat: render BottomNav in layout.tsx"
##Commits should be small and descriptive. Not one giant commit at the end.
4. Push the branch
git push origin feature/bottom-nav-layout
___________________________________________________________________
 Open a Pull Request
___________________________________________________________________

GitHub will show a prompt to open a PR when they push. They click it and fill in:

Title: [TASK 2] Wire BottomNav into app layout
Body:

markdown## What I did
Imported BottomNav into layout.tsx and rendered it 
conditionally based on the route.

## Screenshots
[paste before/after screenshots here]

## Acceptance criteria checklist
- [x] BottomNav renders on /dashboard, /mesocycles, /templates, /exercises, /more
- [x] BottomNav does NOT render on auth/onboarding routes
- [x] Active route highlighted
- [x] No layout shift on mobile

## Closes #2Move the issue on the board
They drag their issue from In Progress to In Review once the PR is open