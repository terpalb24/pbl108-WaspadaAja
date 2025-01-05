export default async(c, util) => {
	const loggedIn = await util.loggedIn(c);
	if (loggedIn) return c.redirect("/dashboard");

	return c.html(util.html("register"));
}