const elById = (id) => document.getElementById(id);
const elByName = (name) => document.getElementsByName(name)[0];

const images = {
	img1: elByName("image-1"),
	img2: elByName("image-2"),
	img3: elByName("image-3")
}
const labels = {
	img1: elById("image-1-label"),
	img2: elById("image-2-label"),
	img3: elById("image-3-label")
}
const delButton = {
	img1: elById("image-1-delete"),
	img2: elById("image-2-delete"),
	img3: elById("image-3-delete")
}
const viewButton = {
	img1: elById("image-1-view"),
	img2: elById("image-2-view"),
	img3: elById("image-3-view")
}


// clear image values
images.img1.value = null;
images.img2.value = null;
images.img3.value = null;

images.img1.addEventListener("change", function(event) {
	processImage(event, 1);
});
images.img2.addEventListener("change", function(event) {
	processImage(event, 2);
});
images.img3.addEventListener("change", function(event) {
	processImage(event, 3);
});


delButton.img1.onclick = (e) => {
	deleteImage(1);
}
delButton.img2.onclick = (e) => {
	deleteImage(2);
}
delButton.img3.onclick = (e) => {
	deleteImage(3);
}


viewButton.img1.onclick = (e) => {
	viewImage(1);
};
viewButton.img2.onclick = (e) => {
	viewImage(2);
};
viewButton.img3.onclick = (e) => {
	viewImage(3);
};

elById("modal-close").onclick = (e) => {
	elById("modal").classList.remove("is-active");
}


function deleteImage(imgIndex) {
	let imgElement = elByName(`image-${imgIndex}`);
	if (!imgElement.files[0]) return;

	imgElement.value = null;
	elById(`image-${imgIndex}-label`).innerHTML = `Gambar ${imgIndex}...`;
}

function viewImage(imgIndex) {
	let imgElement = elByName(`image-${imgIndex}`).files[0];
	if (!imgElement) return;

	const imgSrc = URL.createObjectURL(imgElement);
	elById("modal-img").src = imgSrc;
	elById("modal").classList.add("is-active");
}

function processImage(e, imgIndex) {
	let file = e.target.files[0];

	const allowTypes = ["image/png", "image/jpeg"];
	if (!allowTypes.includes(file.type)) {
		imageError("Maaf, hanya bisa memilih file gambar saja.");
		e.preventDefault();
		return;
	}

	if (file.size > 3e+6) {
		imageError(`Maaf, ukuran gambar ${file.name} terlalu besar, maksimal ukuran 3 MB.`);
		e.preventDefault();
		return;
	}

	elById(`image-${imgIndex}-label`).innerHTML = e.target.files[0].name;
}

function imageError(msg) {
	elById("message").classList.remove("is-hidden");
	elById("message-body").innerHTML = msg;
}