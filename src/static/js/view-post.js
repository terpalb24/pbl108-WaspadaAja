const element = (id) => document.getElementById(id);

const modalTriggers = document.querySelectorAll(".display-modal");
modalTriggers.forEach(el => {
	el.onclick = (e) => {
		const img = e.target.dataset.imgsrc;
		element("modal-img").src = `/static/uploads/posts/${img}`;
		element("modal").classList.add("is-active");
	}
});

const modal = element("modal-close");
if (modal) {
	modal.onclick = (e) => {
		element("modal-img").src = '';
		element("modal").classList.remove("is-active");
	}
}