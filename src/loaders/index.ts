export const loadImage = async (url: string) => {
    const img = document.createElement("img");
    img.src = url;
    await img.decode();
    return await createImageBitmap(img);
}