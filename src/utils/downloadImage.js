export async function downloadImageFromUrl(url, filename) {
	if (!url) {
		throw new Error("Missing image URL.");
	}

	const response = await fetch(url);

	if (!response.ok) {
		throw new Error("Unable to download the image.");
	}

	const blob = await response.blob();
	const downloadBlob =
		blob.type === "application/octet-stream"
			? blob
			: new Blob([blob], { type: "application/octet-stream" });
	const objectUrl = URL.createObjectURL(downloadBlob);
	const link = document.createElement("a");

	link.href = objectUrl;
	link.download = filename;
	link.style.display = "none";
	document.body.append(link);
	link.click();
	link.remove();
	window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}