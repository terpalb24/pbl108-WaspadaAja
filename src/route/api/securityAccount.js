const requiredFormData = [
	"full-name", "phone-number",
	"password", "address"
];

export default async(c, util, data, cookie) => {
	try {

		const loggedIn = await util.loggedIn(c);
		if (!loggedIn) return c.json({ error: "Anda sudah masuk akun." }, 400);

		const formData = await c.req.parseBody();
		if (!formData) return c.json({ error: "Form data tidak valid." }, 400);

		const dataIsInvalid = util.dataIsInvalid(formData, requiredFormData);
		if (dataIsInvalid) return c.json({ error: "Form data tidak valid." }, 400);



		const sessionId = await cookie.get(c);
		const session = await data.session.get(sessionId);

		const checkRole = await data.account.getRole(session.account_id);
		if (!checkRole) return c.html(util.error("Terdapat kesalahan pada server.", "/"));
		if (checkRole !== "ADMIN") {
			return c.html(u6til.error("Kamu tidak bisa melihat halaman ini.", "/"));
		}


		const fullName = formData["full-name"].trim(),
		phoneNumber = formData["phone-number"].trim(),
		password = formData["password"].trim(),
		address = formData["address"].trim();

		const isFullNameValid = util.validate.fullName(fullName);
		if (!isFullNameValid) return error(util, c, "Nama lengkap tidak valid");

		const isPhoneNumberValid = util.validate.phoneNumber(phoneNumber);
		if (!isPhoneNumberValid) return error(util, c, "Nomor WhatsApp tidak valid");

		const isPasswordValid = util.validate.password(password);
		if (!isPasswordValid) return error(util, c, "Kata sandi tidak valid");

		const isAddressValid = util.validate.address(address);
		if (!isAddressValid) return error(util, c, "Alamat tidak valid");

		const accountExists = await data.account.get(phoneNumber);
		if (accountExists) {
			return error(util, c, "Akun sudah terdaftar menggunakan nomor WhatsApp tersebut.");
		}



		const role = "SECURITY";
		const accountId = util.generate.accountId();
		const hashedPassword = await util.password.hash(password);

		await data.account.create({ accountId, fullName, phoneNumber, hashedPassword, role, address });

		return c.html( util.info("Berhasil", "Akun petugas berhasil dibuat.", "/manage-security") );

	} catch(err) {
		console.error(`${import.meta.file}\t${err.message}`);
		return c.html(util.error("Terdapat kesalahan pada server."), 500);
	}
}

function error(util, c, errorMsg) {
	return c.html(util.error(errorMsg, "/create-security"), 400);
}