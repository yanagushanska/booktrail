export async function downloadImageFromUrl(url, filename) {
	if (!url) {
		throw new Error("Missing image URL.");
	}

	const response = await fetch(url);

	if (!response.ok) {
		throw new Error("Unable to download the image.");
	}

	const blob = await response.blob();
	const objectUrl = URL.createObjectURL(blob);
	const link = document.createElement("a");

	link.href = objectUrl;
	link.download = filename;
	link.style.display = "none";
	document.body.append(link);
	link.click();
	link.remove();
	window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}