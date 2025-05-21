import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function LocationExample() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

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

  const openMap = () => {
    if (location) {
      const { latitude, longitude } = location.coords;
      const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      Linking.openURL(mapUrl);
    }
  };

  return (
    <View style={styles.container}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontWeight: "bold",
    marginBottom: 10,
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
});
