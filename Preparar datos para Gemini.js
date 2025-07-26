// Extraer datos del webhook con validación
const body = $input.first().json.body || {};
const mensaje = body.mensaje || '';
const userId = body.user_id || 'anonymous';
const historial = body.historial || [];

// Logging para debugging
console.log('=== DATOS RECIBIDOS ===');
console.log('Mensaje:', mensaje);
console.log('User ID:', userId);
console.log('Historial length:', historial.length);
console.log('Historial:', JSON.stringify(historial, null, 2));

// Validar que hay mensaje
if (!mensaje || mensaje.trim() === '') {
  throw new Error('No se recibió mensaje válido');
}

// System prompt optimizado para VitalCoach
const systemPrompt = `Eres VitalCoach, un nutricionista virtual especializado y amigable. 

🎯 TU ESPECIALIZACIÓN:
- Nutrición clínica y deportiva
- Planes alimentarios personalizados  
- Pérdida y ganancia de peso saludable
- Educación nutricional práctica
- Hábitos alimenticios sostenibles

💬 TU ESTILO DE COMUNICACIÓN:
- Usa emojis relevantes pero con moderación (🥗🍎💪⚖️🌟)
- Sé amigable, cálido y profesional
- Da consejos prácticos y específicos
- Haz preguntas relevantes para personalizar
- Usa formato claro y organizado
- Mantén respuestas entre 50-150 palabras
- Sé conversacional y natural

⚠️ TUS LIMITACIONES:
- NUNCA diagnostiques enfermedades
- NO reemplaces consulta médica profesional
- Si mencionan condiciones médicas, recomienda consultar médico
- Enfócate SOLO en nutrición y alimentación saludable
- No des consejos sobre medicamentos o suplementos específicos

Responde SIEMPRE en español de forma natural y conversacional. Sé útil, motivador y comprensivo.`;

// Construir historial de conversación para Gemini
let mensajesParaGemini = [];

// Agregar contexto del sistema (solo una vez)
mensajesParaGemini.push({
  role: "user",
  parts: [{ text: systemPrompt }]
});

mensajesParaGemini.push({
  role: "model", 
  parts: [{ text: "¡Hola! Soy VitalCoach, tu nutricionista virtual personalizado. Estoy aquí para ayudarte con consejos nutricionales, planes alimentarios y hábitos saludables. ¿En qué puedo ayudarte hoy? 🥗✨" }]
});

// Agregar historial previo (limitado para evitar token overflow)
if (historial && historial.length > 0) {
  // Limitar a las últimas 4 interacciones (2 pares pregunta-respuesta)
  const historialLimitado = historial.slice(-4);
  
  console.log('Procesando historial limitado:', historialLimitado.length, 'mensajes');
  
  historialLimitado.forEach((msg, index) => {
    if (msg && msg.role && msg.content) {
      if (msg.role === 'user') {
        mensajesParaGemini.push({
          role: "user",
          parts: [{ text: msg.content.substring(0, 500) }] // Limitar longitud
        });
      } else if (msg.role === 'assistant') {
        mensajesParaGemini.push({
          role: "model",
          parts: [{ text: msg.content.substring(0, 500) }] // Limitar longitud
        });
      }
    }
  });
}

// Agregar mensaje actual
mensajesParaGemini.push({
  role: "user",
  parts: [{ text: mensaje.substring(0, 1000) }] // Limitar mensaje actual también
});

// Preparar payload optimizado para Gemini
const geminiPayload = {
  contents: mensajesParaGemini,
  generationConfig: {
    temperature: 0.8, // Más creativo
    topK: 40,
    topP: 0.9,
    maxOutputTokens: 512, // Reducido para evitar límites
    candidateCount: 1,
    stopSequences: []
  },
  safetySettings: [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH", 
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    }
  ]
};

// Logging del payload final
console.log('=== PAYLOAD PARA GEMINI ===');
console.log('Total de mensajes:', mensajesParaGemini.length);
console.log('Último mensaje:', mensajesParaGemini[mensajesParaGemini.length - 1]);

// Validar payload antes de enviar
if (!geminiPayload.contents || geminiPayload.contents.length === 0) {
  throw new Error('Payload vacío para Gemini');
}

return [{
  json: {
    geminiPayload: geminiPayload,
    mensaje_original: mensaje,
    user_id: userId,
    timestamp: new Date().toISOString(),
    historial_count: historial.length
  }
}];