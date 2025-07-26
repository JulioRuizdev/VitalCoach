// Obtener datos del HTTP Request
const geminiResponse = $input.first().json;
const inputData = $input.first().json;

// Obtener datos originales del primer nodo
const mensaje = $('Preparar datos para Gemini').first().json.mensaje_original;
const userId = $('Preparar datos para Gemini').first().json.user_id;

let respuestaFinal = "";

try {
  // Extraer respuesta de Gemini
  if (geminiResponse.candidates && 
      geminiResponse.candidates[0] && 
      geminiResponse.candidates[0].content && 
      geminiResponse.candidates[0].content.parts &&
      geminiResponse.candidates[0].content.parts[0]) {
    
    respuestaFinal = geminiResponse.candidates[0].content.parts[0].text;
    respuestaFinal = respuestaFinal.trim();
    
    // Limitar longitud
    if (respuestaFinal.length > 800) {
      respuestaFinal = respuestaFinal.substring(0, 800) + "...";
    }
    
  } else {
    throw new Error("Formato de respuesta inesperado de Gemini");
  }
  
} catch (error) {
  console.error("Error procesando respuesta de Gemini:", error);
  
  respuestaFinal = `🥗 Disculpa, tuve un problema técnico procesando tu consulta. 

Como VitalCoach, puedo ayudarte con:
- 🍎 Planes alimentarios personalizados
- 💪 Consejos para ganar o perder peso
- 🥘 Recetas saludables y nutritivas
- 💧 Hidratación y hábitos saludables

¿Podrías reformular tu pregunta? Estoy aquí para ayudarte.`;
}

// Verificar que la respuesta sea válida
if (!respuestaFinal || respuestaFinal.length < 10) {
  respuestaFinal = `🌟 Gracias por tu consulta nutricional. Para darte el mejor consejo personalizado, ¿podrías contarme más detalles sobre tu situación específica?

Por ejemplo:
- 🎯 Tu objetivo (perder peso, ganar músculo, etc.)
- 🍽️ Tus hábitos alimentarios actuales
- 🏃‍♂️ Tu nivel de actividad física`;
}

return [{
  json: {
    respuesta: respuestaFinal,
    success: true,
    timestamp: new Date().toISOString(),
    user_id: userId,
    mensaje_original: mensaje
  }
}];