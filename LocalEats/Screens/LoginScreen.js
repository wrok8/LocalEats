import { StatusBar } from 'expo-status-bar';
import Checkbox from 'expo-checkbox';
import { StyleSheet, View, Text, Pressable, Dimensions } from 'react-native';
const { width, height } = Dimensions.get("window");
import { useState } from 'react';
import Svg, { Path, Circle } from "react-native-svg";
import Button from '../Components/Button';
import ImgTop from '../Components/ImageTop';
import AppTextInput from '../Components/TextTittle';

export default function LoginScreen({ navigation }) {

  return (
    <View style={styles.mainContainer}>

      <ImgTop title="Iniciar Sesión" />

      {/* Inputs */}
      <View style={styles.contentContainer}>
        <AppTextInput
          label="Correo"
          placeholder="Ingresa tu correo"
        />

        <AppTextInput
          label="Contraseña"
          placeholder="Ingresa tu contraseña"
          secureTextEntry
        />
      </View>

      {/* Checkbox + Olvide la contraseña */}
      <View style={styles.CheckboxContainer}>
        <AppCheckBox
          onForgotPress={() => navigation.navigate("RecuperarContraseña")}
        />
      </View>

      {/* Botón */}
      <View style={styles.ButtonContainer}>
        <Button
          title="Iniciar Sesion"
          variant="primary"
          onPress={() => navigation.replace("MainTabs")}
        />
      </View>

    {/* Línea decorativa */}
          <View style={styles.lineContainer}>
            <SvgLineal />
          </View>
    
          <StatusBar style="light" />
    </View>
  );
}


/* COMPONENTE CHECKBOX */
function AppCheckBox({ onForgotPress }) {

  const [isChecked, setChecked] = useState(false);

  return (
    <View style={styles.rowContainer}>

      {/* IZQUIERDA */}
      <View style={styles.leftContainer}>

        <Checkbox
          style={styles.checkbox}
          value={isChecked}
          onValueChange={setChecked}
          color={isChecked ? '#27AE60' : undefined}
        />

        <Text style={styles.rememberText}>
          Recuérdame
        </Text>

      </View>

      {/* Recuperar Contraseña */}
      <Pressable onPress={onForgotPress}>
        <Text style={styles.forgotText}>
          ¿Olvidaste la contraseña?
        </Text>
      </Pressable>
    </View>
  );
}

function SvgLineal() {
    return (
      <Svg
        width={width * 0.9}
        height={24}
      >
        <Path
          stroke="#575757"
          strokeWidth="1"
          d={`M0 12 H${width*0.45 - 10}`}
        />
        <Circle
          cx={width*0.45}
          cy="12"
          r="6"
          fill="#27AE60"
        />
        <Path
          stroke="#575757"
          strokeWidth="1"
          d={`M${width*0.45 + 10} 12 H${width*0.9}`}
        />
      </Svg>
    );
}


/* ESTILOS */
const styles = StyleSheet.create({

  mainContainer: {
    flex: 1,
    backgroundColor: "#f1f1f1",
  },

  contentContainer: {
    marginTop: 150,
    width: "100%",
    alignItems: "center",
  },

  CheckboxContainer: {
    width: "100%",
    paddingHorizontal: 36,
    marginTop: 10,
  },

  ButtonContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 40,
  },


  /* CONTENEDOR PRINCIPAL */
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between", // ← clave
    alignItems: "center",
  },


  /* IZQUIERDA */
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },


  checkbox: {
    marginRight: 8,
  },


  rememberText: {
    fontSize: 16,
    color: "#27AE60",
  },


  /* DERECHA */
  forgotText: {
    fontSize: 14,
    color: "#27AE60",
    fontWeight: "500",
  },

    lineContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 30,
  },

});
