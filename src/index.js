console.log(` _       __                           __      ___      _      
| |     / /___ __________  ____ _____/ /___ _/   |    (_)___ _
| | /| / / __ \`/ ___/ __ \\/ __ \`/ __  / __ \`/ /| |   / / __ \`/
| |/ |/ / /_/ (__  ) /_/ / /_/ / /_/ / /_/ / ___ |  / / /_/ / 
|__/|__/\\__,_/____/ .___/\\__,_/\\__,_/\\__,_/_/  |_|_/ /\\__,_/  
                 /_/                            /___/         \n`);



import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import * as util from "./handler/util";
import * as data from "./handler/database";
import * as cookie from "./handler/cookie";

import index from "./route/index";
import login from "./route/login";
import register from "./route/register";
import logout from "./route/logout";
import dashboard from "./route/dashboard";
import settings from "./route/settings";
import createReport from "./route/createReport";
import report from "./route/report";
import bulletin from "./route/bulletin";
import createPost from "./route/createPost";
import posts from "./route/posts";
import viewPost from "./route/viewPost";
import manageReports from "./route/manageReports";
import managePosts from "./route/managePosts";
import deleteReport from "./route/deleteReport";
import deletePost from "./route/deletePost";
import approvePost from "./route/approvePost";
import manageSecurity from "./route/manageSecurity";
import createSecurityAccount from "./route/createSecurityAccount";
import viewSecurityAccount from "./route/viewSecurityAccount";
import deleteSecurityAccount from "./route/deleteSecurityAccount";
import deleteAccount from "./route/deleteAccount";

import loginAPI from "./route/api/account/login";
import registerAPI from "./route/api/account/register";
import allByAccountIdAPI from "./route/api/report/get/allByAccountId";
import modifyAPI from "./route/api/account/modify";
import createReportAPI from "./route/api/report/create";
import dashboardPOST from "./route/non-api/dashboard";
import createPostAPI from "./route/api/post/create";
import manageReportsAPI from "./route/api/report/listAll";
import changeFilterManager from "./route/non-api/changeFilter";
import sendMessageAPI from "./route/api/report/sendMessage";
import updateStatusAPI from "./route/api/report/updateStatus";
import securityAccountAPI from "./route/api/securityAccount";



await data.init();

const app = new Hono()
.use("/static/*", serveStatic({ root: "./src" }))
.get("/favicon.ico", serveStatic({ path: "./src/static/favicon.ico" }))

.get("/", async(c) => {
	return await index(c, util);
})
.get("/login", async(c) => {
	return await login(c, util);
})
.get("/register", async(c) => {
	return await register(c, util);
})
.get("logout", async(c) => {
	return await logout(c, util, data, cookie);
})
.get("/dashboard", async(c) => {
	return await dashboard(c, util, data, cookie);
})
.get("/settings", async(c) => {
	return await settings(c, util, data, cookie);
})
.get("/create-report", async(c) => {
	return await createReport(c, util, data, cookie);
})
.get("/report/:reportId", async(c) => {
	return await report(c, util, data, cookie);
})
.get("/bulletin", async(c) => {
	return await bulletin(c, util, data);
})
.get("/post/create", async(c) => {
	return await createPost(c, util, data);
})
.get("/posts", async(c) => {
	return await posts(c, util, data, cookie);
})
.get("/post/view/:id", async(c) => {
	return await viewPost(c, util, data, cookie);
})
.get("/manage-reports", async(c) => {
	return await manageReports(c, util, data, cookie);
})
.get("/manage-posts", async(c) => {
	return await managePosts(c, util, data, cookie);
})
.get("/manage-reports/:page", async(c) => {
	return await manageReports(c, util, data, cookie);
})
.get("/delete-report/:id", async(c) => {
	return await deleteReport(c, util, data, cookie);
})
.get("/delete-post/:id", async(c) => {
	return await deletePost(c, util, data, cookie);
})
.get("/approve-post/:id", async(c) => {
	return await approvePost(c, util, data, cookie);
})
.get("/manage-security", async(c) => {
	return await manageSecurity(c, util, data, cookie);
})
.get("/create-security-account", async(c) => {
	return await createSecurityAccount(c, util, data, cookie);
})
.get("/manage-security/view/:id", async(c) => {
	return await viewSecurityAccount(c, util, data, cookie);
})
.get("/delete-security/:id", async(c) => {
	return await deleteSecurityAccount(c, util, data, cookie);
})
.get("/delete-acount", async(c) => {
	return await deleteAccount(c, util, data, cookie);
})

.post("/api/account/login", async(c) => {
	return await loginAPI(c, util, data, cookie);
})
.post("/api/account/register", async(c) => {
	return await registerAPI(c, util, data, cookie);
})
.get("/api/report/get/allByAccountId", async(c) => {
	return await allByAccountIdAPI(c, util, data, cookie);
})
.post("/api/account/modify", async(c) => {
	return await modifyAPI(c, util, data, cookie);
})
.post("/api/report/create", async(c) => {
	return await createReportAPI(c, util, data, cookie);
})
.post("/dashboard", async(c) => {
	return await dashboardPOST(c, util, data, cookie);
})
.post("/api/post/create", async(c) => {
	return await createPostAPI(c, util, data, cookie);
})
.post("/manage-reports/change-filter/:filter", async(c) => {
	return await changeFilterManager(c, util, data, cookie);
})
.post("/api/report/send-message", async(c) => {
	return await sendMessageAPI(c, util, data, cookie);
})
.post("/api/report/update-status", async(c) => {
	return await updateStatusAPI(c, util, data, cookie);
})
.post("/api/security-account/register", async(c) => {
	return await securityAccountAPI(c, util, data, cookie);
})



const port = parseInt(process.env.PORT) || 3000;
export default {
	port, fetch: app.fetch
};

const shutdown = (code) => {
	console.log(`\nWebsite shutdown. Exit code: ${code}`);
	process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
