#!/bin/bash

# Check if ANTHROPIC_API_KEY is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "Warning: ANTHROPIC_API_KEY environment variable is not set."
  echo "The application will start, but you won't be able to chat with Claude."
  echo "Please set it using: export ANTHROPIC_API_KEY=your-api-key"
  echo "Then restart the application or refresh your browser."
fi

# Function to handle cleanup on exit
cleanup() {
  echo "Shutting down services..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}

# Set up trap to catch SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

echo "Building backend..."
./gradlew assemble

# Start the backend
echo "Starting backend..."
./gradlew run &

# Wait for backend to start
echo "Waiting for backend to initialize..."
sleep 5

# Start the frontend
echo "Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Application is running!"
echo "Frontend: http://localhost:5173/"
echo "Press Ctrl+C to stop all services"

# Wait for both processes to finish
wait $BACKEND_PID $FRONTEND_PID
