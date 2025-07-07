## How to run locally

1. **Start the backend**

    ```bash
    cd backend
    npm install
    npm run dev
    ```

2. **Start the frontend**

    ```bash
    cd ../frontend
    npm install
    npm run dev
    ```

3. **Open the app**

    - Visit [http://localhost:5173](http://localhost:5173) in your browser.

## How would I deploy it to GCP?

**A. Cloud Run (The Fast Way):**
- Build Docker images for the backend (and frontend, if you want to deploy it separately).
- Push them to Google Artifact Registry.
- Deploy to Cloud Run with a single command. It handles scaling and HTTPS, so you don’t need to think about servers.
- Use Cloud SQL (managed Postgres) for your DB—just update your connection string and you’re good.
- Connect your frontend to your backend’s Cloud Run URL.
- *Honestly, this is the approach I’d recommend for almost every MVP or take-home. It’s simple and just works.*

**B. GKE (The Production Way):**
- Build the same Docker images.
- Set up a GKE (Google Kubernetes Engine) cluster.
- Write some Kubernetes YAML (deployments, services, ingress) for each app.
- Use Cloud SQL as your DB, and hook up secrets/connection securely.
- Great for complex, multi-service, or production-scale projects, but way more moving parts than Cloud Run.
- *If you’re running something big, or want full control, GKE is the big boy pants way. But for this project? Cloud Run should be enough.*


# Zapp Coding Test

We’ve got some data in a CSV file and we want to transfer it over to a database and add validation and checks to any changes made to the data. We should be able to add/edit/delete any rows added.

You have been given a sample CSV to test with.

We want you to build a full-stack app using the requirements below and attach a README file. Your README file should contain a brief overview of the approach you took and instructions on how to run it locally. Please also include a small section on how you would set this up and deploy in a cloud environment and why.

We encourage you to spend no more than 3 hours on this test.

## Requirements
- Use nodejs and typescript
- Create a UI for uploading the CSV and performing the above mentioned operations
- Create an backend for handling persistence
- We should be able to run the app locally with your given instructions
- Your code should be hosted on a github repo and shared with us, if you have any issues with this, you can also submit a Google drive link to your code.

You are free to choose whatever framework and tools you wish to use, you can if you wish, use sqllite DB for simplicity.

## What are we looking for

- Tech decisions and any assumptions you made
- Readable and maintanable code
- Approaches to error handling
- Code structure