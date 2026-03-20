# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A React + Vite single-page application that lets users upload a JSON file and take a multiple-choice quiz. No backend, no routing, no testing framework.

## Commands

All commands must be run from the `json-quiz/` subdirectory:

```bash
cd json-quiz
npm run dev       # start dev server with HMR
npm run build     # production build to dist/
npm run preview   # preview production build
npm run lint      # ESLint
```

## Architecture

The app is a single-file state machine in `json-quiz/src/quiz.jsx`. `App.jsx` is a trivial wrapper that just renders `<Quiz />`.

`quiz.jsx` manages a `screen` state that drives four views:
- `upload` — drag-and-drop or file picker; validates JSON before proceeding
- `start` — shows quiz title/description and a start button
- `quiz` — one question at a time; select answer, confirm, then reveal correct/incorrect with optional explanation
- `results` — score, grade label, and review of incorrect answers

All state (current question index, selected answer, revealed state, accumulated answers map) lives in `useState` hooks inside the single `Quiz` component.

## JSON Quiz Format

```json
{
  "quiz": {
    "title": "My Quiz",
    "description": "Optional subtitle",
    "questions": [{
      "id": 1,
      "question": "Your question here?",
      "answers": { "a": "...", "b": "...", "c": "...", "d": "..." },
      "correct_answer": "a",
      "explanation": "Optional explanation shown after answering"
    }]
  }
}
```

All four answer keys (`a`, `b`, `c`, `d`) are required. `id` is optional and defaults to the question's 1-based index. `explanation` is optional.
