import React, { useEffect, useRef } from "react";
import { Button, ScrollView, StyleSheet, Text } from "react-native";

import makeCall from "@/script/makeCall";

export default function MriAnalyzer() {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // const esp32IP = "192.168.0.123"; // Replace with your ESP32's actual IP
    ws.current = new WebSocket(`ws://192.168.13.12`);

    ws.current.onopen = () => {
      console.log("Connected to ESP32 WebSocket");
    };

    ws.current.onmessage = (e) => {
      const message = e.data;
      console.log("Received WebSocket message:", message);

      if (message === "send sms and call") {
        makeCall();
      }
    };

    ws.current.onerror = (e) => {
      console.error("WebSocket error:", e);
    };

    ws.current.onclose = (e) => {
      console.log("WebSocket closed:", e.code, e.reason);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text>Listening for emergency triggers from ESP32...</Text>
      <Button title="make call" onPress={makeCall} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 60,
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 300,
    marginTop: 20,
  },
  resultContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  resultValue: {
    fontSize: 20,
    marginBottom: 10,
    color: "#007AFF",
  },
  disclaimer: {
    marginTop: 20,
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
});
