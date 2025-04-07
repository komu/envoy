# Envoy

Envoy is a simple Claude-chat application with a Kotlin backend and a React frontend.

## Running

1. Create an Anthropic Account and an API key at https://console.anthropic.com/. You need a credit card to load at 
   least $5 to your account. 
2. Pass your API key in `ANTHROPIC_API_KEY` environment variable (e.g. create an IDEA run configuration for running
   Main from backend project or run `ANTHROPIC_API_KEY=my-key ./gradlew run` from CLI).
3. Run the `Frontend` run configuration (or `cd frontend; npm dev` in CLI)
4. Start chatting at http://localhost:5173/
