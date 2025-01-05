export default async(c, util, data, cookie) => {
	const loggedIn = await util.loggedIn(c);
	if (!loggedIn) return error(util, c, "Anda belum masuk akun.");

	const sessionId = await cookie.get(c);
	const session = await data.session.get(sessionId);
	const accountId = session.account_id;

	const account = await data.account.get(accountId);
	if (account.role === "RESIDENT") return c.json({ error: "No Permission." }, 400);

	
}