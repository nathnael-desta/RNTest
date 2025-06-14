import * as Location from "expo-location";
import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// const makeCall = async (location: Location.LocationObject | null) => {
//   if (!location) {
//     Alert.alert("Error", "Location not available.");
//     return;
//   }

//   const { latitude, longitude } = location.coords;
//   const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

//   try {
//     const response = await fetch("http://192.168.13.171:8000/emergency", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         location: locationUrl,
//       }),
//     });

//     if (response.ok) {
//       console.log("Twilio call and SMS triggered successfully");
//       Alert.alert("Emergency Triggered", "Twilio alert sent.");
//     } else {
//       console.error("Backend error:", response.status);
//       Alert.alert("Error", "Failed to trigger alert.");
//     }
//   } catch (error) {
//     console.error("Network error:", error);
//     Alert.alert("Error", "Could not contact backend.");
//   }
// };

export default function MriAnalyzer() {
  // const esp32Socket = useRef<WebSocket | null>(null);
  const predictSocket = useRef<WebSocket | null>(null);

  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [currentMessage, setCurrentMessage] = useState<string>("Path is clear");
  const [lastSpokenMessage, setLastSpokenMessage] = useState<string>("");

  const fetchLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      setErrorMsg("");
    } catch (e) {
      setErrorMsg("Failed to fetch location");
    }
  };

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        Alert.alert("Permission denied", "Cannot access location");
        return;
      }

      fetchLocation();
      intervalId = setInterval(fetchLocation, 3000);
    })();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // useEffect(() => {
  //   esp32Socket.current = new WebSocket(`ws://192.168.13.12`);

  //   esp32Socket.current.onopen = () => {
  //     console.log("Connected to ESP32 WebSocket");
  //   };

  //   esp32Socket.current.onmessage = (e) => {
  //     const message = e.data;
  //     console.log("Received WebSocket message:", message);

  //     if (message === "send sms and call") {
  //       makeCall(location);
  //     }
  //   };

  //   esp32Socket.current.onerror = (e) => {
  //     console.error("WebSocket error:", e);
  //   };

  //   esp32Socket.current.onclose = (e) => {
  //     console.log("WebSocket closed:", e.code, e.reason);
  //   };

  //   return () => {
  //     if (esp32Socket.current) {
  //       esp32Socket.current.close();
  //     }
  //   };
  // }, []);

  const openMap = () => {
    if (location) {
      const { latitude, longitude } = location.coords;
      const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      Linking.openURL(mapUrl);
    }
  };

  useEffect(() => {
    const socketUrl = "ws://192.168.16.47:8000/ws/predict";

    predictSocket.current = new WebSocket(socketUrl);

    predictSocket.current.onopen = () => {
      console.log("Connected to /ws/predict WebSocket");
    };

    predictSocket.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const message = `${data.speaking} ? ${data.speaking} : ""`.trim();

        console.log("Received prediction:", message);
        setCurrentMessage(message);
      } catch (err) {
        console.error("Failed to parse prediction:", err);
      }
    };

    predictSocket.current.onerror = (error) => {
      console.error("Prediction WebSocket error:", error);
    };

    predictSocket.current.onclose = (event) => {
      console.log("Prediction WebSocket closed:", event.code, event.reason);
    };

    return () => {
      if (predictSocket.current) {
        predictSocket.current.close();
      }
    };
  }, []);

  // Controlled speech logic
  useEffect(() => {
    if (!currentMessage) return;

    if (currentMessage !== lastSpokenMessage) {
      Speech.stop();
      Speech.speak(currentMessage, {
        rate: 1.5,
      });
      setLastSpokenMessage(currentMessage);
    }
  }, [currentMessage]);

  // Optional: allow "Path is clear" to be re-spoken after a timeout
  useEffect(() => {
    if (currentMessage === "clear!") {
      const timeout = setTimeout(() => {
        setLastSpokenMessage("");
      }, 10000); // reset after 10 secondsr
      return () => clearTimeout(timeout);
    }
  }, [currentMessage]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text>Listening for emergency triggers from ESP32...</Text>
      {/* <Button title="make call" onPress={() => makeCall(location)} /> */}

      <View style={styles.locationSection}>
        <Text style={styles.header}>Location Info:</Text>
        {location ? (
          <>
            <Text>Latitude: {location.coords.latitude}</Text>
            <Text>Longitude: {location.coords.longitude}</Text>
            <TouchableOpacity onPress={openMap}>
              <Text style={styles.link}>Open in Google Maps</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text>{errorMsg || "Fetching location..."}</Text>
        )}
        <View style={styles.button}>
          <Button title="Refresh Location Now" onPress={fetchLocation} />
        </View>
      </View>

      <View style={{ marginTop: 30 }}>
        <Text style={styles.header}>Last Message:</Text>
        <Text>{currentMessage}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 60,
    alignItems: "center",
  },
  header: {
    fontWeight: "bold",
    marginBottom: 10,
    fontSize: 16,
  },
  link: {
    marginTop: 10,
    color: "#007AFF",
    textDecorationLine: "underline",
  },
  button: {
    marginTop: 20,
    width: "80%",
  },
  locationSection: {
    marginTop: 30,
    alignItems: "center",
  },
});
