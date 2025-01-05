import {
	getSignedCookie,
	setSignedCookie,
	deleteCookie
} from "hono/cookie";

const secret = process.env.COOKIE_SECRET;



export const set = async(c, value) => {
	await setSignedCookie(
		c, "session", value, secret, {
			httpOnly: true,
			sameSite: "Lax"
		}
	);
}

export const get = async(c) => {
	return await getSignedCookie(c, secret, "session");
}

export const destroy = (c) => {
	deleteCookie(c, "session");
}