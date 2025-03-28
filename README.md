# [Your Project Name] ✨

A web application built with Next.js for creating, managing, and filling dynamic forms with robust authentication and validation.

---

## Table of Contents

*   [Introduction](#introduction)
*   [Features](#features-)
*   [Tech Stack](#tech-stack-)
*   [Getting Started](#getting-started-)
    *   [Prerequisites](#prerequisites)
    *   [Installation](#installation)
    *   [Environment Variables](#environment-variables)
    *   [Database Setup](#database-setup)
    *   [Running the Development Server](#running-the-development-server)
*   [User Flow](#user-flow-)
    *   [Authentication](#authentication-%EF%B8%8F)
    *   [Form Creation](#form-creation-)
    *   [Form Filling & Validation](#form-filling--validation-)
    *   [Form Submission](#form-submission-)
    *   [User Roles](#user-roles-)
*   [Database Schema](#database-schema-)
    *   [Models](#models)
    *   [Enums](#enums)
*   [Deployment](#deployment-)
*   [Learn More (Next.js)](#learn-more-nextjs-)
*   [Contributing](#contributing-)
*   [License](#license-)

## Introduction

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app). It provides a platform for users to create custom forms with various question types, share them, and collect responses. Key functionalities include user authentication, dynamic form building, input validation, and data storage using Prisma.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font).

## Features ✨

*   **Authentication:** Secure sign-in/sign-up using Google OAuth or Email/Password (via NextAuth.js).
*   **Form Creation:** Users can create forms with titles and descriptions.
*   **Dynamic Questions:** Supports multiple question types: Text, Dropdown, Checkbox, Radio, Date, File Upload, Rating Scale, Email, Number.
*   **Input Validation:** Robust, dynamic validation using Zod schemas based on question type and configuration.
*   **Form Filling:** User-friendly interface (`FormFiller` component) for completing forms.
*   **Response Management:** Stores form responses linked to users and forms.
*   **User Roles:** Basic role management (`USER`, `ADMIN`).
*   **Database:** Uses Prisma ORM for database interactions.

## Tech Stack 🔧

*   **Framework:** [Next.js](https://nextjs.org/)
*   **Authentication:** [NextAuth.js](https://next-auth.js.org/)
*   **Database ORM:** [Prisma](https://www.prisma.io/)
*   **Validation:** [Zod](https://zod.dev/)
*   **Styling:** (Specify if using Tailwind CSS, CSS Modules, etc.)
*   **Font:** [Geist](https://vercel.com/font) (via `next/font`)
*   **Deployment:** [Vercel](https://vercel.com/) (Recommended)

## Getting Started 🚀

Follow these instructions to set up and run the project locally.

### Prerequisites

*   [Node.js](https://nodejs.org/) (Version 18.x or later recommended)
*   Package manager: [npm](https://npmjs.com/), [yarn](https://yarnpkg.com/), [pnpm](https://pnpm.io/), or [bun](https://bun.sh/)
*   A database supported by Prisma (e.g., PostgreSQL, MySQL, SQLite)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-project-repo.git
    cd your-project-repo
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    # or
    bun install
    ```

### Environment Variables

1.  Create a `.env.local` file in the root of the project.
2.  Add the necessary environment variables:
    ```plaintext
    # Database Connection URL
    DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

    # NextAuth.js Secrets & Provider Credentials
    NEXTAUTH_SECRET="YOUR_NEXTAUTH_SECRET" # Generate one using: openssl rand -base64 32
    NEXTAUTH_URL="http://localhost:3000"

    # Google OAuth Credentials (if using Google Provider)
    GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
    GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"

    # Add any other required environment variables for your setup
    ```

### Database Setup

1.  Ensure your database server is running and accessible via `DATABASE_URL`.
2.  Apply database migrations:
    ```bash
    npx prisma migrate dev
    ```
3.  (Optional) Seed the database if a seed script exists:
    ```bash
    npx prisma db seed
    ```

### Running the Development Server

1.  Start the Next.js development server:
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    # or
    bun dev
    ```

2.  Open [http://localhost:3000](http://localhost:3000) with your browser.

Edit `app/page.tsx` to modify the main page; changes will auto-update.

## User Flow 👤

### Authentication 🔑

*   **Google Sign-In:** Uses `GoogleProvider` via NextAuth.js.
*   **Credentials Sign-In:** Uses `CredentialsProvider` with Prisma database check.
*   **Sign-In Page:** Located at `/auth/signin` (configurable).

### Form Creation 📝

*   Authenticated users create forms with `title`, `description`, and `published` status.
*   Forms are linked to the creator `User`.
*   Various `Question` types can be added.

### Form Filling & Validation ✅

*   `FormFiller` component handles form display and input.
*   Dynamic validation via Zod based on `QuestionType` and settings (`required`, `minLength`, etc.).
*   Supported types: `TEXT`, `DROPDOWN`, `CHECKBOX`, `RADIO`, `DATE`, `FILE`, `RATING`, `EMAIL`, `NUMBER`.

### Form Submission 📤

*   `FormFiller` manages submission.
*   Data validated with Zod before saving as `Response` records.

### User Roles 🎭

*   `Role` enum: `USER` (default), `ADMIN`. Suggests potential permission levels.

## Database Schema 💾

Defined in `prisma/schema.prisma`.

### Models

*   **`User`**: Stores user info, credentials, roles, relations (forms, responses, accounts, sessions).
*   **`Form`**: Represents a form with title, description, questions, responses, creator link.
*   **`Question`**: Defines a question within a form (label, type, validation rules, options, form link).
*   **`Option`**: Represents a choice for specific question types (label, question link).
*   **`Response`**: Stores a single form submission (form link, user link, answers).
*   **`Answer`**: Stores the value for a specific question within a response (question link, response link, value).
*   **`Account` & `Session`**: Standard NextAuth.js models for OAuth and session management.

### Enums

*   **`QuestionType`**: `TEXT`, `DROPDOWN`, `CHECKBOX`, `RADIO`, `DATE`, `FILE`, `RATING`, `EMAIL`, `NUMBER`.
*   **`Role`**: `USER`, `ADMIN`.

## Deployment 🌐

Deploy using the [Vercel Platform](https://vercel.com/new).

**Deployment Steps:**

1.  Configure required environment variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, etc.) in Vercel project settings.
2.  Ensure the database is accessible from Vercel.
3.  Set the `NEXTAUTH_URL` environment variable to your production domain.

See the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Learn More (Next.js) 📚

*   [Next.js Documentation](https://nextjs.org/docs)
*   [Learn Next.js](https://nextjs.org/learn)
*   [Next.js GitHub repository](https://github.com/vercel/next.js)

## Contributing 🤝

Contributions are welcome. Please open issues or submit pull requests for any improvements or bug fixes.

## License 📄

This project is licensed under the [MIT License](LICENSE).