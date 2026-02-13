import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import Svg, { Path, Defs, Pattern, Image, Rect } from "react-native-svg";

const { width, height } = Dimensions.get("window");

export default function App() {

  function SvgTop(){
    return(
      <Svg
        width="100%"
        height={350}
        viewBox="0 0 430 260"
        preserveAspectRatio="none"
        style={styles.svgTop}
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
              href={require("./assets/FondoPatron.png")}
              width={1024}
              height={1024}
              opacity={0.15}
            />
          </Pattern>
        </Defs>

        <Path
          fill="#27AE60"
          d="M0,0 H430 V180
             C350,210 280,230 215,210
             C150,190 100,150 0,170 Z"
        />

        <Path
          fill="url(#pattern)"
          d="M0,0 H430 V180
             C350,210 280,230 215,210
             C150,190 100,150 0,170 Z"
        />
      </Svg>
    )
  }

  function SvgLogo(){
    return(
      <Svg
        width={250}
        height={250}
        viewBox="0 0 290 250"
      >
        <Defs>
          <Pattern
            id="logoPattern"
            patternUnits="userSpaceOnUse"
            width={265}
            height={250}
          >
            <Image
              href={require("./assets/logo.png")}
              width={300}
              height={300}
            />
          </Pattern>
        </Defs>

        <Path
          fill="url(#logoPattern)"
          d="M0 0h265v265H0z"
        />
      </Svg>
    )
  }

  function SvgBotonIniciarSesion(){
    return(
      <Svg width={width * 0.9} height={48}>
        <Rect
          width="100%"
          height="100%"
          fill="#27AE60"
          
          rx={12}
        />
      </Svg>
    )
  }

function SvgBotonRegistrarse(){
  return(
    <Svg width={width * 0.9} height={48}>
      <Rect
        width="100%"
        height="100%"
        fill="#FFFFFF"          // fondo blanco
        stroke="#27AE60"        // borde verde moderno
        strokeWidth={1.5}       // contorno delgado
        rx={14}                 // bordes suaves
      />
    </Svg>
  ) 
}


  return (
    <View style={styles.mainContainer}>

      {/* Fondo */}
      <SvgTop/>

      {/* Logo */}
      <View style={styles.logoContainer}>
        <SvgLogo/>
      </View>

     {/* Contenedor de ambos botones */}
      <View style={styles.contentContainer}>

        {/* Botón Login */}
        <View style={styles.buttonContainer}>
          <SvgBotonIniciarSesion/>
          <Text style={styles.buttonText}>
            Iniciar Sesión
          </Text>
        </View>

        {/* Botón Registrarse */}
        <View style={[styles.buttonContainer, { marginTop: 20 }]}>
          <SvgBotonRegistrarse/>
          <Text style={styles.buttonTextSecondary}>
            Registrarse
          </Text>
        </View>

      </View>

      <StatusBar style="light" />

    </View>
  );
}

const styles = StyleSheet.create({

  mainContainer:{
    flex:1,
    backgroundColor:"#f1f1f1",
  },

  svgTop:{
    position:"absolute",
    top:0,
    left:0,
  },

  logoContainer:{
    position:"absolute",
    top: height * 0.30,
    width:"100%",
    alignItems:"center",
  },

  contentContainer:{
    position:"absolute",
    top: height * 0.35,
    width:"100%",
    alignItems:"center",
  },

  title:{
    fontSize:32,
    fontWeight:"bold",
    color:"#27AE60",
    marginBottom:20,
  },

  buttonContainer:{
    justifyContent:"center",
    alignItems:"center",
    top: height * 0.20,
  },

  buttonText:{
    position:"absolute",
    color:"#fff",
    fontSize:16,
    fontWeight:"bold",
  },
  buttonTextSecondary:{
  position:"absolute",
  color:"#27AE60",
  fontSize:16,
  fontWeight:"600",  // más moderno que bold
  }

});
