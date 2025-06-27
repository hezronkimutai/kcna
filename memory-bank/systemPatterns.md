# System Patterns

## System Architecture
- **Frontend Only:** The application is a static, client-side web app.
- **Data Source:** Quiz questions are stored in a CSV file (`quiz.csv`) and loaded by the frontend.
- **Deployment:** Hosted on Vercel as a static site ([https://kcna.vercel.app/](https://kcna.vercel.app/)).

## Key Technical Decisions
- No backend or server-side logic; all logic runs in the browser.
- CSV is used for quiz data to simplify content updates and avoid database dependencies.
- Deployment uses a static hosting platform for simplicity and scalability.

## Design Patterns in Use
- Separation of content (CSV) and presentation (HTML).
- Progressive enhancement: works in any modern browser without plugins.

## Component Relationships
- `index.html` loads and renders the quiz UI.
- `quiz.csv` provides the data consumed by the frontend logic.

## Critical Implementation Paths
- Load and parse CSV data in the browser.
- Render quiz questions and handle user interactions.