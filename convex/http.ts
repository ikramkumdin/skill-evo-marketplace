import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpRequestAgentAuth, httpPollAgentAuth } from "./agentAuth";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({ path: "/api/agent/request", method: "POST", handler: httpRequestAgentAuth });
http.route({ path: "/api/agent/poll", method: "GET", handler: httpPollAgentAuth });

export default http;
