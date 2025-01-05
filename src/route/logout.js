import resident from "./dashboard/resident";

export default async(c, util, data, cookie) => {
	const loggedIn = await util.loggedIn(c);
	if (!loggedIn) return c.redirect("/");

	const sessionId = await cookie.get(c);
	await data.session.delete(sessionId);
	cookie.destroy(c);
	return c.redirect("/");
}