import { Alert } from 'react-native';

export const CLOUDINARY_CLOUD_NAME = 'ddtdn6fum';

export const uploadImageToCloudinary = async (fileUri: string) => {
  try {
    const formData = new FormData();

    // 🔥 FIX FOR WEB (use base64)
    const responseFetch = await fetch(fileUri);
    const blob = await responseFetch.blob();

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    formData.append("file", base64);
    formData.append("upload_preset", "jaihindsportsfit");

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/ddtdn6fum/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    console.log("🔥 FULL RESPONSE:", data);

    if (data.secure_url) {
      console.log("✅ SUCCESS:", data.secure_url);
      return data.secure_url;
    } else {
      throw new Error(data.error?.message);
    }

  } catch (error) {
    console.error("❌ Upload error:", error);
    throw error;
  }
};
