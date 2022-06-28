
const BACKEND_SERVICE_URL = "http://localhost:8000";
// const BACKEND_SERVICE_URL = "http://13.213.186.104:8000";

class SaveDiagramToSharePoint {

	constructor() {}

	async execute(filename, code, imageThumb) {

		const formData = new FormData();

		formData.append("filename", filename);
		formData.append("content", code);
		formData.append("content_image", imageThumb);

		console.log(formData);

		const response = await fetch(BACKEND_SERVICE_URL + "/save", {
			method: "POST",
			body: formData
		})

		const responseJson = await response.json();

		if (responseJson === "ok") {
			alert("Diagram berhasil tersimpan.");
		} else {
			alert("Terjadi kesalahan saat menyimpan. Silahkan coba beberapa saat lagi.");
		}
	}
}

class GetListDiagramsFromSharePoint {

	constructor() {}

	execute() {

	}
}