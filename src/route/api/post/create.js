const requiredFormData = [
	"title", "caption", "image-1", "image-2", "image-3"
];

export default async(c, util, data, cookie) => {

	try	{

		const loggedIn = await util.loggedIn(c);
		if (!loggedIn) return error(util, c, "Anda belum masuk akun.");

		const formData = await c.req.parseBody();
		if (!formData) return error(util, c, "Form data tidak valid.");

		const dataIsInvalid = util.dataIsInvalid(formData, requiredFormData);
		if (dataIsInvalid) return error(util, c, "Form data tidak valid.");

		const sessionId = await cookie.get(c);
		const session = await data.session.get(sessionId);
		const authorId = session.account_id;



		const { title, caption } = formData;
		if (!title || !caption) {
			return error(util, c, "Form data tidak valid.");
		}

		const images = [
			{ id: 1, file: formData["image-1"] },
			{ id: 2, file: formData["image-2"] },
			{ id: 3, file: formData["image-3"] }
		];



		const result = await util.saveImages({
			tableName: "post_images", images
		});

		let postId;
		if (result.error) {
			return error(util, c, result.error);
		} else if (result.success) {

			postId = await util.generate.postId();
			for await (let imageName of result.imagesName) {
				await data.post.insertImage(postId, imageName);
			}

		}

		await data.post.create({
			postId, authorId, title, caption
		});

		return c.html(util.info(
			"Berhasil",
			"Postingan buletin berhasil dikirim dan menunggu persetujuan Admin.",
			`/post/view/${postId}`
		));

	} catch(err) {
		console.error(`${import.meta.file}\t${err.message}`);
		return error(util, c, "Terdapat kesalahan pada server.");
	}
}

function error(util, c, errorMsg) {
	return c.html(util.error(errorMsg, "/create-post"), 400);
}