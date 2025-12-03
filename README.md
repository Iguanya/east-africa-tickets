# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/96e62f66-da3d-44ba-be5f-b0a7b89c97b8

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/96e62f66-da3d-44ba-be5f-b0a7b89c97b8) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Run the project locally with MySQL

1. **Provision MySQL**
   - Create a database named `east_africa_tickets`
   - Run the schema at `server/schema.sql` (`mysql -u root -p < server/schema.sql`)

2. **Configure environment variables**
   - Copy the variables below into a `.env` file in the project root and update as needed:

     ```
     MYSQL_HOST=localhost
     MYSQL_PORT=3306
     MYSQL_USER=root
     MYSQL_PASSWORD=
     MYSQL_DATABASE=east_africa_tickets
     MYSQL_CONNECTION_LIMIT=10
     JWT_SECRET=super-secret-key
     CLIENT_ORIGIN=http://localhost:5173
     API_PORT=4000
     ```

3. **Install dependencies**

   ```sh
   npm install
   ```

4. **Start the local API server (Express + MySQL)**

   ```sh
   npm run server
   ```

5. **In another terminal, run the Vite frontend**

   ```sh
   npm run dev
   ```

The frontend talks to the API at `http://localhost:4000/api` by default. Update `VITE_API_URL` if you need a different origin.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/96e62f66-da3d-44ba-be5f-b0a7b89c97b8) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
