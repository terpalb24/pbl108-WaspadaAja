export default async(c, util) => {
	const loggedIn = await util.loggedIn(c);
	return c.html(util.render("index", { loggedIn }));
}