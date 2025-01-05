import security from "./manage-reports/security";
import admin from "./manage-reports/admin";

export default async(c, util, data, cookie) => {
	const loggedIn = await util.loggedIn(c);
	if (!loggedIn) return c.redirect("/");

	const sessionId = await cookie.get(c);
	const session = await data.session.get(sessionId);

	const accountId = session.account_id;
	const account = await data.account.get(accountId);

	if (account.role === "ADMIN") {
		return await admin(c, util, data, cookie);
	} else if (account.role === "SECURITY") {
		return await security(c, util, data, cookie);
	}
}