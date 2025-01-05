import resident from "./report/resident";
import security from "./report/security";
import admin from "./report/admin";

export default async(c, util, data, cookie) => {
	const loggedIn = await util.loggedIn(c);
	if (!loggedIn) return c.redirect("/");

	const sessionId = await cookie.get(c);
	const session = await data.session.get(sessionId);

	const role = await data.account.getRole(session.account_id);
	if (!role) return c.html(util.error("Terdapat kesalahan pada server.", "/"));

	if (role === "RESIDENT") {
		return await resident(c, util, data, cookie);
	} else if (role === "ADMIN") {
		return await admin(c, util, data, cookie);
	} else {
		return await security(c, util, data, cookie);
	}
}