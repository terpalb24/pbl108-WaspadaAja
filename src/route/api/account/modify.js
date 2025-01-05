const requiredFormData = [
	"full-name", "phone-number",
	"password", "address"
];

export default async(c, util, data, cookie) => {
	try {

		const loggedIn = await util.loggedIn(c);
		if (!loggedIn) return c.json({ error: "Anda belum masuk akun." }, 400);

		const formData = await c.req.parseBody();
		if (!formData) return c.json({ error: "Form data tidak valid." }, 400);

		const dataIsInvalid = util.dataIsInvalid(formData, requiredFormData);
		if (dataIsInvalid) return c.json({ error: "Form data tidak valid." }, 400);



		const sessionId = await cookie.get(c);
		const session = await data.session.get(sessionId);
		const accountId = session.account_id;
		const account = await data.account.get(accountId);



		let fullName = formData["full-name"].trim(),
		phoneNumber = formData["phone-number"].trim(),
		password = formData["password"].trim(),
		address = formData["address"].trim();

		if (!fullName) fullName = account.full_name;
		if (!phoneNumber) phoneNumber = account.phone_number;
		if (!address) address = account.address;

		const isFullNameValid = util.validate.fullName(fullName);
		if (!isFullNameValid) return error(util, c, "Nama lengkap tidak valid");

		const isPhoneNumberValid = util.validate.phoneNumber(phoneNumber);
		if (!isPhoneNumberValid) return error(util, c, "Nomor WhatsApp tidak valid");

		const accountExists = await data.account.get(phoneNumber);
		if (accountExists && accountExists.id !== account.id) {
			return error(util, c, "Nomor WhatsApp tersebut sudah terdaftar pada akun lain.");
		}

		let hashedPassword;
		if (password) {
			const isPasswordValid = util.validate.password(password);
			if (!isPasswordValid) return error(util, c, "Kata sandi tidak valid");
			hashedPassword = await util.password.hash(password);
		} else {
			hashedPassword = account.password;
		}

		const isAddressValid = util.validate.address(address);
		if (!isAddressValid) return error(util, c, "Alamat tidak valid");



		await data.account.modify({
			accountId, fullName, phoneNumber, hashedPassword, address
		});

		return c.html(util.info("Settings", "Berhasil mengubah data akun.", "/settings"));

	} catch(err) {
		console.error(`${import.meta.file}\t${err.message}`);
		return c.html(util.error("Terdapat kesalahan pada server."), 500);
	}
}

function error(util, c, errorMsg) {
	return c.html(util.error(errorMsg, "/modify"), 400);
}