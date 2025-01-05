export default async(c, util, data, cookie) => {
	const loggedIn = await util.loggedIn(c);
	if (!loggedIn) return c.redirect("/");

	const sessionId = await cookie.get(c);
	const session = await data.session.get(sessionId);
	const accountId = session.account_id;

	const account = await data.account.get(accountId);
	if (account.role === "RESIDENT") return c.json({ error: "No Permission." }, 400);

	let filter = c.req.param("filter");
	if (!["newest", "oldest"].includes(filter)) filter = "newest";

	console.log(filter);

	return c.text("hi");
}