import { Alert } from "react-native";


const makeCall = async () => {
  try {
    const response = await fetch(
      "http://127.0.0.1:8000/emergency",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (response.ok) {
      console.log("Twilio call and SMS triggered successfully");
      Alert.alert("Emergency Triggered", "Twilio alert sent.");
    } else {
      console.error("Backend error:", response.status);
      Alert.alert("Error", "Failed to trigger alert.");
    }
  } catch (error) {
    console.error("Network error:", error);
    Alert.alert("Error", "Could not contact backend.");
  }
};

export default makeCall;
