export default async(c, util, data, cookie) => {
	const loggedIn = await util.loggedIn(c);
	if (!loggedIn) return c.redirect("/");

	const sessionId = await cookie.get(c);
	const session = await data.session.get(sessionId);

	const accountId = session.account_id;
	const account = await data.account.get(accountId);



	// delete posts and post images
	const userPosts = await data.post.getAllByAccountId(accountId);
	if (userPosts.length) {
		const userPostIds = userPosts.map(x => x.post_id);

		for (let postId of userPostIds) {

			var postImages = await data.post.getImages(postId);
			if (postImages.length) {

				// delete image files and images data from database
				for (let image of postImages) {
					await util.deleteImageFromStorage("posts", image.file_name);
					await data.post.deleteImages(image.post_id);
				}

			}

			// delete post
			await data.post.delete(postId);

		}
	}



	// delete reports and report images
	const userReports = await data.post.getAllByAccountId(accountId);
	if (userReports.length) {
		const userReportIds = userReports.map(x => x.report_id);

		for (let reportId of userReportIds) {

			var reportImages = await data.post.getImages(reportId);
			if (reportImages.length) {

				// delete image files and images data from database
				for (let image of reportImages) {
					await util.deleteImageFromStorage("reports", image.file_name);
					await data.post.deleteImages(image.post_id);
				}

			}

			// delete post
			await data.report.delete(reportId);

		}
	}



	// delete sessions
	await data.session.deleteAll(accountId);

	// delete account
	await data.account.delete(accountId);

	return await util.info(
		"Akun Terhapus",
		"Akun dan data yang terkait dengan akun telah dihapuskan.",
		"/"
	);
}
