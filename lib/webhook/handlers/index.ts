// Import all handlers to register them
// Each handler file should register itself when imported
import "./example";

// Export handler registration utilities
export { dispatchWebhook, registerHandler } from "../dispatcher";
