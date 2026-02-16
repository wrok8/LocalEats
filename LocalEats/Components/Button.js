import { Pressable, Text } from "react-native";

export default function Button({ title, onPress, variant }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 330,
        height: 48,
        backgroundColor: variant === "primary" ? "#27AE60" : "#FFFFFF",
        borderWidth: variant === "secondary" ? 1.5 : 0,
        borderColor: "#27AE60",
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: variant === "primary" ? "#fff" : "#27AE60",
          fontWeight: "600",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
