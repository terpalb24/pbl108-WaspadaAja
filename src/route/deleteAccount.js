export default async(c, util, data, cookie) => {
	try {
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
					var imagesFileName = postImages.map(x => x.file_name);
					await util.deleteImageFromStorage("posts", imagesFileName);
					await data.post.deleteImages(postId);

				}

				// delete post
				await data.post.delete(postId);

			}
		}



		// delete reports and report images
		const userReports = await data.report.get.fetchAll(accountId);
		if (userReports.length) {
			const userReportIds = userReports.map(x => x.report_id);

			for (let reportId of userReportIds) {

				var reportImages = await data.report.getImages(reportId);
				if (reportImages.length) {

					// delete image files and images data from database
					var imagesFileName = reportImages.map(x => x.file_name);
					await util.deleteImageFromStorage("reports", imagesFileName);
					await data.report.deleteImages(reportId);

				}

				// delete report
				console.log(reportId);
				await data.report.delete(reportId);

			}
		}



		// delete sessions
		await data.session.deleteAll(accountId);

		// delete account
		await data.account.delete(accountId);

		return c.html(await util.info(
			"Akun Terhapus",
			"Akun dan data yang terkait dengan akun telah dihapuskan.",
			"/"
		));
	} catch(err) {
		console.error(err);
	}
}
