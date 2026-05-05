import { Alert, Platform } from 'react-native';

export const CLOUDINARY_CLOUD_NAME = 'ddtdn6fum';

export const uploadImageToCloudinary = async (fileUri: string) => {
  try {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      // 🔥 FIX FOR WEB (use blob)
      const responseFetch = await fetch(fileUri);
      const blob = await responseFetch.blob();
      formData.append("file", blob);
    } else {
      // 🔥 FIX FOR MOBILE (React Native FormData needs specific object)
      // On Android/iOS, we don't convert to base64 or blob, we use the local URI directly
      const filename = fileUri.split('/').pop() || 'upload.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      formData.append("file", {
        uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
        type: type,
        name: filename,
      } as any);
    }

    formData.append("upload_preset", "jaihindsportsfit");

    console.log("☁️ Uploading to Cloudinary...");
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const data = await response.json();

    if (data.secure_url) {
      console.log("✅ Cloudinary Success:", data.secure_url);
      return data.secure_url;
    } else {
      console.error("❌ Cloudinary Error Response:", data);
      throw new Error(data.error?.message || "Cloudinary upload failed");
    }

  } catch (error: any) {
    console.error("❌ Cloudinary Upload Network Error:", error);
    throw new Error(error.message || "Network request failed");
  }
};
