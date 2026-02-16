import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, Image, Rect, Text as SvgText } from "react-native-svg";

export default function ImgTop({ title }) {
  return (
    <View style={styles.container}>
      <Svg
        width="100%"
        height="250"
        viewBox="0 0 430 250"
        preserveAspectRatio="none"
      >
        <Defs>
          <Pattern
            id="pattern"
            patternUnits="userSpaceOnUse"
            width={1024}
            height={1024}
            patternTransform="scale(0.4)"
          >
            <Image
              href={require("../assets/FondoPatron.png")}
              width={1024}
              height={1024}
              opacity={0.15}
            />
          </Pattern>
        </Defs>

        {/* Fondo verde */}
        <Rect x="0" y="0" width="430" height="120" fill="#27AE60" />
        {/* Patrón encima */}
        <Rect x="0" y="0" width="430" height="120" fill="url(#pattern)" />

        {/* Texto centrado */}
        <SvgText
          x="50%"              // centro horizontal
          y="30%"              // centro vertical
          fontSize="28"
          fill="#fff"
          fontWeight="bold"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {title}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 0,
  },
});
